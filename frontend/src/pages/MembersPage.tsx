import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X, WarningCircle, MagnifyingGlass } from "@phosphor-icons/react";
import api from "../services/api.service";
import { MemberForm, MemberFormValues, emptyMemberForm, toMemberPayload } from "../components/MemberForm";
import { MembersTableSkeleton } from "../components/SkeletonLoader";

interface Member {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  joinedAt?: string;
  expiryAt?: string;
  membershipPlan?: string;
  package?: string;
  membershipStatus?: string;
  paymentStatus?: string;
  amountPaid?: number;
  pendingAmount?: number;
  trainerAssigned?: string;
  dietPlan?: string;
  workoutPlan?: string;
  medicalNotes?: string;
  emergencyContact?: string;
  address?: string;
  additionalNotes?: string;
}

function memberToFormValues(member: Member): MemberFormValues {
  return {
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    email: member.email ?? "",
    phone: member.phone ?? "",
    gender: member.gender ?? "",
    age: member.age?.toString() ?? "",
    height: member.height?.toString() ?? "",
    weight: member.weight?.toString() ?? "",
    bmi: member.bmi?.toString() ?? "",
    joinedAt: member.joinedAt ? member.joinedAt.slice(0, 10) : "",
    expiryAt: member.expiryAt ? member.expiryAt.slice(0, 10) : "",
    membershipPlan: member.membershipPlan ?? "",
    package: member.package ?? "",
    membershipStatus: member.membershipStatus ?? "",
    paymentStatus: member.paymentStatus ?? "",
    amountPaid: member.amountPaid?.toString() ?? "",
    pendingAmount: member.pendingAmount?.toString() ?? "",
    trainerAssigned: member.trainerAssigned ?? "",
    dietPlan: member.dietPlan ?? "",
    workoutPlan: member.workoutPlan ?? "",
    medicalNotes: member.medicalNotes ?? "",
    emergencyContact: member.emergencyContact ?? "",
    address: member.address ?? "",
    additionalNotes: member.additionalNotes ?? ""
  };
}

const GYM_PLANS = ["General", "General Combo", "Premium", "Premium Couple", "Couple", "Super Premium", "Zumba", "Dance"];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Members" },
  { value: "active", label: "Active Members" },
  { value: "expired", label: "Expired Members" },
  { value: "expiring7", label: "Expiring in 7 Days" },
  { value: "pendingPayment", label: "Pending Payment" },
  ...GYM_PLANS.map((plan) => ({ value: `plan:${plan}`, label: `Plan: ${plan}` }))
];

function isExpiringWithin7Days(expiryAt?: string): boolean {
  if (!expiryAt) return false;
  const expiry = new Date(expiryAt);
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return expiry >= now && expiry <= in7Days;
}

