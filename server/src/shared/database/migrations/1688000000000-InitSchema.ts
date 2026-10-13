import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1688000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL UNIQUE,
        "passwordHash" varchar(255) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "role" varchar(50) NOT NULL DEFAULT 'admin',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "firstName" varchar(255) NOT NULL,
        "lastName" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "phone" varchar(20),
        "joinedAt" date,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "members";
      DROP TABLE IF EXISTS "users";
    `);
  }
}
