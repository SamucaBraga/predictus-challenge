import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RegistrationStatus {
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  ABANDONED = 'abandoned',
}

export enum DocumentType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
}

@Entity('registrations')
@Index('idx_registrations_status_updated', ['status', 'updated_at'])
@Index('idx_registrations_resume_token', ['resume_token'])
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'enum', enum: DocumentType, nullable: true })
  document_type!: DocumentType | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document_number!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  cep!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  street!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  number!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  neighborhood!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  state!: string | null;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.IN_PROGRESS })
  status!: RegistrationStatus;

  @Column({ type: 'smallint', default: 1 })
  current_step!: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  mfa_code_hash!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  mfa_code_expires_at!: Date | null;

  @Column({ type: 'smallint', default: 0 })
  mfa_code_attempts!: number;

  @Column({ type: 'uuid', unique: true })
  resume_token!: string;

  @Column({ type: 'timestamptz' })
  resume_token_expires_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  recovery_email_sent_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finished_at!: Date | null;
}