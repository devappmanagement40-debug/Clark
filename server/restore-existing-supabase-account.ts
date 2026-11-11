import pg from "pg";
import { hashAdminPin } from "./admin-pin";

const { Pool } = pg;

const transferableUserColumns = [
  "full_name",
  "phone",
  "country",
  "password",
  "referral_code",
  "referred_by",
  "balance",
  "today_earnings",
  "total_earnings",
  "is_admin",
  "is_super_admin",
  "is_banned",
  "is_withdrawal_blocked",
  "is_promoter",
  "must_invite_to_withdraw",
  "has_deposited",
  "has_active_product",
  "created_at",
  "last_free_product_claim",
  "last_daily_bonus_claim",
  "promoter_set_by",
  "admin_set_by",
  "admin_set_at",
  "admin_pin",
  "is_admin_password_required",
  "is_banker",
  "banker_set_by",
] as const;

function supabaseProjectRef(parsed: URL): string | undefined {
  const hostname = parsed.hostname.toLowerCase();
  const directMatch = hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  if (directMatch) return directMatch[1];

  // Supabase's regional pooler hosts are shared; the project ref is in the username.
  if (hostname.endsWith(".pooler.supabase.com")) {
    const username = decodeURIComponent(parsed.username);
    const poolerMatch = username.match(/^postgres\.([a-z0-9]+)$/i);
    if (poolerMatch) return poolerMatch[1].toLowerCase();
  }

  return undefined;
}

