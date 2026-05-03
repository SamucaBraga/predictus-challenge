import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Registration } from '../../registration/entities/registration.entity';

@Entity('mfa_codes')
export class MfaCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Registration, (reg) => reg.mfaCodes, { onDelete: 'CASCADE' })
  registration!: Registration;
}