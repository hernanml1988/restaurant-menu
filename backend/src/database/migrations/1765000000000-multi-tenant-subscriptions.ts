import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultiTenantSubscriptions1765000000000 implements MigrationInterface {
  name = 'MultiTenantSubscriptions1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRestaurants = await queryRunner.hasTable('restaurants');
    const hasUsers = await queryRunner.hasTable('user');
    if (!hasRestaurants || !hasUsers) {
      // This migration extends the legacy base schema; skip when base tables are absent.
      return;
    }

    await queryRunner.query(`ALTER TABLE IF EXISTS restaurants ADD COLUMN IF NOT EXISTS "ownerUserId" uuid NULL REFERENCES "user"(id);`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE restaurant_staff_staffrole_enum AS ENUM ('owner', 'admin', 'kitchen');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurant_staff (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "staffRole" restaurant_staff_staffrole_enum NOT NULL DEFAULT 'admin',
        state boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "restaurantId" uuid NOT NULL REFERENCES restaurants(id),
        "userId" uuid NOT NULL REFERENCES "user"(id)
      );
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_staff_unique_active ON restaurant_staff("restaurantId", "userId") WHERE state = true;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code character varying NOT NULL UNIQUE,
        name character varying NOT NULL,
        description text,
        "includeKitchen" boolean NOT NULL DEFAULT false,
        "includeQr" boolean NOT NULL DEFAULT false,
        "maxStaff" integer NOT NULL DEFAULT 0,
        "maxProducts" integer NOT NULL DEFAULT 0,
        "maxProductsWithImage" integer NOT NULL DEFAULT 0,
        "maxTables" integer NOT NULL DEFAULT 0,
        "softMaxProducts" integer,
        "softMaxTables" integer,
        state boolean NOT NULL DEFAULT true,
        status character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE restaurant_subscriptions_status_enum AS ENUM ('trial', 'active', 'past_due', 'suspended', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        status restaurant_subscriptions_status_enum NOT NULL DEFAULT 'active',
        "startedAt" TIMESTAMP,
        "endsAt" TIMESTAMP,
        state boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "restaurantId" uuid NOT NULL REFERENCES restaurants(id),
        "planId" uuid NOT NULL REFERENCES plans(id)
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_restaurant_subscriptions_restaurant ON restaurant_subscriptions("restaurantId");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS usage_counters (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        metric character varying NOT NULL,
        value integer NOT NULL DEFAULT 0,
        "periodStart" date NOT NULL,
        "periodEnd" date NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "restaurantId" uuid NOT NULL REFERENCES restaurants(id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS usage_counters;');
    await queryRunner.query('DROP TABLE IF EXISTS restaurant_subscriptions;');
    await queryRunner.query('DROP TABLE IF EXISTS plans;');
    await queryRunner.query('DROP INDEX IF EXISTS idx_restaurant_staff_unique_active;');
    await queryRunner.query('DROP TABLE IF EXISTS restaurant_staff;');
    await queryRunner.query('ALTER TABLE IF EXISTS restaurants DROP COLUMN IF EXISTS "ownerUserId";');
  }
}