export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("filter") ?? "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [formMode, setFormMode] = useState<"none" | "add" | "edit">("none");
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Single Delete State
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Bulk Selection & Delete State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/members");
      setMembers(response.data.data);
    } catch {
      setError("Unable to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    setFilter(urlFilter ?? "all");
  }, [searchParams]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ filter: value });
    }
    setSelectedIds(new Set()); // reset selection on filter change
  };

  const filteredMembers = useMemo(() => {
    let result = members;

    if (filter === "active") {
      result = result.filter((m) => {
        const s = (m.membershipStatus ?? "").toLowerCase().trim();
        return s === "active" || (!s && m.paymentStatus?.toLowerCase().trim() === "paid");
      });
    } else if (filter === "expired") {
      result = result.filter((m) => {
        const s = (m.membershipStatus ?? "").toLowerCase().trim();
        return s === "expired" || s === "inactive" || s === "cancelled";
      });
    } else if (filter === "expiring7") {
      result = result.filter((m) => isExpiringWithin7Days(m.expiryAt));
    } else if (filter === "pendingPayment") {
      result = result.filter((m) => {
        const p = (m.paymentStatus ?? "").toLowerCase().trim();
        return p === "pending" || p === "partial" || p === "overdue" || (m.pendingAmount ?? 0) > 0;
      });
    } else if (filter.startsWith("plan:")) {
      const plan = filter.slice(5).toLowerCase().trim();
      result = result.filter((m) => {
        const mPlan = (m.membershipPlan ?? "").toLowerCase().trim();
        const mPkg = (m.package ?? "").toLowerCase().trim();
        return mPlan === plan || mPkg === plan || mPlan.includes(plan) || mPkg.includes(plan);
      });
    }

    if (searchQuery.trim()) {
      const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      result = result.filter((m) => {
        const fullName = `${m.firstName} ${m.lastName ?? ""}`.toLowerCase();
        const email = (m.email ?? "").toLowerCase();
        const phone = (m.phone ?? "").toLowerCase();
        const cleanPhone = phone.replace(/\D/g, "");
        const plan = (m.membershipPlan ?? "").toLowerCase();
        const status = (m.membershipStatus ?? "").toLowerCase();
        const payment = (m.paymentStatus ?? "").toLowerCase();
        const trainer = (m.trainerAssigned ?? "").toLowerCase();

        // Every typed term must match at least one field
        return queryTerms.every((term) => {
          const cleanTerm = term.replace(/\D/g, "");
          return (
            fullName.includes(term) ||
            m.firstName.toLowerCase().includes(term) ||
            (m.lastName && m.lastName.toLowerCase().includes(term)) ||
            email.includes(term) ||
            phone.includes(term) ||
            (cleanTerm && cleanPhone.includes(cleanTerm)) ||
            plan.includes(term) ||
            status.includes(term) ||
            payment.includes(term) ||
            trainer.includes(term)
          );
        });
      });
    }

    return result;
  }, [members, filter, searchQuery]);

  // Bulk Selection Handlers
  const isAllSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selectedIds.has(m.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(filteredMembers.map((m) => m.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Single Delete
  const confirmSingleDelete = async () => {
    if (!memberToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/members/${memberToDelete.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(memberToDelete.id);
        return next;
      });
      showToast(`Member "${memberToDelete.firstName} ${memberToDelete.lastName ?? ""}" has been deleted.`);
      setMemberToDelete(null);
    } catch {
      alert("Failed to delete member. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Delete
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    try {
      // Call bulk-delete API endpoint
      await api.post("/members/bulk-delete", { ids: idsToDelete });
      setMembers((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      showToast(`Successfully deleted ${idsToDelete.length} member(s).`);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } catch {
      // Fallback: delete sequentially if bulk fails
      try {
        await Promise.all(idsToDelete.map((id) => api.delete(`/members/${id}`)));
        setMembers((prev) => prev.filter((m) => !selectedIds.has(m.id)));
        showToast(`Successfully deleted ${idsToDelete.length} member(s).`);
        setSelectedIds(new Set());
        setShowBulkDeleteModal(false);
      } catch {
        alert("Failed to delete selected members. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setImportMessage(null);
    setImportErrors([]);
  };

  const handleImport = async () => {
    if (!file) {
      setImportMessage("Please select a CSV or Excel file first.");
      return;
    }

    setUploading(true);
    setImportMessage(null);
    setImportErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/members/import", formData);

      const data = response.data as { imported: number; skipped: number; errors: string[] };
      setImportMessage(`Imported ${data.imported} member(s), skipped ${data.skipped}.`);
      setImportErrors(data.errors ?? []);
      setFile(null);
      await fetchMembers();
    } catch (err) {
      const message = (err as any)?.response?.data?.message;
      setImportMessage(message ?? "Failed to import members. Please check the file format and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubmit = async (values: MemberFormValues) => {
    await api.post("/members", toMemberPayload(values));
    setFormMode("none");
    showToast("Member successfully added to GymGenius!");
    await fetchMembers();
  };

  const handleEditSubmit = async (values: MemberFormValues) => {
    if (!editingMember) return;
    await api.put(`/members/${editingMember.id}`, toMemberPayload(values));
    setFormMode("none");
    setEditingMember(null);
    showToast("Member details updated successfully.");
    await fetchMembers();
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <div className="toast-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button type="button" className="toast-close" onClick={() => setToastMessage(null)}>
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Single Member Delete Modal */}
      {memberToDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setMemberToDelete(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-badge danger">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h2 className="modal-title">Delete Member</h2>
            <p className="modal-text">
              Are you sure you want to delete{" "}
              <strong className="text-highlight">
                {memberToDelete.firstName} {memberToDelete.lastName ?? ""}
              </strong>
              ?
            </p>
            <div className="modal-member-preview">
              <div className="preview-row">
                <span className="preview-label">Email:</span>
                <span className="preview-value">{memberToDelete.email}</span>
              </div>
              {memberToDelete.phone && (
                <div className="preview-row">
                  <span className="preview-label">Phone:</span>
                  <span className="preview-value">{memberToDelete.phone}</span>
                </div>
              )}
              {memberToDelete.membershipPlan && (
                <div className="preview-row">
                  <span className="preview-label">Plan:</span>
                  <span className="preview-value">{memberToDelete.membershipPlan}</span>
                </div>
              )}
            </div>
            <p className="modal-warning">
              <WarningCircle size={16} weight="fill" style={{ marginRight: "6px", verticalAlign: "-2px", color: "#f87171" }} />
              This will permanently remove the member from GymGenius records. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={deleting}
                onClick={() => setMemberToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleting}
                onClick={confirmSingleDelete}
              >
                {deleting ? "Deleting..." : "Yes, Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="modal-backdrop" onClick={() => !deleting && setShowBulkDeleteModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-badge danger">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h2 className="modal-title">Delete {selectedIds.size} Selected Members?</h2>
            <p className="modal-text">
              You are about to permanently delete <strong className="text-highlight">{selectedIds.size} members</strong> from GymGenius at once.
            </p>
            <p className="modal-warning">
              <WarningCircle size={16} weight="fill" style={{ marginRight: "6px", verticalAlign: "-2px", color: "#f87171" }} />
              Warning: This bulk deletion is permanent and cannot be undone. All membership and payment history for these {selectedIds.size} members will be removed.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={deleting}
                onClick={() => setShowBulkDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleting}
                onClick={confirmBulkDelete}
              >
                {deleting ? "Deleting Members..." : `Delete ${selectedIds.size} Members`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card wide-card">
        {/* Top Header */}
        <div className="members-header">
          <div>
            <div className="section-badge">GYM MEMBERS DIRECTORY</div>
            <h1 className="page-heading">Members Management</h1>
            <p className="page-subheading">
              Manage registrations, search members, or delete records in GymGenius.
            </p>
          </div>
          {formMode === "none" && (
            <button
              type="button"
              className="action-glow-btn"
              onClick={() => {
                setEditingMember(null);
                setFormMode("add");
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Member
            </button>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="members-controls-bar">
          <div className="search-input-wrapper">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search members by name, phone, email, plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear-btn" onClick={() => setSearchQuery("")}>
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <label className="filter-select-wrapper" htmlFor="member-filter-dropdown" title="Select member filter">
            <span className="filter-icon-label" style={{ pointerEvents: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter:
            </span>
            <select
              id="member-filter-dropdown"
              className="styled-select"
              value={filter}
              style={{ backgroundColor: "#18181c", color: "#f4f4f5" }}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              {FILTER_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  style={{ backgroundColor: "#18181c", color: "#f4f4f5" }}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="results-count-badge">
            {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
          </div>
        </div>

        {/* Bulk Selection Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-info">
              <span className="bulk-badge">{selectedIds.size}</span>
              <span className="bulk-text">
                {selectedIds.size === 1 ? "1 member selected" : `${selectedIds.size} members selected`}
                {selectedIds.size === filteredMembers.length && filteredMembers.length > 1 && " (All)"}
              </span>
            </div>
            <div className="bulk-actions-buttons">
              <button
                type="button"
                className="btn-text-action"
                onClick={toggleSelectAll}
              >
                {isAllSelected ? "Deselect All" : "Select All"}
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

        {/* Member Form (Add / Edit) */}
        {formMode !== "none" && (
          <section className="form-container-card">
            <div className="form-header">
              <h2>{formMode === "add" ? "Add New Member to GymGenius" : `Edit Member: ${editingMember?.firstName} ${editingMember?.lastName ?? ""}`}</h2>
              <button
                type="button"
                className="form-close-btn"
                onClick={() => {
                  setFormMode("none");
                  setEditingMember(null);
                }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <MemberForm
              initialValues={formMode === "edit" && editingMember ? memberToFormValues(editingMember) : emptyMemberForm}
              onSubmit={formMode === "add" ? handleAddSubmit : handleEditSubmit}
              onCancel={() => {
                setFormMode("none");
                setEditingMember(null);
              }}
              submitLabel={formMode === "add" ? "Add Member" : "Save Changes"}
            />
          </section>
        )}

        {/* Bulk Import Section */}
        <section className="import-section-card">
          <div className="import-header">
            <div>
              <h2 className="import-title">Import Members via Spreadsheet</h2>
              <p className="import-desc">
                Upload CSV or Excel spreadsheets to import multiple members simultaneously.
              </p>
            </div>
          </div>
          <div className="import-controls">
            <input
              type="file"
              className="styled-file-input"
              accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn-outline"
              onClick={handleImport}
              disabled={uploading || !file}
            >
              {uploading ? "Importing..." : "Upload & Import"}
            </button>
          </div>
          {importMessage && <p className="info-text">{importMessage}</p>}
          {importErrors.length > 0 && (
            <div className="error-text">
              <h3>Import Issues:</h3>
              <ul>
                {importErrors.map((errorMessage, index) => (
                  <li key={index}>{errorMessage}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Members Table */}
        {loading ? (
          <MembersTableSkeleton />
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <MagnifyingGlass size={38} weight="duotone" />
            </div>
            <h3>No members found</h3>
            <p>
              {searchQuery
                ? `No members match "${searchQuery}". Try a different keyword.`
                : "No members match the selected filter category."}
            </p>
            {(searchQuery || filter !== "all") && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  handleFilterChange("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="members-table">
              <thead>
                <tr>
                  <th className="select-col">
                    <label className="checkbox-container" title={isAllSelected ? "Deselect all" : "Select all members"}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={toggleSelectAll}
                      />
                      <span className="checkbox-checkmark" />
                    </label>
                  </th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Expiry Date</th>
                  <th>Trainer</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isSelected = selectedIds.has(member.id);
                  return (
                    <tr key={member.id} className={`member-row ${isSelected ? "row-selected" : ""}`}>
                      <td className="select-col">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectMember(member.id)}
                          />
                          <span className="checkbox-checkmark" />
                        </label>
                      </td>
                      <td>
                        <div className="member-name-cell">
                          <div className="member-avatar">
                            {member.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="member-full-name">
                              {member.firstName} {member.lastName ?? ""}
                            </div>
                            {member.gender && <span className="member-sub-info">{member.gender}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <div className="contact-email">{member.email}</div>
                          {member.phone && <div className="contact-phone">{member.phone}</div>}
                        </div>
                      </td>
                      <td>
                        <span className="plan-chip">
                          {member.membershipPlan ?? "General"}
                        </span>
                      </td>
                      <td>
                        {member.membershipStatus ? (
                          <span className={`status-pill status-${member.membershipStatus.toLowerCase()}`}>
                            {member.membershipStatus}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className={`payment-pill payment-${member.paymentStatus?.toLowerCase() ?? "pending"}`}>
                          {member.paymentStatus ?? "Pending"}
                        </span>
                      </td>
                      <td>
                        <div className="expiry-cell">
                          {member.expiryAt ? member.expiryAt.slice(0, 10) : "—"}
                          {isExpiringWithin7Days(member.expiryAt) && (
                            <span className="expiring-badge" title="Expiring soon!">7d</span>
                          )}
                        </div>
                      </td>
                      <td>{member.trainerAssigned ?? "—"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit member details"
                            onClick={() => {
                              setEditingMember(member);
                              setFormMode("edit");
                              window.scrollTo({ top: 100, behavior: "smooth" });
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            title="Delete member from GymGenius"
                            onClick={() => setMemberToDelete(member)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}