export function databaseIdentity(connectionString: string): string {
  const parsed = new URL(connectionString);
  const projectRef = supabaseProjectRef(parsed);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (projectRef) return `supabase:${projectRef}/${databaseName}`;

  return `${parsed.hostname.toLowerCase()}:${parsed.port || "5432"}${parsed.pathname}`;
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export async function restoreExistingAccountToSupabase(): Promise<void> {
  const sourceUrl = process.env.DATABASE_URL;
  const targetUrl = process.env.SUPABASE_NEW_DATABASE_URL;
  const phone = process.env.ADMIN_PHONE;
  const adminPin = process.env.ADMIN_PIN;

  const missingConfiguration = [
    ["DATABASE_URL", sourceUrl],
    ["SUPABASE_NEW_DATABASE_URL", targetUrl],
    ["ADMIN_PHONE", phone],
    ["ADMIN_PIN", adminPin],
  ]
    .filter((entry) => !entry[1])
    .map(([name]) => name);

  if (missingConfiguration.length > 0) {
    throw new Error(
      `Account restoration is missing configured variables: ${missingConfiguration.join(", ")}.`,
    );
  }
  if (!sourceUrl || !targetUrl || !phone || !adminPin) {
    throw new Error("Account restoration is missing required configuration.");
  }
  if (databaseIdentity(sourceUrl) === databaseIdentity(targetUrl)) {
    throw new Error("Source and destination databases are identical; refusing account restoration.");
  }

  const sourcePool = new Pool({
    connectionString: sourceUrl,
    ssl: { rejectUnauthorized: false },
  });
  const targetPool = new Pool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    let sourceResult = await sourcePool.query(
      "SELECT * FROM public.users WHERE phone = $1 LIMIT 2",
      [phone],
    );

    if (sourceResult.rows.length === 0) {
      const digits = normalizePhone(phone);
      const variants = Array.from(new Set([
        digits,
        digits.replace(/^0/, ""),
        `225${digits}`,
        `225${digits.replace(/^0/, "")}`,
      ]));
      sourceResult = await sourcePool.query(
        `SELECT * FROM public.users
         WHERE regexp_replace(phone, '[^0-9]', '', 'g') = ANY($1::text[])
         LIMIT 3`,
        [variants],
      );
    }

    if (sourceResult.rows.length !== 1) {
      throw new Error("Could not uniquely identify the existing account in the preserved Supabase database.");
    }

    const sourceUser = sourceResult.rows[0] as Record<string, unknown>;
    const sourcePhone = typeof sourceUser.phone === "string" ? sourceUser.phone : "";
    if (!sourcePhone || !normalizePhone(sourcePhone)) {
      throw new Error("The source account is missing a valid phone number.");
    }

    const destinationColumnsResult = await targetPool.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users'`,
    );
    const destinationColumns = new Set(
      destinationColumnsResult.rows.map(({ column_name }) => column_name),
    );
    const columns = transferableUserColumns.filter(
      (column) => destinationColumns.has(column) && sourceUser[column] !== undefined,
    );
    const requiredColumns = ["full_name", "phone", "country", "password", "referral_code", "balance"];
    if (requiredColumns.some((column) => !columns.includes(column as typeof columns[number]))) {
      throw new Error("The existing account schema does not match the new Supabase users table.");
    }
    for (const requiredColumn of ["is_admin", "is_super_admin", "admin_pin"]) {
      if (!destinationColumns.has(requiredColumn)) {
        throw new Error("The new Supabase users table is missing administrator fields.");
      }
    }

    const client = await targetPool.connect();
    try {
      await client.query("BEGIN");
      const existingResult = await client.query(
        "SELECT id, full_name, referral_code FROM public.users WHERE phone = $1 FOR UPDATE",
        [phone],
      );
      let destinationId: number | undefined = existingResult.rows[0]?.id;

      if (existingResult.rows.length === 0) {
        const allUsers = await client.query(
          "SELECT id, full_name, referral_code, is_admin, is_super_admin FROM public.users FOR UPDATE",
        );
        const bootstrapUser = allUsers.rows.length === 1
          && allUsers.rows[0].full_name === "Super Admin"
          && allUsers.rows[0].referral_code === "ADMIN1"
          && allUsers.rows[0].is_admin
          && allUsers.rows[0].is_super_admin;

        if (bootstrapUser) {
          destinationId = allUsers.rows[0].id;
        } else if (allUsers.rows.length > 0) {
          throw new Error("The new Supabase contains other users; refusing to overwrite or duplicate an account.");
        }
      }

      const valuesByColumn: Record<string, unknown> = Object.fromEntries(
        columns.map((column) => [column, sourceUser[column]]),
      );
      valuesByColumn.phone = phone;
      valuesByColumn.is_admin = true;
      valuesByColumn.is_super_admin = true;
      valuesByColumn.admin_pin = await hashAdminPin(adminPin);

      if (destinationId !== undefined) {
        const updateColumns = columns.filter((column) => column !== "phone");
        const assignments = updateColumns.map((column, index) => `"${column}" = $${index + 1}`);
        const values = updateColumns.map((column) => valuesByColumn[column]);
        assignments.push(`"phone" = $${values.length + 1}`);
        values.push(phone, destinationId);
        await client.query(
          `UPDATE public.users SET ${assignments.join(", ")} WHERE id = $${values.length}`,
          values,
        );
        console.log("[account-restore] Existing Supabase row updated with preserved account data and admin access.");
      } else {
        const insertColumns = columns;
        const values = insertColumns.map((column) => valuesByColumn[column]);
        const placeholders = insertColumns.map((_, index) => `$${index + 1}`);
        await client.query(
          `INSERT INTO public.users (${insertColumns.map((column) => `"${column}"`).join(", ")})
           VALUES (${placeholders.join(", ")})`,
          values,
        );
        await client.query(
          `SELECT setval(pg_get_serial_sequence('public.users', 'id'),
            COALESCE((SELECT MAX(id) FROM public.users), 1), true)`,
        );
        console.log("[account-restore] Existing Supabase row restored with admin access.");
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[account-restore]")) {
      throw error;
    }
    throw new Error("[account-restore] Restoration failed; no source data was changed.");
  } finally {
    await Promise.all([sourcePool.end(), targetPool.end()]);
  }
}