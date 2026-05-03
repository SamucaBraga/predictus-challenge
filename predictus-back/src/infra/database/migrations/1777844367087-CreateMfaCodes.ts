import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMfaCodes1777844367087 implements MigrationInterface {
    name = 'CreateMfaCodes1777844367087'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mfa_codes" ADD "registration_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" ADD "code_hash" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" ADD "attempts" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" ADD "used_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "idx_mfa_codes_registration_active" ON "mfa_codes" ("registrationId", "used_at", "expires_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_mfa_codes_registration_active"`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" DROP COLUMN "used_at"`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" DROP COLUMN "attempts"`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" DROP COLUMN "code_hash"`);
        await queryRunner.query(`ALTER TABLE "mfa_codes" DROP COLUMN "registration_id"`);
    }

}
