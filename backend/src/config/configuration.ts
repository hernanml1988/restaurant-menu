export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true',
    sslRejectUnauthorized:
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DATABASE_MIGRATIONS_RUN !== 'false',
  },
  frontend: {
    publicUrl: process.env.FRONTEND_PUBLIC_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
    accessTokenTtl: process.env.JWT_ACCESS_TTL || '1h',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  bootstrap: {
    allowPublicEndpoints:
      process.env.ALLOW_PUBLIC_BOOTSTRAP === undefined
        ? undefined
        : process.env.ALLOW_PUBLIC_BOOTSTRAP === 'true',
  },
  fiscalization: {
    enabled: process.env.FISCALIZATION_ENABLED === 'true',
  },
  sendgridApiKey: process.env.SENDGRID_API_KEY,
});
