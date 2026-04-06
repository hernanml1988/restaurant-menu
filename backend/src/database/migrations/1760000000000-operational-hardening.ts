import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperationalHardening1760000000000 implements MigrationInterface {
  name = 'OperationalHardening1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS products
      ADD COLUMN IF NOT EXISTS "trackStock" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "stockQuantity" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "stockAlertThreshold" integer NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS orders
      ADD COLUMN IF NOT EXISTS "subtotalBeforeDiscount" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discountAmount" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discountType" character varying,
      ADD COLUMN IF NOT EXISTS "discountValue" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discountReason" text,
      ADD COLUMN IF NOT EXISTS "cancelReason" text,
      ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "cancelledBy" character varying;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_sequences (
        scope character varying PRIMARY KEY,
        "lastNumber" integer NOT NULL DEFAULT 0
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor character varying NOT NULL,
        action character varying NOT NULL,
        "entityType" character varying NOT NULL,
        "entityId" character varying,
        metadata jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE cash_sessions_sessionstatus_enum AS ENUM ('open', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cash_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionStatus" cash_sessions_sessionstatus_enum NOT NULL DEFAULT 'open',
        "openingAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "expectedAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "closingAmount" numeric(10,2),
        "differenceAmount" numeric(10,2),
        notes text,
        "openedAt" TIMESTAMP NOT NULL,
        "closedAt" TIMESTAMP,
        "openedBy" character varying NOT NULL,
        "closedBy" character varying,
        state boolean NOT NULL DEFAULT true,
        status character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "deletedAt" TIMESTAMP,
        "createdBy" character varying NOT NULL,
        "modifiedBy" character varying NOT NULL,
        "restaurantId" uuid NOT NULL REFERENCES restaurants(id)
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE receipts_type_enum AS ENUM ('prebill', 'payment');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code character varying NOT NULL UNIQUE,
        type receipts_type_enum NOT NULL,
        "totalAmount" numeric(10,2) NOT NULL DEFAULT 0,
        snapshot jsonb NOT NULL,
        "printableHtml" text NOT NULL,
        "issuedBy" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "restaurantId" uuid NOT NULL REFERENCES restaurants(id),
        "tableId" uuid NOT NULL REFERENCES restaurant_tables(id),
        "diningSessionId" uuid NOT NULL REFERENCES dining_sessions(id),
        "paymentId" uuid REFERENCES payments(id)
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE reservations_reservationstatus_enum AS ENUM ('booked', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "guestName" character varying NOT NULL,
        "guestPhone" character varying,
        "guestEmail" character varying,
        "partySize" integer NOT NULL,
        "reservationAt" TIMESTAMP NOT NULL,
        "reservationStatus" reservations_reservationstatus_enum NOT NULL DEFAULT 'booked',
        notes text,
        state boolean NOT NULL DEFAULT true,
        status character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "deletedAt" TIMESTAMP,
        "createdBy" character varying NOT NULL,
        "modifiedBy" character varying NOT NULL,
        "restaurantId" uuid NOT NULL REFERENCES restaurants(id),
        "tableId" uuid REFERENCES restaurant_tables(id)
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE fiscal_documents_documenttype_enum AS ENUM ('receipt', 'invoice');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE fiscal_documents_documentstatus_enum AS ENUM ('issued', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        folio character varying NOT NULL UNIQUE,
        "documentType" fiscal_documents_documenttype_enum NOT NULL,
        "documentStatus" fiscal_documents_documentstatus_enum NOT NULL DEFAULT 'issued',
        "totalAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "payloadSnapshot" jsonb NOT NULL,
        "issuedBy" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "restaurantId" uuid NOT NULL REFERENCES restaurants(id),
        "diningSessionId" uuid NOT NULL REFERENCES dining_sessions(id),
        "paymentId" uuid REFERENCES payments(id),
        "receiptId" uuid REFERENCES receipts(id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS realtime_events (
        id SERIAL PRIMARY KEY,
        scope character varying NOT NULL,
        event character varying NOT NULL,
        "sessionToken" character varying,
        payload jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS realtime_events;`);
    await queryRunner.query(`DROP TABLE IF EXISTS fiscal_documents;`);
    await queryRunner.query(`DROP TABLE IF EXISTS reservations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS receipts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cash_sessions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_sequences;`);
  }
}
