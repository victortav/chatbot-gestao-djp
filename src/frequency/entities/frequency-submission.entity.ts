import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'frequency_submissions' })
export class FrequencySubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phone_number', length: 30 })
  phoneNumber: string;

  @Column({ name: 'source_text', type: 'text' })
  sourceText: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'church_name', length: 255 })
  churchName: string;

  @Column({ name: 'attendance_total', type: 'int' })
  attendanceTotal: number;

  @Column({ name: 'gps_children', type: 'int' })
  gpsChildren: number;

  @Column({ type: 'int' })
  vips: number;

  @Column({ name: 'parking_vehicles', type: 'int' })
  parkingVehicles: number;

  @Column({ type: 'text', default: '' })
  observations: string;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'external_response', type: 'jsonb', nullable: true })
  externalResponse: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
