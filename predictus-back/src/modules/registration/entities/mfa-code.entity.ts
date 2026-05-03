import {
  Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Registration } from '../../registration/entities/registration.entity';

@Entity('mfa_codes')
@Index('idx_mfa_codes_registration_active', ['registration', 'used_at', 'expires_at'])
export class MfaCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Registration, (reg) => reg.mfaCodes, { onDelete: 'CASCADE' })
  registration!: Registration;

  @Column({ type: 'uuid' })
  registration_id!: string;

  @Column({ type: 'varchar', length: 64 })
  code_hash!: string;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @Column({ type: 'smallint', default: 0 })
  attempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  used_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}