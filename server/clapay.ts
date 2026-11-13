import { createHmac, timingSafeEqual } from "node:crypto";

type JsonRecord = Record<string, unknown>;

export type ClapayOperator = {
  id: string;
  name: string;
  requiresOtp: boolean;
  phonePrefixes?: string[];
};

export type ClapayPayoutOptions = {
  operators: Array<Omit<ClapayOperator, "requiresOtp">>;
};

export type ClapayStatusResult = {
  rawStatus: string;
  status: "approved" | "rejected" | "pending";
  transactionId?: string;
  transactionMethod?: string;
  amount?: number;
  country?: string;
  confirmationCode?: string;
};

type RequestValues = Record<string, string | number>;
type ClapayRequestError = Error & {
  httpStatus?: number;
  requestMayHaveReachedProvider?: boolean;
  providerDetail?: string;
};

type ClapayConfig = {
  baseUrl: URL;
  apiKey: string;
  authHeader: string;
  authPrefix: string;
  initiatePath: string;
  initiateBodyTemplate: unknown;
  initiateSignaturePath: string;
  initiateRedirectPath: string;
  initiateMessagePath: string;
  initiateConfirmationCodePath: string;
  payoutBodyTemplate: unknown;
  payoutSignaturePath: string;
  statusPath: string;
  statusBodyTemplate: unknown;
  statusValuePath: string;
  payoutStatusBodyTemplate: unknown;
  payoutStatusValuePath: string;
  successStatuses: Set<string>;
  failureStatuses: Set<string>;
  operatorsPath: string;
  operatorsCountryParam: string;
  operatorsResponsePath: string;
  operatorIdPath: string;
  operatorNamePath: string;
  payoutInitiatePath: string;
  payoutStatusPath: string;
  webhookSecret: string;
  webhookUniqueKey: string;
};

function requiredEnv(name: string): string {
  const value = envValue(name);
  if (!value) throw new Error(`Configuration Clapay manquante dans Plesk : ${name}`);
  return value;
}

function envValue(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function parseJsonEnv(name: string): unknown {
  const raw = requiredEnv(name);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`La variable Plesk ${name} doit contenir un JSON valide`);
  }
}

function parseStatusSet(name: string, defaults: string[]): Set<string> {
  const raw = process.env[name]?.trim();
  const values = (raw ? raw.split(",") : defaults)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!values.length) throw new Error(`La variable Plesk ${name} ne contient aucun statut`);
  return new Set(values);
}

const DEFAULT_INITIATE_BODY_TEMPLATE: JsonRecord = {
  transaction_id: "{{reference}}",
  additional_infos: {
    customer_email: "{{accountEmail}}",
    customer_lastname: "{{accountLastName}}",
    customer_firstname: "{{accountFirstName}}",
    customer_phone: "{{phone}}",
  },
  amount: "{{amount}}",
  callback_url: "{{callbackUrl}}",
  return_url: "{{returnUrl}}",
  country_code: "{{country}}",
  operators_code: ["{{operatorId}}"],
  method: "MERCHANT",
  tunnel: "API",
};

const DEFAULT_PAYOUT_BODY_TEMPLATE: JsonRecord = {
  transaction_id: "{{reference}}",
  additional_infos: {
    customer_email: "{{accountEmail}}",
    customer_lastname: "{{accountLastName}}",
    customer_firstname: "{{accountFirstName}}",
    customer_phone: "{{phone}}",
  },
  amount: "{{amount}}",
  callback_url: "{{callbackUrl}}",
  return_url: "{{returnUrl}}",
  country_code: "{{country}}",
  operators_code: ["{{operatorId}}"],
  method: "CASHIN",
  tunnel: "API",
};

function optionalJsonEnv(name: string, fallback: unknown): unknown {
  if (!process.env[name]?.trim()) return fallback;
  return parseJsonEnv(name);
}

