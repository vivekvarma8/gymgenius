import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPackageColumn1688200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
        ADD COLUMN IF NOT EXISTS "package" varchar(50);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
        DROP COLUMN IF EXISTS "package";
    `);
  }
}