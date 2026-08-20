export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'cdd_user',
    password: process.env.DB_PASSWORD || 'cdd_password',
    database: process.env.DB_DATABASE || 'cdd_renewal',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  cookieSecure:
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' &&
      process.env.NODE_ENV === 'production'),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    from: process.env.SMTP_FROM || 'noreply@cdd.local',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    secure: process.env.SMTP_SECURE === 'true',
  },
  oracle: {
    enabled: process.env.ORACLE_ENABLED === 'true',
    host: process.env.ORACLE_HOST,
    port: parseInt(process.env.ORACLE_PORT || '1521', 10),
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    service: process.env.ORACLE_SERVICE,
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  aiValidationProvider: process.env.AI_VALIDATION_PROVIDER || 'mock',
  portal: {
    tokenTtlDays: parseInt(process.env.PORTAL_TOKEN_TTL_DAYS || '60', 10),
  },
});
