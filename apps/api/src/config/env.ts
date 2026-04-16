const parseNumber = (value: string | undefined, fallback: number) =>
  Number.parseInt(value ?? "", 10) || fallback;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.API_PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  centerName: process.env.CENTER_NAME ?? "Nova Education Center",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "change-me-access",
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "change-me-refresh",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? ""
};

export const validateEnv = () => {
  const missing: string[] = [];

  if (!env.databaseUrl) missing.push("DATABASE_URL");
  if (!process.env.JWT_ACCESS_SECRET) missing.push("JWT_ACCESS_SECRET");
  if (!process.env.JWT_REFRESH_SECRET) missing.push("JWT_REFRESH_SECRET");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
