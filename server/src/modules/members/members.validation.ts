import { z } from "zod";

const baseMemberSchema = {
  firstName: z.string().min(1).max(255),
  lastName: z.string().max(255).optional(),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
  height: z.coerce.number().positive().max(300).optional(),
  weight: z.coerce.number().positive().max(500).optional(),
  bmi: z.coerce.number().positive().max(100).optional(),
  joinedAt: z.string().optional(),
  expiryAt: z.string().optional(),
  membershipPlan: z.string().max(50).optional(),
  package: z.string().max(50).optional(),
  membershipStatus: z.preprocess(
    (val) => (typeof val === "string" ? val.toLowerCase().trim() : val),
    z.enum(["active", "pending", "expired", "inactive", "cancelled"]).optional()
  ),
  paymentStatus: z.preprocess(
    (val) => (typeof val === "string" ? val.toLowerCase().trim() : val),
    z.enum(["paid", "pending", "partial", "overdue"]).optional()
  ),
  amountPaid: z.coerce.number().min(0).optional(),
  pendingAmount: z.coerce.number().min(0).optional(),
  trainerAssigned: z.string().max(255).optional(),
  dietPlan: z.string().optional(),
  workoutPlan: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContact: z.string().max(255).optional(),
  address: z.string().optional(),
  additionalNotes: z.string().optional(),
  metadata: z.record(z.any()).optional()
};

export const createMemberSchema = z.object(baseMemberSchema).refine((data) => !!data.email, {
  message: "Email is required",
  path: ["email"]
});

export const updateMemberSchema = z.object({
  firstName: baseMemberSchema.firstName.optional(),
  lastName: baseMemberSchema.lastName,
  email: baseMemberSchema.email.optional(),
  phone: baseMemberSchema.phone,
  gender: baseMemberSchema.gender,
  age: baseMemberSchema.age,
  height: baseMemberSchema.height,
  weight: baseMemberSchema.weight,
  bmi: baseMemberSchema.bmi,
  joinedAt: baseMemberSchema.joinedAt,
  expiryAt: baseMemberSchema.expiryAt,
  membershipPlan: baseMemberSchema.membershipPlan,
  package: baseMemberSchema.package,
  membershipStatus: baseMemberSchema.membershipStatus,
  paymentStatus: baseMemberSchema.paymentStatus,
  amountPaid: baseMemberSchema.amountPaid,
  pendingAmount: baseMemberSchema.pendingAmount,
  trainerAssigned: baseMemberSchema.trainerAssigned,
  dietPlan: baseMemberSchema.dietPlan,
  workoutPlan: baseMemberSchema.workoutPlan,
  medicalNotes: baseMemberSchema.medicalNotes,
  emergencyContact: baseMemberSchema.emergencyContact,
  address: baseMemberSchema.address,
  additionalNotes: baseMemberSchema.additionalNotes,
  metadata: baseMemberSchema.metadata
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;