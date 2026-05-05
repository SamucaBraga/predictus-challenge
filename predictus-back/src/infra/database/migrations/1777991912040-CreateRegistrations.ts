import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRegistrations1777991912040 implements MigrationInterface {
    name = 'CreateRegistrations1777991912040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."registrations_document_type_enum" AS ENUM('cpf', 'cnpj')`);
        await queryRunner.query(`CREATE TYPE "public"."registrations_status_enum" AS ENUM('in_progress', 'finished', 'abandoned')`);
        await queryRunner.query(`CREATE TABLE "registrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "name" character varying(255), "document_type" "public"."registrations_document_type_enum", "document_number" character varying(20), "phone" character varying(20), "cep" character varying(9), "street" character varying(255), "number" character varying(20), "complement" character varying(255), "neighborhood" character varying(255), "city" character varying(100), "state" character(2), "status" "public"."registrations_status_enum" NOT NULL DEFAULT 'in_progress', "current_step" smallint NOT NULL DEFAULT '1', "mfa_code_hash" character varying(64), "mfa_code_expires_at" TIMESTAMP WITH TIME ZONE, "mfa_code_attempts" smallint NOT NULL DEFAULT '0', "resume_token" uuid NOT NULL, "resume_token_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "recovery_email_sent_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "finished_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_42ac3f2b11e5acd13d326769f0b" UNIQUE ("email"), CONSTRAINT "UQ_461fe14be066f31c9593696f360" UNIQUE ("resume_token"), CONSTRAINT "PK_6013e724d7b22929da9cd7282d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_registrations_resume_token" ON "registrations" ("resume_token") `);
        await queryRunner.query(`CREATE INDEX "idx_registrations_status_updated" ON "registrations" ("status", "updated_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_registrations_status_updated"`);
        await queryRunner.query(`DROP INDEX "public"."idx_registrations_resume_token"`);
        await queryRunner.query(`DROP TABLE "registrations"`);
        await queryRunner.query(`DROP TYPE "public"."registrations_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."registrations_document_type_enum"`);
    }

}