function loadConfig(): ClapayConfig {
  const baseUrlRaw = envValue("CLAPAY_API_BASE_URL", "CLAPAY_BASE_URL")
    || "https://nw-api.clapay.app/nowallet/api/v3";
  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlRaw);
  } catch {
    throw new Error("CLAPAY_API_BASE_URL doit être une URL valide");
  }
  if (baseUrl.protocol !== "https:") {
    throw new Error("CLAPAY_API_BASE_URL doit utiliser HTTPS");
  }
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/`;

  const authHeader = process.env.CLAPAY_API_KEY_HEADER?.trim() || "Authorization";
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(authHeader)) {
    throw new Error("CLAPAY_API_KEY_HEADER n'est pas un nom d'en-tête HTTP valide");
  }

  return {
    baseUrl,
    apiKey: requiredEnv("CLAPAY_API_KEY", "CLAPAY_API_TOKEN"),
    authHeader,
    authPrefix: process.env.CLAPAY_API_KEY_PREFIX === undefined
      ? "Bearer"
      : process.env.CLAPAY_API_KEY_PREFIX.trim(),
    initiatePath: process.env.CLAPAY_INITIATE_PATH?.trim() || "init/payment",
    initiateBodyTemplate: optionalJsonEnv(
      "CLAPAY_INITIATE_REQUEST_TEMPLATE",
      DEFAULT_INITIATE_BODY_TEMPLATE,
    ),
    initiateSignaturePath: process.env.CLAPAY_INITIATE_SIGNATURE_PATH?.trim() || "signature",
    initiateRedirectPath: process.env.CLAPAY_INITIATE_REDIRECT_PATH?.trim() || "",
    initiateMessagePath: process.env.CLAPAY_INITIATE_MESSAGE_PATH?.trim() || "message",
    initiateConfirmationCodePath: process.env.CLAPAY_INITIATE_CONFIRMATION_CODE_PATH?.trim() || "",
    payoutBodyTemplate: optionalJsonEnv(
      "CLAPAY_PAYOUT_REQUEST_TEMPLATE",
      DEFAULT_PAYOUT_BODY_TEMPLATE,
    ),
    payoutSignaturePath: process.env.CLAPAY_PAYOUT_SIGNATURE_PATH?.trim() || "signature",
    statusPath: process.env.CLAPAY_STATUS_PATH?.trim() || "check/status/payment",
    statusBodyTemplate: optionalJsonEnv(
      "CLAPAY_STATUS_REQUEST_TEMPLATE",
      { signature: "{{signature}}" },
    ),
    statusValuePath: process.env.CLAPAY_STATUS_VALUE_PATH?.trim() || "status",
    payoutStatusBodyTemplate: optionalJsonEnv(
      "CLAPAY_PAYOUT_STATUS_REQUEST_TEMPLATE",
      { signature: "{{signature}}" },
    ),
    payoutStatusValuePath: process.env.CLAPAY_PAYOUT_STATUS_VALUE_PATH?.trim() || "status",
    successStatuses: parseStatusSet("CLAPAY_STATUS_SUCCESS_VALUES", ["SUCCESSFUL"]),
    failureStatuses: parseStatusSet(
      "CLAPAY_STATUS_FAILURE_VALUES",
      ["FAILED", "SIGNATURE_DESTROYED"],
    ),
    operatorsPath: process.env.CLAPAY_OPERATORS_PATH?.trim() || "operators/data",
    operatorsCountryParam: process.env.CLAPAY_OPERATORS_COUNTRY_PARAM?.trim() || "country",
    operatorsResponsePath: process.env.CLAPAY_OPERATORS_RESPONSE_PATH?.trim() || "",
    operatorIdPath: process.env.CLAPAY_OPERATOR_ID_PATH?.trim() || "codeoperator",
    operatorNamePath: process.env.CLAPAY_OPERATOR_NAME_PATH?.trim() || "name",
    payoutInitiatePath: process.env.CLAPAY_PAYOUT_INITIATE_PATH?.trim()
      || "/nowallet/api/init/payment",
    payoutStatusPath: process.env.CLAPAY_PAYOUT_STATUS_PATH?.trim()
      || "/nowallet/api/check/status/payment",
    webhookSecret: requiredEnv("CLAPAY_WEBHOOK_SECRET", "CLAPAY_SECRET_KEY"),
    webhookUniqueKey: requiredEnv("CLAPAY_WEBHOOK_UNIQUE_KEY", "CLAPAY_PUBLIC_KEY"),
  };
}

export function isClapayConfigured(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}

function getAtPath(value: unknown, path: string): unknown {
  if (!path) return value;
  return path.split(".").filter(Boolean).reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as JsonRecord)[key];
  }, value);
}

const CLAPAY_CONFIRMATION_CODE_KEYS = new Set([
  "confirmationcode",
  "confirmcode",
  "paymentcode",
  "paymentconfirmationcode",
  "paymentreference",
  "customerreference",
  "confirmationreference",
  "referencecode",
  "verificationcode",
  "verificationpin",
  "cashcode",
  "cashinconfirmationcode",
  "transfercode",
  "otpcode",
  "ussdcode",
]);

const CLAPAY_NITA_REFERENCE_KEYS = new Set(["reference", "ref"]);
const CLAPAY_NITA_CONFIRMATION_CODE_KEYS = new Set(["paymentotp"]);
const nitaConfirmationDiagnosticLog = new Map<string, number>();

export function findClapayConfirmationCandidatePaths(payload: unknown): string[] {
  const paths: string[] = [];
  const interestingField = /(reference|(?:^|_)ref(?:$|_)|code|otp|ticket|receipt|confirm|validation)/i;

  const visit = (value: unknown, path: string, depth: number) => {
    if (depth > 8 || !value || typeof value !== "object" || paths.length >= 12) return;
    if (Array.isArray(value)) {
      value.slice(0, 20).forEach((entry, index) => visit(entry, `${path}[${index}]`, depth + 1));
      return;
    }

    for (const [key, entry] of Object.entries(value as JsonRecord)) {
      const fieldPath = path ? `${path}.${key}` : key;
      if (interestingField.test(key) && paths.length < 12) paths.push(fieldPath);
      visit(entry, fieldPath, depth + 1);
      if (paths.length >= 12) return;
    }
  };

  visit(payload, "", 0);
  return paths;
}

function logMissingNitaConfirmationCode(stage: "initiate" | "status", payload: unknown) {
  const candidatePaths = findClapayConfirmationCandidatePaths(payload);
  const logKey = `${stage}:${candidatePaths.join("|")}`;
  const now = Date.now();
  const lastLoggedAt = nitaConfirmationDiagnosticLog.get(logKey) || 0;
  if (now - lastLoggedAt < 60_000) return;

  nitaConfirmationDiagnosticLog.set(logKey, now);
  if (nitaConfirmationDiagnosticLog.size > 100) {
    nitaConfirmationDiagnosticLog.forEach((timestamp, key) => {
      if (now - timestamp >= 60_000) nitaConfirmationDiagnosticLog.delete(key);
    });
  }
  console.warn("[clapay] NITA confirmation value absent; provider field names only", {
    stage,
    candidatePaths,
  });
}

type ConfirmationCodeExtractOptions = {
  excludedValues?: string[];
  allowNitaReference?: boolean;
};

function normalizeClapayConfirmationCode(
  value: unknown,
  excludedValues: ReadonlySet<string> = new Set(),
): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const code = String(value).trim();
  if (excludedValues.has(code.toLowerCase()) || /^CLAPAY-\d+-\d+$/i.test(code)) return undefined;
  return code && code.length <= 80 && !/[\u0000-\u001f\u007f]/.test(code)
    ? code
    : undefined;
}

export function extractClapayConfirmationCode(
  payload: unknown,
  configuredPath = "",
  options: ConfirmationCodeExtractOptions = {},
): string | undefined {
  const excludedValues = new Set(
    (options.excludedValues || [])
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  if (configuredPath) {
    const configuredValue = normalizeClapayConfirmationCode(
      getAtPath(payload, configuredPath),
      excludedValues,
    );
    if (configuredValue) return configuredValue;
  }

  const findCode = (
    value: unknown,
    acceptedKeys: ReadonlySet<string>,
    depth: number,
  ): string | undefined => {
    if (depth > 6 || !value || typeof value !== "object") return undefined;
    if (Array.isArray(value)) {
      for (const entry of value.slice(0, 20)) {
        const result = findCode(entry, acceptedKeys, depth + 1);
        if (result) return result;
      }
      return undefined;
    }

    const entries = Object.entries(value as JsonRecord);
    for (const [key, entry] of entries) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (acceptedKeys.has(normalizedKey)) {
        const code = normalizeClapayConfirmationCode(entry, excludedValues);
        if (code) return code;
      }
    }
    for (const [, entry] of entries) {
      const result = findCode(entry, acceptedKeys, depth + 1);
      if (result) return result;
    }
    return undefined;
  };

  const explicitCode = findCode(payload, CLAPAY_CONFIRMATION_CODE_KEYS, 0);
  if (explicitCode || !options.allowNitaReference) return explicitCode;
  return findCode(payload, CLAPAY_NITA_CONFIRMATION_CODE_KEYS, 0)
    || findCode(payload, CLAPAY_NITA_REFERENCE_KEYS, 0);
}

export function isLegacyClapayOperatorAllowed(country: string, name: string): boolean {
  const normalizedCountry = country.trim().toUpperCase();
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  switch (normalizedCountry) {
    case "BF":
      return normalizedName.includes("orange") || normalizedName.includes("moov");
    case "TG":
      return normalizedName.includes("tmoney");
    case "CI":
      return normalizedName.includes("wave");
    default:
      return true;
  }
}

function fillTemplate(template: unknown, values: RequestValues): unknown {
  if (Array.isArray(template)) return template.map((value) => fillTemplate(value, values));
  if (template && typeof template === "object") {
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [key, fillTemplate(value, values)]),
    );
  }
  if (typeof template !== "string") return template;

  const exactMatch = template.match(/^\{\{([A-Za-z][A-Za-z0-9_]*)\}\}$/);
  if (exactMatch) {
    const value = values[exactMatch[1]];
    if (value === undefined) throw new Error(`Variable Clapay inconnue : ${exactMatch[1]}`);
    return value;
  }
  return template.replace(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g, (_match, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`Variable Clapay inconnue : ${key}`);
    return String(value);
  });
}

function endpointUrl(config: ClapayConfig, path: string): URL {
  const normalizedPath = path.trim();
  const url = /^\/nowallet\/api(?:\/|$)/.test(normalizedPath)
    ? new URL(normalizedPath, config.baseUrl.origin)
    : new URL(normalizedPath.replace(/^\/+/, ""), config.baseUrl);
  if (url.origin !== config.baseUrl.origin) {
    throw new Error("Le chemin API Clapay doit rester sur l'hôte CLAPAY_API_BASE_URL");
  }
  return url;
}

function sanitizeProviderDetail(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/\+?\d[\d .()-]{6,}\d/g, "[number redacted]")
    .replace(/((?:api[_-]?key|secret|token)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 240);
}

function getProviderDetail(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const record = payload as JsonRecord;
  const nestedError = record.error && typeof record.error === "object" && !Array.isArray(record.error)
    ? record.error as JsonRecord
    : undefined;
  const rawCode = record.error_code ?? record.code ?? nestedError?.error_code ?? nestedError?.code;
  const code = (typeof rawCode === "string" || typeof rawCode === "number")
    ? String(rawCode).trim()
    : "";
  const rawMessage = [
    record.message,
    record.error_description,
    record.detail,
    record.description,
    typeof record.error === "string" ? record.error : undefined,
    nestedError?.message,
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0);
  const errorMessages = Array.isArray(record.errors)
    ? record.errors
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return "";
        const message = (entry as JsonRecord).message;
        const field = (entry as JsonRecord).field;
        if (typeof message !== "string") return "";
        return typeof field === "string" && field.trim()
          ? `${field.trim()}: ${message}`
          : message;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join("; ")
    : "";
  const message = rawMessage || errorMessages;
  const detail = [code ? `code ${code}` : "", message || ""].filter(Boolean).join(": ");
  const sanitized = sanitizeProviderDetail(detail);
  return sanitized || undefined;
}

async function callClapay(
  config: ClapayConfig,
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string> } = {},
): Promise<unknown> {
  const url = endpointUrl(config, path);
  for (const [key, value] of Object.entries(options.query || {})) url.searchParams.set(key, value);

  const prefix = config.authPrefix
    ? `${config.authPrefix}${config.authPrefix.endsWith(" ") ? "" : " "}`
    : "";
  const headers: Record<string, string> = {
    Accept: "application/json",
    [config.authHeader]: `${prefix}${config.apiKey}`,
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || (options.body === undefined ? "GET" : "POST"),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error: any) {
    const reason = error?.name === "AbortError" ? "délai dépassé" : "connexion impossible";
    throw Object.assign(new Error(`Clapay : ${reason}`), {
      requestMayHaveReachedProvider: true,
    } satisfies Partial<ClapayRequestError>);
  } finally {
    clearTimeout(timeout);
  }

  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw Object.assign(
      new Error("Clapay a interrompu sa réponse"),
      { httpStatus: response.status, requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
    );
  }
  let payload: unknown;
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw Object.assign(
      new Error(`Clapay a renvoyé une réponse non JSON (HTTP ${response.status})`),
      { httpStatus: response.status, requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
    );
  }
  if (!response.ok) {
    const providerDetail = getProviderDetail(payload);
    throw Object.assign(
      new Error(`Clapay a refusé la requête (HTTP ${response.status})`),
      {
        httpStatus: response.status,
        requestMayHaveReachedProvider: response.status >= 500,
        ...(providerDetail ? { providerDetail } : {}),
      } satisfies Partial<ClapayRequestError>,
    );
  }
  return payload;
}

function parseClapayOperators(
  config: ClapayConfig,
  data: unknown,
  country: string,
  method: "MERCHANT" | "CASHIN",
  includeAll = false,
): ClapayOperator[] {
  const configuredOperators = getAtPath(data, config.operatorsResponsePath);
  let rawOperators = Array.isArray(configuredOperators) ? configuredOperators : undefined;
  if (!rawOperators) {
    const commonList = [getAtPath(data, "operators"), getAtPath(data, "data")]
      .find(Array.isArray);
    if (Array.isArray(commonList)) rawOperators = commonList;
  }
  if (!rawOperators && data && typeof data === "object" && !Array.isArray(data)) {
    const id = getAtPath(data, config.operatorIdPath);
    const name = getAtPath(data, config.operatorNamePath);
    if ((typeof id === "string" || typeof id === "number") && typeof name === "string") {
      rawOperators = [data];
    }
  }
  if (!rawOperators) {
    throw new Error("La réponse Clapay ne contient pas la liste d'opérateurs configurée");
  }

  const operators = rawOperators.map((operator) => {
    const id = getAtPath(operator, config.operatorIdPath);
    const name = getAtPath(operator, config.operatorNamePath);
    if ((typeof id !== "string" && typeof id !== "number") || typeof name !== "string") {
      throw new Error("Un opérateur Clapay ne contient pas l'identifiant ou le nom attendu");
    }
    return {
      id: String(id),
      name,
      active: getAtPath(operator, "active"),
      methodCode: getAtPath(operator, `code.${method}`),
      requiresOtp: getAtPath(operator, `otpstarter.${method}`) === true,
      phonePrefixes: getAtPath(operator, "startwith"),
    };
  });

  return operators
    .filter((operator) => operator.active !== false
      && (includeAll || isLegacyClapayOperatorAllowed(country, operator.name))
      && (method === "MERCHANT"
        || (typeof operator.methodCode === "string" && operator.methodCode.trim().toLowerCase() !== "none"))
      && (method === "MERCHANT" || Array.isArray(operator.phonePrefixes)))
    .map(({ id, name, requiresOtp, phonePrefixes }) => ({
      id,
      name,
      requiresOtp,
      ...(Array.isArray(phonePrefixes)
        ? { phonePrefixes: phonePrefixes.filter((prefix): prefix is string => typeof prefix === "string") }
        : {}),
    }));
}

export async function getClapayOperators(
  country: string,
  options: { includeAll?: boolean } = {},
): Promise<ClapayOperator[]> {
  const config = loadConfig();
  const normalizedCountry = country.trim().toUpperCase();
  const data = await callClapay(config, config.operatorsPath, {
    query: { [config.operatorsCountryParam]: normalizedCountry },
  });
  return parseClapayOperators(config, data, normalizedCountry, "MERCHANT", options.includeAll === true);
}

function getClapayPayoutPhonePrefixes(
  country: string,
  operator: Pick<ClapayOperator, "id" | "name" | "phonePrefixes">,
): string[] | undefined {
  const prefixes = operator.phonePrefixes ? [...operator.phonePrefixes] : undefined;
  const normalizedName = operator.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isBurkinaOrangePayout = country.trim().toUpperCase() === "BF"
    && operator.id === "OM"
    && normalizedName.includes("orange");

  // The merchant confirmed 46 as an Orange BF payout prefix; keep the override payout-only.
  if (isBurkinaOrangePayout) {
    const payoutPrefixes = prefixes || [];
    if (!payoutPrefixes.some((prefix) => prefix.replace(/\D/g, "") === "46")) {
      payoutPrefixes.push("46");
    }
    return payoutPrefixes;
  }

  return prefixes;
}

export async function getClapayPayoutOptions(country: string): Promise<ClapayPayoutOptions> {
  const normalizedCountry = country.trim().toUpperCase();
  const operators = await getClapayOperators(normalizedCountry);
  return {
    operators: operators.map((operator) => {
      const phonePrefixes = getClapayPayoutPhonePrefixes(normalizedCountry, operator);
      return {
        id: operator.id,
        name: operator.name,
        ...(phonePrefixes ? { phonePrefixes } : {}),
      };
    }),
  };
}

export function normalizeClapayPayoutPhone(
  phone: string,
  countryPhonePrefix: string,
  country: string,
): string {
  const digits = phone.replace(/\D/g, "");
  const phonePrefix = countryPhonePrefix.replace(/\D/g, "");
  const dialedDigits = digits.startsWith("00") ? digits.slice(2) : digits;
  const normalizedCountry = country.trim().toUpperCase();
  const expectedLocalLength = normalizedCountry === "BF" || normalizedCountry === "NE"
    ? 8
    : undefined;
  const explicitlyInternational = phone.trim().startsWith("+") || digits.startsWith("00");
  const includesCountryPrefix = Boolean(phonePrefix) && dialedDigits.startsWith(phonePrefix);
  const hasInternationalLength = expectedLocalLength !== undefined
    && dialedDigits.length === phonePrefix.length + expectedLocalLength;

  return includesCountryPrefix && (explicitlyInternational || hasInternationalLength)
    ? dialedDigits.slice(phonePrefix.length)
    : digits;
}

export async function initiateClapayPayment(values: RequestValues): Promise<{
  signature: string;
  redirectUrl?: string;
  message?: string;
  confirmationCode?: string;
}> {
  const config = loadConfig();
  const { countryPhonePrefix, ...templateValues } = values;
  const phonePrefix = String(countryPhonePrefix ?? "").replace(/\D/g, "");
  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return value.trim().startsWith("+") && phonePrefix && digits.startsWith(phonePrefix)
      ? digits.slice(phonePrefix.length)
      : digits;
  };
  const requestValues = {
    ...templateValues,
    ...(typeof values.phone === "string" ? { phone: normalizePhone(values.phone) } : {}),
    ...(typeof values.accountNumber === "string" ? { accountNumber: normalizePhone(values.accountNumber) } : {}),
  };
  const body = fillTemplate(config.initiateBodyTemplate, requestValues);
  const operatorOtp = values.operatorOtp;
  if (typeof operatorOtp === "string" && operatorOtp.trim()) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Le modèle de requête Clapay doit être un objet pour transmettre l’OTP opérateur");
    }
    (body as JsonRecord).operator_otp = operatorOtp.trim();
  }
  const data = await callClapay(config, config.initiatePath, { method: "POST", body });
  const signature = getAtPath(data, config.initiateSignaturePath);
  if (typeof signature !== "string" && typeof signature !== "number") {
    throw Object.assign(
      new Error("La réponse Clapay ne contient pas la signature configurée"),
      { requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
    );
  }
  const redirectValue = (config.initiateRedirectPath
    ? getAtPath(data, config.initiateRedirectPath)
    : undefined)
    ?? getAtPath(data, "payment_url_operator")
    ?? getAtPath(data, "payment_url");
  const messageValue = config.initiateMessagePath
    ? getAtPath(data, config.initiateMessagePath)
    : undefined;
  const operatorLabel = [values.operatorName, values.operator, values.operatorId]
    .map((value) => String(value || ""))
    .join(" ")
    .toLowerCase();
  const isNitaNigerDeposit = String(values.country || "").toUpperCase() === "NE"
    && operatorLabel.includes("nita");
  const confirmationCode = extractClapayConfirmationCode(
    data,
    config.initiateConfirmationCodePath,
    {
      excludedValues: [String(signature), String(values.reference || "")],
      allowNitaReference: isNitaNigerDeposit,
    },
  );
  if (isNitaNigerDeposit && !confirmationCode) {
    logMissingNitaConfirmationCode("initiate", data);
  }
  let redirectUrl: string | undefined;
  if (typeof redirectValue === "string" && redirectValue.trim()) {
    try {
      const parsedRedirectUrl = new URL(redirectValue);
      if (parsedRedirectUrl.protocol !== "https:") throw new Error();
      redirectUrl = parsedRedirectUrl.toString();
    } catch {
      throw Object.assign(
        new Error("Clapay a renvoyé une URL de paiement invalide"),
        { requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
      );
    }
  }
  return {
    signature: String(signature),
    redirectUrl,
    message: typeof messageValue === "string" ? messageValue : undefined,
    confirmationCode,
  };
}

export async function initiateClapayPayout(values: {
  reference: string;
  amount: number;
  country: string;
  operatorId: string;
  phone: string;
  countryPhonePrefix: string;
  accountFirstName: string;
  accountLastName: string;
  accountEmail?: string;
  callbackUrl: string;
  returnUrl: string;
}): Promise<{ signature: string }> {
  const config = loadConfig();
  const country = values.country.trim().toUpperCase();
  if (!Number.isSafeInteger(values.amount) || values.amount < 10) {
    throw new Error("Le montant du payout Clapay doit être un entier d'au moins 10");
  }

  const localPhone = normalizeClapayPayoutPhone(
    values.phone,
    values.countryPhonePrefix,
    country,
  );
  if (!localPhone) throw new Error("Le numéro de téléphone du bénéficiaire est invalide");

  const templateValues: RequestValues = {
    reference: values.reference,
    amount: values.amount,
    country,
    operatorId: values.operatorId,
    phone: localPhone,
    accountNumber: localPhone,
    accountFirstName: values.accountFirstName,
    accountLastName: values.accountLastName,
    accountEmail: values.accountEmail || "",
    callbackUrl: values.callbackUrl,
    returnUrl: values.returnUrl,
    // Keep the legacy placeholder available for customized templates, but
    // payouts never require or send an operator OTP.
    operatorOtp: "",
  };
  const templateBody = fillTemplate(config.payoutBodyTemplate, templateValues);
  if (!templateBody || typeof templateBody !== "object" || Array.isArray(templateBody)) {
    throw new Error("Le modèle de requête Clapay doit être un objet pour le payout");
  }
  const body = templateBody as JsonRecord;
  const additionalInfos = body.additional_infos;
  body.transaction_id = values.reference;
  body.additional_infos = {
    ...(additionalInfos && typeof additionalInfos === "object" && !Array.isArray(additionalInfos)
      ? additionalInfos as JsonRecord
      : {}),
    customer_email: values.accountEmail || "",
    customer_lastname: values.accountLastName,
    customer_firstname: values.accountFirstName,
    customer_phone: localPhone,
  };
  body.amount = values.amount;
  body.callback_url = values.callbackUrl;
  body.return_url = values.returnUrl;
  body.country_code = country;
  body.operators_code = [values.operatorId];
  body.method = "CASHIN";
  body.tunnel = "API";
  delete body.operator_otp;

  const data = await callClapay(config, config.payoutInitiatePath, {
    method: "POST",
    body,
  });
  const signature = getAtPath(data, config.payoutSignaturePath);
  if (typeof signature !== "string" && typeof signature !== "number") {
    throw Object.assign(
      new Error("La réponse Clapay ne contient pas la signature configurée"),
      { requestMayHaveReachedProvider: true } satisfies Partial<ClapayRequestError>,
    );
  }
  return { signature: String(signature) };
}

async function checkClapayTransaction(
  signature: string,
  statusPath: string,
  statusBodyTemplate: unknown,
  statusValuePath: string,
  options?: { allowNitaReference?: boolean },
): Promise<ClapayStatusResult> {
  const config = loadConfig();
  const body = fillTemplate(statusBodyTemplate, { signature });
  const data = await callClapay(config, statusPath, { method: "POST", body });
  const rawStatusValue = getAtPath(data, statusValuePath);
  if (typeof rawStatusValue !== "string" && typeof rawStatusValue !== "number") {
    throw new Error("La réponse de vérification Clapay ne contient pas le statut configuré");
  }
  const rawStatus = String(rawStatusValue);
  const normalizedStatus = rawStatus.trim().toLowerCase();
  const status = config.successStatuses.has(normalizedStatus)
    ? "approved"
    : config.failureStatuses.has(normalizedStatus)
      ? "rejected"
      : "pending";
  const transactionId = getAtPath(data, "transaction_id");
  const transactionMethod = getAtPath(data, "transaction_method");
  const amount = Number(getAtPath(data, "amount"));
  const country = getAtPath(data, "transaction_country_code");
  const confirmationCode = options?.allowNitaReference
    ? extractClapayConfirmationCode(data, "", {
      allowNitaReference: true,
      excludedValues: [signature],
    })
    : undefined;
  if (options?.allowNitaReference && !confirmationCode) {
    logMissingNitaConfirmationCode("status", data);
  }
  return {
    rawStatus,
    status,
    ...(typeof transactionId === "string" ? { transactionId } : {}),
    ...(typeof transactionMethod === "string" ? { transactionMethod } : {}),
    ...(Number.isFinite(amount) ? { amount } : {}),
    ...(typeof country === "string" ? { country } : {}),
    ...(confirmationCode ? { confirmationCode } : {}),
  };
}

export async function checkClapayPayment(
  signature: string,
  options: { allowNitaReference?: boolean } = {},
): Promise<ClapayStatusResult> {
  const config = loadConfig();
  return checkClapayTransaction(
    signature,
    config.statusPath,
    config.statusBodyTemplate,
    config.statusValuePath,
    options,
  );
}

export async function checkClapayPayout(signature: string): Promise<ClapayStatusResult> {
  const config = loadConfig();
  return checkClapayTransaction(
    signature,
    config.payoutStatusPath,
    config.payoutStatusBodyTemplate,
    config.payoutStatusValuePath,
  );
}

export function verifyClapayWebhookSignature(body: unknown, headerValue: string | undefined): boolean {
  const webhookSecret = envValue("CLAPAY_WEBHOOK_SECRET", "CLAPAY_SECRET_KEY");
  const webhookUniqueKey = envValue("CLAPAY_WEBHOOK_UNIQUE_KEY", "CLAPAY_PUBLIC_KEY");
  if (!webhookSecret || !webhookUniqueKey || !headerValue || !body || typeof body !== "object") {
    return false;
  }

  let key: string | undefined;
  const signatures: string[] = [];
  for (const component of headerValue.split(",")) {
    const separator = component.indexOf("=");
    if (separator < 0) continue;
    const name = component.slice(0, separator).trim().toLowerCase();
    const value = component.slice(separator + 1).trim();
    if (name === "key") key = value;
    if (name === "signature" && value) signatures.push(value);
  }
  if (!key || !signatures.length) return false;

  const encryptedKey = createHmac("sha256", webhookUniqueKey).update(key).digest("hex");
  const serializedBody = JSON.stringify(body);
  if (typeof serializedBody !== "string") return false;
  const expected = createHmac("sha256", webhookSecret)
    .update(`${encryptedKey}${serializedBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const actualBuffer = Buffer.from(signature, "hex");
    return actualBuffer.length === expectedBuffer.length
      && timingSafeEqual(actualBuffer, expectedBuffer);
  });
}