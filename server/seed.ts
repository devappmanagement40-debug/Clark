import { db } from "./db";
import { users, tasks, paymentChannels, platformSettings, countries, paymentNumbers, products } from "@shared/schema";
import { getActiveCountryMethodNames, parseCountryMethodEntries } from "@shared/country-methods";
import { catlVipOffers } from "@shared/catl-vip-offers";
import { DEFAULT_MINIMUM_DEPOSIT, DEFAULT_MINIMUM_WITHDRAWAL } from "@shared/platform-settings";
import bcrypt from "bcrypt";
import { and, eq, inArray, sql } from "drizzle-orm";
import { hashAdminPin } from "./admin-pin";

// Bump this when the production bootstrap below gains a required schema/data migration.
const PRODUCTION_BOOTSTRAP_VERSION = "1";
const PRODUCTION_BOOTSTRAP_VERSION_KEY = "__production_bootstrap_version";

async function inferAdminCountryFromPhone(phone: string): Promise<string | undefined> {
  const normalizedPhone = phone.trim();
  const digits = normalizedPhone.replace(/\D/g, "");
  const internationalDigits = normalizedPhone.startsWith("+")
    ? digits
    : normalizedPhone.startsWith("00")
      ? digits.slice(2)
      : "";
  if (!internationalDigits) return undefined;

  const configuredCountries = await db
    .select({ code: countries.code, phonePrefix: countries.phonePrefix })
    .from(countries);
  const matches = configuredCountries
    .map((country) => ({
      code: country.code,
      prefix: country.phonePrefix.replace(/\D/g, ""),
    }))
    .filter((country) => country.prefix && internationalDigits.startsWith(country.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  if (!matches.length) return undefined;
  const longestPrefix = matches[0].prefix.length;
  const bestMatches = new Set(
    matches.filter((country) => country.prefix.length === longestPrefix).map((country) => country.code),
  );
  return bestMatches.size === 1 ? bestMatches.values().next().value : undefined;
}

async function synchronizeConfiguredAdmin() {
  const adminPhone = process.env.ADMIN_PHONE?.trim();
  if (!adminPhone) {
    console.warn("ADMIN_PHONE is not configured; administrator bootstrap skipped.");
    return;
  }
  const existingAdmin = await db.select().from(users).where(eq(users.phone, adminPhone));
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPin = process.env.ADMIN_PIN;
  const hashedAdminPin = adminPin ? await hashAdminPin(adminPin) : null;

  if (existingAdmin.length === 0) {
    if (!adminPassword) {
      console.warn("No administrator exists yet; set ADMIN_PASSWORD to provision the initial admin.");
      return;
    }

    const adminCountry = await inferAdminCountryFromPhone(adminPhone);
    if (!adminCountry) {
      console.warn("Cannot provision the initial admin: use an international phone number with an unambiguous configured country prefix.");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await db.insert(users).values({
      fullName: "Super Admin",
      phone: adminPhone,
      country: adminCountry,
      password: hashedPassword,
      referralCode: "ADMIN1",
      balance: "0",
      isAdmin: true,
      isSuperAdmin: true,
      adminPin: hashedAdminPin,
    });
    console.log("Super admin created");
    if (adminPin) console.log("Super admin PIN configured");
    return;
  }

  const updateData: { isAdmin: boolean; isSuperAdmin: boolean; adminPin?: string } = {
    isAdmin: true,
    isSuperAdmin: true,
  };
  if (hashedAdminPin) {
    updateData.adminPin = hashedAdminPin;
    console.log("Super admin PIN updated");
  }
  await db.update(users).set(updateData).where(eq(users.phone, adminPhone));
  console.log("Super admin access verified");
}

export async function seed() {
  await synchronizeConfiguredAdmin();

  // Additive payment configuration migration; run even when the production seed is already current.
  await db.execute(sql`
    ALTER TABLE "payment_numbers" ADD COLUMN IF NOT EXISTS "qr_image_url" text
  `).catch(() => undefined);

  if (process.env.NODE_ENV === "production") {
    const [bootstrapVersion] = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, PRODUCTION_BOOTSTRAP_VERSION_KEY))
      .limit(1);
    if (bootstrapVersion?.value === PRODUCTION_BOOTSTRAP_VERSION) {
      console.log(`Production bootstrap ${PRODUCTION_BOOTSTRAP_VERSION} already applied; skipping seed.`);
      return;
    }
  }

  console.log("Seeding database...");

  // Create session table for connect-pg-simple (if not exists)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);
  await db.execute(sql`
    ALTER TABLE "payment_numbers" ALTER COLUMN "phone" DROP NOT NULL
  `).catch(() => undefined);
  await db.execute(sql`
    ALTER TABLE "payment_numbers" ADD COLUMN IF NOT EXISTS "payment_link" text
  `).catch(() => undefined);
  await db.execute(sql`
    ALTER TABLE "payment_numbers" ADD COLUMN IF NOT EXISTS "qr_image_url" text
  `).catch(() => undefined);
  await db.execute(sql`
    ALTER TABLE "deposits" ADD COLUMN IF NOT EXISTS "withdrawal_fee_payment_id" integer
  `).catch(() => undefined);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "withdrawal_fee_payments" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL REFERENCES "users"("id"),
      "withdrawal_amount" integer NOT NULL,
      "required_amount" integer NOT NULL,
      "status" text NOT NULL DEFAULT 'pending',
      "deposit_id" integer,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "paid_at" timestamp,
      "used_at" timestamp
    )
  `).catch(() => undefined);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "withdrawal_fee_payments_user_status_idx"
      ON "withdrawal_fee_payments" ("user_id", "status")
  `).catch(() => undefined);

  // Ensure countries table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "countries" (
      "id" serial PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "name" text NOT NULL,
      "currency" text NOT NULL,
      "phone_prefix" text NOT NULL,
      "operators" text NOT NULL DEFAULT '[]',
      "withdrawal_methods" text,
      "is_active" boolean NOT NULL DEFAULT true
    )
  `);
  await db.execute(sql`
    ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "withdrawal_methods" text
  `);

  const requestedCountries = [
    {
      code: "TG",
      name: "Togo",
      currency: "XOF",
      phonePrefix: "228",
      operators: ["Togocel", "Moov Africa Togo"],
      withdrawalMethods: ["Togocel", "Moov Africa Togo"],
      isActive: true,
    },
    {
      code: "CI",
      name: "Côte d'Ivoire",
      currency: "XOF",
      phonePrefix: "225",
      operators: [],
      withdrawalMethods: ["Wave"],
      isActive: true,
    },
    {
      code: "BF",
      name: "Burkina Faso",
      currency: "XOF",
      phonePrefix: "226",
      operators: ["Orange Burkina", "Moov Africa Burkina"],
      withdrawalMethods: ["Orange Burkina", "Moov Africa Burkina"],
      isActive: true,
    },
    {
      code: "NE",
      name: "Niger",
      currency: "XOF",
      phonePrefix: "227",
      operators: ["NITA TRANSFERT", "AMANA TRANSFERT"],
      withdrawalMethods: ["Airtel Money", "Wave", "NITA TRANSFERT"],
      isActive: true,
    },
    {
      code: "BJ",
      name: "Bénin",
      currency: "XOF",
      phonePrefix: "229",
      operators: ["MTN Bénin", "Moov Africa Bénin"],
      withdrawalMethods: ["MTN Bénin", "Moov Africa Bénin"],
      isActive: true,
    },
  ].map((country) => ({
    ...country,
    operators: JSON.stringify(country.operators),
    withdrawalMethods: JSON.stringify(country.withdrawalMethods),
  }));

  // Seed countries only on first install — never overwrite admin changes
  const existingCountries = await db.select().from(countries);
  if (existingCountries.length === 0) {
    for (const countryData of requestedCountries) {
      await db.insert(countries).values(countryData);
      console.log(`Country added: ${countryData.name}`);
    }
  } else {
    console.log(`Countries skipped — ${existingCountries.length} existing countries preserved`);
  }

  const countryCatalogMigrationKey = "country_catalog_requested_west_africa_applied";
  const countryCatalogMigration = await db.transaction(async (tx) => {
    const [marker] = await tx.insert(platformSettings)
      .values({ key: countryCatalogMigrationKey, value: "applied" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });
    if (!marker) return null;

    const [tchadAccounts] = await tx.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.country, "TD"));

    for (const countryData of requestedCountries) {
      await tx.insert(countries).values(countryData).onConflictDoNothing();
    }

    const requestedCountryCodes = new Set(requestedCountries.map((country) => country.code));
    const countryRows = await tx.select().from(countries);
    for (const country of countryRows) {
      const shouldBeActive = requestedCountryCodes.has(country.code.toUpperCase());
      if (country.isActive !== shouldBeActive) {
        await tx.update(countries)
          .set({ isActive: shouldBeActive })
          .where(eq(countries.id, country.id));
      }
    }

    return tchadAccounts?.count ?? 0;
  });
  if (countryCatalogMigration !== null) {
    console.log(`[country catalog] Applied requested countries; retained ${countryCatalogMigration} existing Tchad account(s) and historical records.`);
  }

  const togoDepositMethodsMigrationKey = "togo_deposit_methods_moov_tmoney_applied";
  const togoDepositMethodsMigration = await db.transaction(async (tx) => {
    const [togo] = await tx.select({ id: countries.id, operators: countries.operators })
      .from(countries)
      .where(eq(countries.code, "TG"))
      .limit(1);
    if (!togo) return "missing";

    const [marker] = await tx.insert(platformSettings)
      .values({ key: togoDepositMethodsMigrationKey, value: "applied" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });
    if (!marker) return "already-applied";

    const methods = parseCountryMethodEntries(togo.operators);
    const normalizeName = (name: string) => name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
    let changed = false;

    const moov = methods.find((method) => normalizeName(method.name).includes("moov"));
    if (moov) {
      if (!moov.isActive) {
        moov.isActive = true;
        changed = true;
      }
    } else {
      methods.push({ name: "Moov Africa Togo", isActive: true });
      changed = true;
    }

    const togocel = methods.find((method) => {
      const normalized = normalizeName(method.name);
      return normalized.includes("togocel") || normalized.includes("tmoney") || normalized.includes("yastogo");
    });
    if (togocel) {
      if (!togocel.isActive || togocel.name !== "Togocel") {
        togocel.name = "Togocel";
        togocel.isActive = true;
        changed = true;
      }
    } else {
      methods.push({ name: "Togocel", isActive: true });
      changed = true;
    }

    if (changed) {
      await tx.update(countries)
        .set({ operators: JSON.stringify(methods) })
        .where(eq(countries.id, togo.id));
    }
    return changed ? "updated" : "already-configured";
  });
  if (togoDepositMethodsMigration === "updated") {
    console.log("[Togo deposits] Moov Money and Togocel enabled; withdrawal methods unchanged.");
  } else if (togoDepositMethodsMigration === "already-configured") {
    console.log("[Togo deposits] Moov Money and Togocel were already configured.");
  }

  const togoTmoneyToTogocelMigration = await db.transaction(async (tx) => {
    const [togo] = await tx.select({ id: countries.id, operators: countries.operators })
      .from(countries)
      .where(eq(countries.code, "TG"))
      .limit(1);
    if (!togo) return "missing";

    const [marker] = await tx.insert(platformSettings)
      .values({ key: "togo_tmoney_to_togocel_applied", value: "applied" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });
    if (!marker) return "already-applied";

    const methods = parseCountryMethodEntries(togo.operators);
    const normalizeName = (name: string) => name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
    const isTogocelAlias = (name: string) => {
      const normalized = normalizeName(name);
      return normalized.includes("togocel") || normalized.includes("tmoney") || normalized.includes("yastogo");
    };
    const togocelAliases = methods.filter((method) => isTogocelAlias(method.name));
    const firstAliasIndex = methods.findIndex((method) => isTogocelAlias(method.name));
    const remainingMethods = methods.filter((method) => !isTogocelAlias(method.name));
    const togocelActive = togocelAliases.some((method) => method.isActive);
    remainingMethods.splice(Math.max(0, firstAliasIndex), 0, {
      name: "Togocel",
      isActive: togocelAliases.length ? togocelActive : true,
    });

    await tx.update(countries)
      .set({ operators: JSON.stringify(remainingMethods) })
      .where(eq(countries.id, togo.id));

    await tx.update(paymentNumbers)
      .set({ operatorName: "Togocel" })
      .where(and(
        eq(paymentNumbers.country, "TG"),
        eq(paymentNumbers.operatorName, "TMoney"),
      ));

    return "updated";
  });
  if (togoTmoneyToTogocelMigration === "updated") {
    console.log("[Togo deposits] TMoney receiver configuration normalized to Togocel; Moov remains separate.");
  }

  const beninDepositSetupMigration = await db.transaction(async (tx) => {
    const [benin] = await tx.select({ id: countries.id, operators: countries.operators })
      .from(countries)
      .where(eq(countries.code, "BJ"))
      .limit(1);
    if (!benin) return "missing";

    const [marker] = await tx.select({ key: platformSettings.key })
      .from(platformSettings)
      .where(eq(platformSettings.key, "benin_mtn_moov_deposit_setup_applied"))
      .limit(1);
    if (marker) return "already-applied";

    const methods = parseCountryMethodEntries(benin.operators);
    const normalizeName = (name: string) => name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
    let operatorsChanged = false;
    const ensureOperator = (canonicalName: string, matches: (normalized: string) => boolean) => {
      const existing = methods.find((method) => matches(normalizeName(method.name)));
      if (existing) {
        if (existing.name !== canonicalName || !existing.isActive) {
          existing.name = canonicalName;
          existing.isActive = true;
          operatorsChanged = true;
        }
      } else {
        methods.push({ name: canonicalName, isActive: true });
        operatorsChanged = true;
      }
    };
    ensureOperator("MTN Bénin", (name) => name.includes("mtn"));
    ensureOperator("Moov Africa Bénin", (name) => name.includes("moov"));

    const [routingSetting] = await tx.select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, "depositMethodsByCountry"))
      .limit(1);
    let updatedRouting: Record<string, unknown> | null = null;
    if (routingSetting?.value?.trim()) {
      try {
        const parsed: unknown = JSON.parse(routingSetting.value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "invalid-routing";
        const routing = parsed as Record<string, unknown>;
        const beninMethods = Array.isArray(routing.BJ) ? routing.BJ.map((method) => String(method).toLowerCase()) : [];
        if (!beninMethods.includes("manual")) {
          routing.BJ = [...beninMethods, "manual"];
          updatedRouting = routing;
        }
      } catch {
        return "invalid-routing";
      }
    }

    if (operatorsChanged) {
      await tx.update(countries)
        .set({ operators: JSON.stringify(methods) })
        .where(eq(countries.id, benin.id));
    }
    if (updatedRouting) {
      await tx.update(platformSettings)
        .set({ value: JSON.stringify(updatedRouting) })
        .where(eq(platformSettings.key, "depositMethodsByCountry"));
    }
    await tx.insert(platformSettings)
      .values({ key: "benin_mtn_moov_deposit_setup_applied", value: "applied" })
      .onConflictDoNothing();
    return operatorsChanged || updatedRouting ? "updated" : "already-configured";
  });
  if (beninDepositSetupMigration === "updated") {
    console.log("[Bénin deposits] MTN and Moov enabled; manual deposit routing added without changing withdrawal methods.");
  } else if (beninDepositSetupMigration === "invalid-routing") {
    console.error("[Bénin deposits] Could not update the malformed depositMethodsByCountry setting; configuration was left unchanged.");
  }

  const currentCountries = await db.select().from(countries);

  const legacyWithdrawalDefaults: Record<string, string[]> = {
    CI: ["Wave"],
    NE: ["Airtel Money", "Wave", "NITA TRANSFERT"],
  };
  for (const country of currentCountries) {
    if (!country.isActive) continue;
    if (country.withdrawalMethods !== null) continue;
    const code = country.code.toUpperCase();
    const methods = legacyWithdrawalDefaults[code] ?? getActiveCountryMethodNames(country.operators);
    await db.update(countries)
      .set({ withdrawalMethods: JSON.stringify(methods) })
      .where(eq(countries.id, country.id));
  }

  // Add the CATL VIP catalog once without editing terms on previously purchased offers.
  const vipCatalogSeedKey = "migration_catl_vip_offers_applied";
  const vipCatalogResult = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: vipCatalogSeedKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });

    if (!seedMarker) return { inserted: 0, retired: 0, alreadyApplied: true };

    const existingProducts = await tx.select({
      name: products.name,
      sortOrder: products.sortOrder,
    }).from(products);
    const existingNames = new Set(
      existingProducts.map(product => product.name.trim().toLocaleLowerCase("fr")),
    );
    const offersToInsert = catlVipOffers.filter((offer, index) =>
      !existingNames.has(offer.name.toLocaleLowerCase("fr")) &&
      !existingNames.has(`vip ${index + 1}`),
    );

    if (offersToInsert.length > 0) {
      await tx.insert(products).values(offersToInsert.map(offer => ({
        name: offer.name,
        price: offer.price,
        dailyEarnings: offer.dailyEarnings,
        cycleDays: offer.cycleDays,
        totalReturn: offer.dailyEarnings * offer.cycleDays,
        imageUrl: offer.imageUrl,
        isFree: false,
        isActive: offer.isActive,
        sortOrder: catlVipOffers.findIndex(vipOffer => vipOffer.name === offer.name),
      })));
    }

    const legacyOfferNames = [
      "Énergie Essentielle",
      "Énergie Plus",
      "Énergie Premium",
      "Énergie Horizon",
      "Énergie Atlas",
      "Énergie Performance",
      "Énergie Excellence",
      "Énergie Signature",
    ];
    const retiredOffers = await tx.update(products)
      .set({ isActive: false })
      .where(and(eq(products.isActive, true), inArray(products.name, legacyOfferNames)))
      .returning({ id: products.id });

    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, vipCatalogSeedKey));

    return { inserted: offersToInsert.length, retired: retiredOffers.length, alreadyApplied: false };
  });
  if (vipCatalogResult.alreadyApplied) {
    console.log("CATL VIP plans skipped — bootstrap already applied");
  } else {
    console.log(`CATL VIP plans added: ${vipCatalogResult.inserted}; legacy offers retired: ${vipCatalogResult.retired}`);
  }

  // Rename the existing VIP labels without changing any price or earnings terms.
  const vipProductNamesSeedKey = "migration_catl_vip_product_names_applied";
  const vipProductNamesResult = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: vipProductNamesSeedKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });

    if (!seedMarker) return { renamed: 0, alreadyApplied: true };

    let renamed = 0;
    for (let index = 0; index < catlVipOffers.length; index += 1) {
      const offer = catlVipOffers[index];
      const rows = await tx.update(products)
        .set({ name: offer.name, sortOrder: index })
        .where(eq(products.name, `VIP ${index + 1}`))
        .returning({ id: products.id });
      renamed += rows.length;
    }

    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, vipProductNamesSeedKey));

    return { renamed, alreadyApplied: false };
  });
  if (vipProductNamesResult.alreadyApplied) {
    console.log("CATL product names skipped — migration already applied");
  } else {
    console.log(`CATL product names updated: ${vipProductNamesResult.renamed}`);
  }

  // Keep the new ninth-plan name distinct from the retired legacy offer.
  const vipProductNameCollisionKey = "migration_catl_vip_product_name_collision_fixed";
  const vipProductNameCollisionResult = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: vipProductNameCollisionKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });

    if (!seedMarker) return { renamed: 0, alreadyApplied: true };

    const renamedRows = await tx.update(products)
      .set({ name: "Puissance Signature" })
      .where(and(
        eq(products.name, "Énergie Signature"),
        eq(products.price, 500000),
        eq(products.dailyEarnings, 225000),
        eq(products.cycleDays, 150),
        eq(products.sortOrder, 8),
      ))
      .returning({ id: products.id });

    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, vipProductNameCollisionKey));

    return { renamed: renamedRows.length, alreadyApplied: false };
  });
  if (!vipProductNameCollisionResult.alreadyApplied) {
    console.log(`CATL product name collision resolved: ${vipProductNameCollisionResult.renamed}`);
  }

  // Apply the initial six-active / three-inactive CATL catalog state once.
  const vipAvailabilitySeedKey = "migration_catl_vip_availability_applied";
  const vipAvailabilityResult = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: vipAvailabilitySeedKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });

    if (!seedMarker) return { activated: 0, deactivated: 0, alreadyApplied: true };

    let activated = 0;
    let deactivated = 0;
    for (let index = 0; index < catlVipOffers.length; index += 1) {
      const offer = catlVipOffers[index];
      const rows = await tx.update(products)
        .set({ isActive: offer.isActive })
        .where(eq(products.name, offer.name))
        .returning({ id: products.id });
      if (offer.isActive) activated += rows.length;
      else deactivated += rows.length;
    }

    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, vipAvailabilitySeedKey));

    return { activated, deactivated, alreadyApplied: false };
  });
  if (vipAvailabilityResult.alreadyApplied) {
    console.log("CATL VIP availability skipped — migration already applied");
  } else {
    console.log(`CATL VIP availability set: ${vipAvailabilityResult.activated} active, ${vipAvailabilityResult.deactivated} inactive`);
  }

  // Update the provided product image once, preserving future admin image edits.
  const vipProductImageSeedKey = "migration_catl_vip_product_image_applied";
  const vipProductImageResult = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: vipProductImageSeedKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });

    if (!seedMarker) return { updated: 0, alreadyApplied: true };

    const updatedRows = await tx.update(products)
      .set({ imageUrl: catlVipOffers[0].imageUrl })
      .where(inArray(products.name, catlVipOffers.map(offer => offer.name)))
      .returning({ id: products.id });

    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, vipProductImageSeedKey));

    return { updated: updatedRows.length, alreadyApplied: false };
  });
  if (vipProductImageResult.alreadyApplied) {
    console.log("CATL VIP product images skipped — migration already applied");
  } else {
    console.log(`CATL VIP product images updated: ${vipProductImageResult.updated}`);
  }

  // Apply defaults once only. Persisting the marker means admin deletions stay deleted after a restart.
  const initialTasksSeedKey = "migration_initial_tasks_applied";
  const initialTasksSeedResult = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: initialTasksSeedKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });

    if (!seedMarker) return { inserted: 0, alreadyApplied: true };

    const existingTasks = await tx.select().from(tasks);
    if (existingTasks.length === 0) {
      await tx.insert(tasks).values([
        { name: "Parrain Bronze", description: "Inviter 3 personnes a investir", requiredInvites: 3, reward: 350, sortOrder: 1 },
        { name: "Parrain Argent", description: "Inviter 5 personnes a investir", requiredInvites: 5, reward: 750, sortOrder: 2 },
        { name: "Parrain Or", description: "Inviter 10 personnes a investir", requiredInvites: 10, reward: 2500, sortOrder: 3 },
        { name: "Parrain Platine", description: "Inviter 30 personnes a investir", requiredInvites: 30, reward: 6500, sortOrder: 4 },
        { name: "Parrain Diamant", description: "Inviter 100 personnes a investir", requiredInvites: 100, reward: 15000, sortOrder: 5 },
        { name: "Parrain Elite", description: "Inviter 300 personnes a investir", requiredInvites: 300, reward: 50000, sortOrder: 6 },
      ]);
    }

    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, initialTasksSeedKey));
    return {
      inserted: existingTasks.length === 0 ? 6 : 0,
      alreadyApplied: false,
      existing: existingTasks.length,
    };
  });
  if (initialTasksSeedResult.alreadyApplied) {
    console.log("Initial task catalog bootstrap already applied");
  } else if (initialTasksSeedResult.inserted > 0) {
    console.log(`Initial task catalog added: ${initialTasksSeedResult.inserted}`);
  } else {
    console.log(`Initial task catalog preserved; ${initialTasksSeedResult.existing} task(s) already existed`);
  }

  // Add the requested seventh milestone once; this marker prevents deleted admin-managed tasks from being reseeded.
  const seventhTaskSeedKey = "migration_initial_task_seven_applied";
  const seventhTaskSeedResult = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: seventhTaskSeedKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });

    if (!seedMarker) return { added: false, alreadyApplied: true };

    const currentTasks = await tx.select().from(tasks);
    const alreadyExists = currentTasks.some(
      task => task.name.trim().toLocaleLowerCase("fr") === "parrain émeraude",
    );

    if (!alreadyExists) {
      const sortOrder = currentTasks.reduce((highest, task) => Math.max(highest, task.sortOrder), 0) + 1;
      await tx.insert(tasks).values({
        name: "Parrain Émeraude",
        description: "Inviter 500 personnes à rejoindre votre équipe",
        requiredInvites: 500,
        reward: 100000,
        sortOrder,
        isActive: true,
      });
    }

    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, seventhTaskSeedKey));
    return { added: !alreadyExists, alreadyApplied: false };
  });
  if (seventhTaskSeedResult.added) {
    console.log("Seventh task milestone added; it remains editable in administration");
  } else if (seventhTaskSeedResult.alreadyApplied) {
    console.log("Seventh task milestone bootstrap already applied");
  }

  // Check if payment channels exist
  const existingChannels = await db.select().from(paymentChannels);
  if (existingChannels.length === 0) {
    await db.insert(paymentChannels).values([
      { name: "LeekPay", redirectUrl: "https://leekpay.com/pay", isApi: false },
      { name: "FedaPay", redirectUrl: "https://fedapay.com/payment", isApi: false },
    ]);
    console.log("Payment channels seeded");
  }

  // Check if settings exist - apply new values for new keys or update existing
  const existingSettings = await db.select().from(platformSettings);
  const requiredSettings = [
    { key: "supportLink", value: "https://t.me/sybotx" },
    { key: "supportType", value: "telegram" },
    { key: "supportLabel", value: "Service client" },
    { key: "support2Link", value: "https://t.me/sybotx" },
    { key: "support2Type", value: "telegram" },
    { key: "support2Label", value: "Service client 2" },
    { key: "channelLink", value: "https://t.me/sybotx" },
    { key: "channelType", value: "telegram" },
    { key: "channelLabel", value: "Chaîne officielle" },
    { key: "groupLink", value: "https://t.me/sybotx" },
    { key: "groupType", value: "telegram" },
    { key: "groupLabel", value: "Groupe de discussion" },
    { key: "popupButtonLabel", value: "Cliquez ici pour rejoindre le groupe Telegram" },
    { key: "noticeText", value: "Bienvenue sur Equinor ! Consultez les conditions des dépôts, retraits et bonus avant toute opération." },
    { key: "supportEnabled", value: "true" },
    { key: "support2Enabled", value: "true" },
    { key: "channelEnabled", value: "true" },
    { key: "groupEnabled", value: "true" },
    { key: "minDeposit", value: String(DEFAULT_MINIMUM_DEPOSIT) },
    { key: "minWithdrawal", value: String(DEFAULT_MINIMUM_WITHDRAWAL) },
    { key: "withdrawalFees", value: "18" },
    { key: "withdrawalStartHour", value: "9" },
    { key: "withdrawalEndHour", value: "17" },
    { key: "maxWithdrawalsPerDay", value: "3" },
    { key: "withdrawalPrepaymentEnabled", value: "false" },
    { key: "level1Commission", value: "28" },
    { key: "level2Commission", value: "1" },
    { key: "level3Commission", value: "1" },
    { key: "signupBonus", value: "500" },
    { key: "soleaspayEnabled", value: "false" },
    { key: "soleaspayCountries", value: "" },
    { key: "soleaspayChannelName", value: "SoleaPay" },
    { key: "omnipayEnabled", value: "false" },
    { key: "omnipayChannelName", value: "OmniPay" },
    { key: "sendavapayEnabled", value: "false" },
    { key: "sendavapayChannelName", value: "SendavaPay" },
    { key: "westpayEnabled", value: "false" },
    { key: "westpayChannelName", value: "WestPay" },
    { key: "westpayCountries", value: "" },
    { key: "ashtechEnabled", value: "false" },
    { key: "ashtechChannelName", value: "AshtechPay" },
    { key: "ashtechCountries", value: "" },
    { key: "inpayEnabled", value: "false" },
    { key: "inpayChannelName", value: "InPay" },
    { key: "inpayCountries", value: "" },
    { key: "clapayPayoutCountries", value: '["NE","BF"]' },
  ];

  for (const settingData of requiredSettings) {
    const existing = existingSettings.find(s => s.key === settingData.key);
    const isSensitive = /secret|key|token|password/i.test(settingData.key);
    if (!existing) {
      await db.insert(platformSettings).values(settingData);
      console.log(`Setting added: ${settingData.key}${isSensitive ? "" : ` = ${settingData.value}`}`);
    } else if (
      settingData.key === "noticeText" &&
      /sybotx|disney|walt|pixar|marvel|star wars/i.test(existing.value)
    ) {
      await db.update(platformSettings)
        .set({ value: settingData.value })
        .where(eq(platformSettings.key, settingData.key));
      console.log(`Setting updated: ${settingData.key} = ${settingData.value}`);
    } else {
      console.log(`Setting preserved: ${existing.key}${isSensitive ? "" : ` = ${existing.value}`}`);
    }
  }

  const withdrawalFeesMigrationKey = "migration_withdrawal_fees_18_applied";
  const withdrawalFeesMigrationApplied = await db.transaction(async tx => {
    const [seedMarker] = await tx.insert(platformSettings)
      .values({ key: withdrawalFeesMigrationKey, value: "pending" })
      .onConflictDoNothing()
      .returning({ key: platformSettings.key });
    if (!seedMarker) return false;

    await tx.update(platformSettings)
      .set({ value: "18", modifiedAt: new Date() })
      .where(eq(platformSettings.key, "withdrawalFees"));
    await tx.update(platformSettings)
      .set({ value: "true" })
      .where(eq(platformSettings.key, withdrawalFeesMigrationKey));
    return true;
  });
  if (withdrawalFeesMigrationApplied) {
    console.log("Withdrawal fee setting migrated to 18%");
  }

  const signupBonusMigrationKey = "migration_signup_bonus_500_applied";
  if (!existingSettings.some((setting) => setting.key === signupBonusMigrationKey)) {
    const currentSignupBonus = existingSettings.find((setting) => setting.key === "signupBonus")?.value;
    if (currentSignupBonus !== undefined && Number.parseFloat(currentSignupBonus) === 1000) {
      await db.update(platformSettings)
        .set({ value: "500", modifiedAt: new Date() })
        .where(and(
          eq(platformSettings.key, "signupBonus"),
          eq(platformSettings.value, currentSignupBonus),
        ));
      console.log("Signup bonus setting migrated from 1000 to 500 FCFA");
    }
    await db.insert(platformSettings)
      .values({ key: signupBonusMigrationKey, value: "true" })
      .onConflictDoNothing();
  }

  const clapayDepositRoutingMigration = await db.transaction(async (tx) => {
    const migrationKey = "clapay_bf_ne_deposit_routing_applied";
    const [marker] = await tx.select({ key: platformSettings.key })
      .from(platformSettings)
      .where(eq(platformSettings.key, migrationKey))
      .limit(1);
    if (marker) return "already-applied";

    const settingsRows = await tx.select().from(platformSettings);
    const settings = Object.fromEntries(settingsRows.map(({ key, value }) => [key, value]));
    const validMethods = new Set([
      "manual", "soleaspay", "ashtech", "sendavapay", "westpay", "inpay", "clapay",
    ]);
    let routing: Record<string, string[]> = {};
    const rawRouting = settings.depositMethodsByCountry?.trim();

    if (rawRouting) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawRouting);
      } catch {
        return "invalid-routing";
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return "invalid-routing";
      }
      for (const [rawCountry, rawMethods] of Object.entries(parsed)) {
        const country = rawCountry.trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(country) || !Array.isArray(rawMethods)) {
          return "invalid-routing";
        }
        const methods = rawMethods.map((method) => String(method).trim().toLowerCase());
        if (methods.some((method) => !validMethods.has(method))) {
          return "invalid-routing";
        }
        routing[country] = Array.from(new Set(methods));
      }
    } else {
      // Materialize the current legacy routes before creating an explicit map,
      // so this targeted migration does not hide unrelated existing methods.
      const allCountries = await tx.select().from(countries);
      const allPaymentNumbers = await tx.select().from(paymentNumbers);
      const countryListIncludes = (settingValue: string | undefined, countryCode: string, emptyMeansAll = false) => {
        const codes = (settingValue || "")
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean);
        return codes.length === 0 ? emptyMeansAll : codes.includes(countryCode);
      };

      for (const countryRow of allCountries) {
        const code = countryRow.code.trim().toUpperCase();
        const activeMethods = getActiveCountryMethodNames(countryRow.operators);
        const hasConfiguredMethods = parseCountryMethodEntries(countryRow.operators).length > 0;
        const methods: string[] = [];

        if (allPaymentNumbers.some((number) =>
          number.isActive &&
          number.country.trim().toUpperCase() === code &&
          (!hasConfiguredMethods || activeMethods.some(
            (operator) => operator.toLocaleLowerCase() === number.operatorName.trim().toLocaleLowerCase(),
          ))
        )) {
          methods.push("manual");
        }

        if (
          settings.soleaspayEnabled === "true" &&
          countryListIncludes(settings.soleaspayCountries, code)
        ) methods.push("soleaspay");
        if (
          settings.ashtechEnabled === "true" &&
          countryListIncludes(settings.ashtechCountries, code, true)
        ) methods.push("ashtech");
        if (settings.sendavapayEnabled === "true") methods.push("sendavapay");
        if (
          settings.westpayEnabled === "true" &&
          countryListIncludes(settings.westpayCountries, code, true)
        ) methods.push("westpay");
        if (
          settings.inpayEnabled === "true" &&
          countryListIncludes(settings.inpayCountries, code)
        ) methods.push("inpay");

        routing[code] = methods;
      }
    }

    for (const countryCode of ["BF", "NE"]) {
      const methods = routing[countryCode] || [];
      routing[countryCode] = methods.includes("clapay") ? methods : [...methods, "clapay"];
    }

    if (settings.depositMethodsByCountry?.trim()) {
      await tx.update(platformSettings)
        .set({ value: JSON.stringify(routing), modifiedAt: new Date() })
        .where(eq(platformSettings.key, "depositMethodsByCountry"));
    } else {
      await tx.insert(platformSettings)
        .values({ key: "depositMethodsByCountry", value: JSON.stringify(routing) })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: { value: JSON.stringify(routing), modifiedAt: new Date() },
        });
    }

    if (settings.clapayEnabled === undefined) {
      await tx.insert(platformSettings)
        .values({ key: "clapayEnabled", value: "true" })
        .onConflictDoNothing();
    } else if (settings.clapayEnabled !== "true") {
      await tx.update(platformSettings)
        .set({ value: "true", modifiedAt: new Date() })
        .where(eq(platformSettings.key, "clapayEnabled"));
    }
    if (!settings.clapayChannelName?.trim()) {
      await tx.insert(platformSettings)
        .values({ key: "clapayChannelName", value: "Clapay" })
        .onConflictDoNothing();
    }

    await tx.insert(platformSettings)
      .values({ key: migrationKey, value: "applied" })
      .onConflictDoNothing();
    return "updated";
  });
  if (clapayDepositRoutingMigration === "updated") {
    console.log("[Clapay deposits] BF and NE enabled; other deposit methods and country routing preserved.");
  } else if (clapayDepositRoutingMigration === "invalid-routing") {
    console.error("[Clapay deposits] Country routing is invalid; no settings were changed.");
  }

  const beninClapayScopeCorrection = await db.transaction(async (tx) => {
    const migrationKey = "clapay_bj_automatic_route_removed_after_scope_correction";
    const [marker] = await tx.select({ key: platformSettings.key })
      .from(platformSettings)
      .where(eq(platformSettings.key, migrationKey))
      .limit(1);
    if (marker) return "already-applied";

    const [routingSetting] = await tx.select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, "depositMethodsByCountry"))
      .limit(1);
    if (!routingSetting?.value) return "missing-routing";

    let parsed: unknown;
    try {
      parsed = JSON.parse(routingSetting.value);
    } catch {
      return "invalid-routing";
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return "invalid-routing";
    }

    const routing = parsed as Record<string, unknown>;
    const beninMethods = routing.BJ;
    if (beninMethods !== undefined && !Array.isArray(beninMethods)) {
      return "invalid-routing";
    }
    if (Array.isArray(beninMethods)) {
      routing.BJ = beninMethods.filter((method) => String(method).trim().toLowerCase() !== "clapay");
    }

    await tx.update(platformSettings)
      .set({ value: JSON.stringify(routing), modifiedAt: new Date() })
      .where(eq(platformSettings.key, "depositMethodsByCountry"));
    await tx.delete(platformSettings)
      .where(eq(platformSettings.key, "clapay_bf_ne_bj_deposit_routing_applied"));
    await tx.insert(platformSettings)
      .values({ key: migrationKey, value: "applied" })
      .onConflictDoNothing();
    return "updated";
  });
  if (beninClapayScopeCorrection === "updated") {
    console.log("[Clapay deposits] Removed automatic routing for BJ; existing country methods were preserved.");
  } else if (beninClapayScopeCorrection === "invalid-routing") {
    console.error("[Clapay deposits] Bénin routing correction skipped because the country routing is invalid.");
  }

  // Preserve existing payment settings. Startup seeding does not assign providers
  // by default; only the explicit, one-time country migrations above may do so.
  console.log("Settings check complete");

  if (process.env.NODE_ENV === "production") {
    await db
      .insert(platformSettings)
      .values({
        key: PRODUCTION_BOOTSTRAP_VERSION_KEY,
        value: PRODUCTION_BOOTSTRAP_VERSION,
        modifiedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: PRODUCTION_BOOTSTRAP_VERSION,
          modifiedAt: new Date(),
        },
      });
    console.log(`Production bootstrap ${PRODUCTION_BOOTSTRAP_VERSION} applied.`);
  }

  console.log("Database seeding complete!");
}
