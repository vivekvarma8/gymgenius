import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ValueTransformer } from "typeorm";

// Postgres 'numeric' columns come back from node-postgres as strings (to avoid
// silent float precision loss). We transform to/from JS number at the ORM
// boundary so the rest of the app can work with plain numbers for money fields.
const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? undefined : parseFloat(value))
};

@Entity({ name: "members" })
export class Member {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  firstName!: string;

  @Column({ length: 255, nullable: true })
  lastName?: string;

  @Column({ length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 20, nullable: true })
  gender?: string;

  @Column({ type: "int", nullable: true })
  age?: number;

  @Column({ type: "real", nullable: true })
  height?: number;

  @Column({ type: "real", nullable: true })
  weight?: number;

  @Column({ type: "real", nullable: true })
  bmi?: number;

  @Column({ type: "date", nullable: true })
  joinedAt?: Date;

  @Column({ type: "date", nullable: true })
  expiryAt?: Date;

  @Column({ length: 50, nullable: true })
  membershipPlan?: string;

  @Column({ length: 50, nullable: true })
  package?: string;

  @Column({ length: 20, nullable: true })
  membershipStatus?: string;

  @Column({ length: 20, nullable: true })
  paymentStatus?: string;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0, transformer: numericTransformer })
  amountPaid?: number;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0, transformer: numericTransformer })
  pendingAmount?: number;

  @Column({ length: 255, nullable: true })
  trainerAssigned?: string;

  @Column({ type: "text", nullable: true })
  dietPlan?: string;

  @Column({ type: "text", nullable: true })
  workoutPlan?: string;

  @Column({ type: "text", nullable: true })
  medicalNotes?: string;

  @Column({ length: 255, nullable: true })
  emergencyContact?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ type: "text", nullable: true })
  additionalNotes?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}