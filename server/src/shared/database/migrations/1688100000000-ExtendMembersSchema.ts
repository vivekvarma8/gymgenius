import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendMembersSchema1688100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
        ALTER COLUMN "lastName" DROP NOT NULL,
        ALTER COLUMN "email" DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS "gender" varchar(20),
        ADD COLUMN IF NOT EXISTS "age" integer,
        ADD COLUMN IF NOT EXISTS "height" real,
        ADD COLUMN IF NOT EXISTS "weight" real,
        ADD COLUMN IF NOT EXISTS "bmi" real,
        ADD COLUMN IF NOT EXISTS "expiryAt" date,
        ADD COLUMN IF NOT EXISTS "membershipPlan" varchar(50),
        ADD COLUMN IF NOT EXISTS "membershipStatus" varchar(20),
        ADD COLUMN IF NOT EXISTS "paymentStatus" varchar(20),
        ADD COLUMN IF NOT EXISTS "amountPaid" numeric(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "pendingAmount" numeric(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "trainerAssigned" varchar(255),
        ADD COLUMN IF NOT EXISTS "dietPlan" text,
        ADD COLUMN IF NOT EXISTS "workoutPlan" text,
        ADD COLUMN IF NOT EXISTS "medicalNotes" text,
        ADD COLUMN IF NOT EXISTS "emergencyContact" varchar(255),
        ADD COLUMN IF NOT EXISTS "address" text,
        ADD COLUMN IF NOT EXISTS "additionalNotes" text;

      CREATE INDEX IF NOT EXISTS "idx_members_membership_status" ON "members" ("membershipStatus");
      CREATE INDEX IF NOT EXISTS "idx_members_expiry_at" ON "members" ("expiryAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_members_expiry_at";
      DROP INDEX IF EXISTS "idx_members_membership_status";

      ALTER TABLE "members"
        ALTER COLUMN "lastName" SET NOT NULL,
        ALTER COLUMN "email" SET NOT NULL,
        DROP COLUMN IF EXISTS "gender",
        DROP COLUMN IF EXISTS "age",
        DROP COLUMN IF EXISTS "height",
        DROP COLUMN IF EXISTS "weight",
        DROP COLUMN IF EXISTS "bmi",
        DROP COLUMN IF EXISTS "expiryAt",
        DROP COLUMN IF EXISTS "membershipPlan",
        DROP COLUMN IF EXISTS "membershipStatus",
        DROP COLUMN IF EXISTS "paymentStatus",
        DROP COLUMN IF EXISTS "amountPaid",
        DROP COLUMN IF EXISTS "pendingAmount",
        DROP COLUMN IF EXISTS "trainerAssigned",
        DROP COLUMN IF EXISTS "dietPlan",
        DROP COLUMN IF EXISTS "workoutPlan",
        DROP COLUMN IF EXISTS "medicalNotes",
        DROP COLUMN IF EXISTS "emergencyContact",
        DROP COLUMN IF EXISTS "address",
        DROP COLUMN IF EXISTS "additionalNotes";
    `);
  }
}
