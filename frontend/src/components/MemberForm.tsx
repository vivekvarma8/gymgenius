import { useState, FormEvent } from "react";

export interface MemberFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
  bmi: string;
  joinedAt: string;
  expiryAt: string;
  membershipPlan: string;
  package: string;
  membershipStatus: string;
  paymentStatus: string;
  amountPaid: string;
  pendingAmount: string;
  trainerAssigned: string;
  dietPlan: string;
  workoutPlan: string;
  medicalNotes: string;
  emergencyContact: string;
  address: string;
  additionalNotes: string;
}

export const emptyMemberForm: MemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  age: "",
  height: "",
  weight: "",
  bmi: "",
  joinedAt: "",
  expiryAt: "",
  membershipPlan: "",
  package: "",
  membershipStatus: "",
  paymentStatus: "",
  amountPaid: "",
  pendingAmount: "",
  trainerAssigned: "",
  dietPlan: "",
  workoutPlan: "",
  medicalNotes: "",
  emergencyContact: "",
  address: "",
  additionalNotes: ""
};

export function toMemberPayload(values: MemberFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== "") {
      payload[key] = value;
    }
  }
  return payload;
}

interface MemberFormProps {
  initialValues: MemberFormValues;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

export function MemberForm({ initialValues, onSubmit, onCancel, submitLabel }: MemberFormProps) {
  const [values, setValues] = useState<MemberFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  const handleChange = (field: keyof MemberFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      const message = (err as any)?.response?.data?.message ?? "Failed to save member.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      <fieldset className="form-compact-fieldset">
        <legend>Personal Details</legend>
        <div className="form-grid form-grid-2col">
          <label>
            First Name *
            <input type="text" value={values.firstName} onChange={handleChange("firstName")} required placeholder="First name" />
          </label>
          <label>
            Last Name
            <input type="text" value={values.lastName} onChange={handleChange("lastName")} placeholder="Last name" />
          </label>
          <label>
            Email *
            <input type="email" value={values.email} onChange={handleChange("email")} required placeholder="name@email.com" />
          </label>
          <label>
            Phone
            <input type="text" value={values.phone} onChange={handleChange("phone")} placeholder="Phone number" />
          </label>
          <label>
            Gender
            <select value={values.gender} onChange={handleChange("gender")}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            Age
            <input type="number" min="0" max="120" value={values.age} onChange={handleChange("age")} placeholder="Age" />
          </label>
          <label>
            Height (cm)
            <input type="number" step="0.1" value={values.height} onChange={handleChange("height")} placeholder="cm" />
          </label>
          <label>
            Weight (kg)
            <input type="number" step="0.1" value={values.weight} onChange={handleChange("weight")} placeholder="kg" />
          </label>
          <label className="span-2">
            BMI (auto-calculated if blank)
            <input type="number" step="0.1" value={values.bmi} onChange={handleChange("bmi")} placeholder="Auto BMI" />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-compact-fieldset">
        <legend>Membership</legend>
        <div className="form-grid form-grid-2col">
          <label>
            Plan
            <select value={values.membershipPlan} onChange={handleChange("membershipPlan")}>
              <option value="">Select Plan</option>
              <option value="General">General</option>
              <option value="General Combo">General Combo</option>
              <option value="Premium">Premium</option>
              <option value="Premium Couple">Premium Couple</option>
              <option value="Couple">Couple</option>
              <option value="Super Premium">Super Premium</option>
              <option value="Zumba">Zumba</option>
              <option value="Dance">Dance</option>
            </select>
          </label>
          <label>
            Package
            <select value={values.package} onChange={handleChange("package")}>
              <option value="">Select Duration</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </label>
          <label>
            Join Date
            <input type="date" value={values.joinedAt} onChange={handleChange("joinedAt")} />
          </label>
          <label>
            Expiry Date
            <input type="date" value={values.expiryAt} onChange={handleChange("expiryAt")} />
          </label>
          <label>
            Status
            <select value={values.membershipStatus} onChange={handleChange("membershipStatus")}>
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            Trainer
            <input type="text" value={values.trainerAssigned} onChange={handleChange("trainerAssigned")} placeholder="Trainer name" />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-compact-fieldset">
        <legend>Payment</legend>
        <div className="form-grid form-grid-2col">
          <label className="span-2">
            Payment Status
            <select value={values.paymentStatus} onChange={handleChange("paymentStatus")}>
              <option value="">Select Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label>
            Amount Paid (INR)
            <input type="number" step="0.01" value={values.amountPaid} onChange={handleChange("amountPaid")} placeholder="0.00" />
          </label>
          <label>
            Pending Dues (INR)
            <input type="number" step="0.01" value={values.pendingAmount} onChange={handleChange("pendingAmount")} placeholder="0.00" />
          </label>
        </div>
      </fieldset>

      {/* Expandable Optional Details: Plans, Health, Medical & Address */}
      <div className="form-accordion-toggle-wrap">
        <button
          type="button"
          className="form-accordion-btn"
          onClick={() => setShowOptional((prev) => !prev)}
        >
          <span>{showOptional ? "Hide Additional Details (Diet, Medical, Address)" : "+ Additional Details (Diet, Workout, Medical, Address)"}</span>
        </button>
      </div>

      {showOptional && (
        <fieldset className="form-compact-fieldset">
          <legend>Optional Details &amp; Notes</legend>
          <div className="form-grid form-grid-2col">
            <label className="span-2">
              Diet Plan
              <textarea value={values.dietPlan} onChange={handleChange("dietPlan")} rows={2} placeholder="Diet protocol" />
            </label>
            <label className="span-2">
              Workout Routine
              <textarea value={values.workoutPlan} onChange={handleChange("workoutPlan")} rows={2} placeholder="Workout split" />
            </label>
            <label className="span-2">
              Medical Notes
              <textarea value={values.medicalNotes} onChange={handleChange("medicalNotes")} rows={2} placeholder="Injuries or health conditions" />
            </label>
            <label className="span-2">
              Emergency Contact
              <input type="text" value={values.emergencyContact} onChange={handleChange("emergencyContact")} placeholder="Name & phone" />
            </label>
            <label className="span-2">
              Address
              <textarea value={values.address} onChange={handleChange("address")} rows={2} placeholder="Residential address" />
            </label>
            <label className="span-2">
              Additional Notes
              <textarea value={values.additionalNotes} onChange={handleChange("additionalNotes")} rows={2} placeholder="Notes" />
            </label>
          </div>
        </fieldset>
      )}

      {error && <div className="error-text">{error}</div>}

      <div className="member-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="action-glow-btn" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}