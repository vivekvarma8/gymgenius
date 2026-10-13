import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Barbell,
  Crown,
  Users,
  ShieldStar,
  PersonArmsSpread,
  PersonSimpleTaiChi,
  Flame,
  MusicNotes,
  Stack,
  Trophy,
  Sparkle
} from "@phosphor-icons/react";
import api from "../services/api.service";
import { DashboardSkeleton } from "../components/SkeletonLoader";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  newThisMonth: number;
  monthlyRevenue: number;
  expiringSoon: number;
  planDistribution: Record<string, number>;
}

// Plan configuration with colors and descriptions
interface PlanTheme {
  themeColor: string;
  gradient: string;
  badgeBg: string;
  description: string;
}

const PLAN_THEMES: Record<string, PlanTheme> = {
  "General": {
    themeColor: "#38bdf8",
    gradient: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
    badgeBg: "rgba(56, 189, 248, 0.12)",
    description: "Standard gym & equipment floor access"
  },
  "General Combo": {
    themeColor: "#818cf8",
    gradient: "linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)",
    badgeBg: "rgba(129, 140, 248, 0.12)",
    description: "Gym workout + cardio combination package"
  },
  "Premium": {
    themeColor: "#fbbf24",
    gradient: "linear-gradient(135deg, #d97706 0%, #fde047 100%)",
    badgeBg: "rgba(251, 191, 36, 0.12)",
    description: "Full gym floor + trainer supervision"
  },
  "Premium Couple": {
    themeColor: "#f43f5e",
    gradient: "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
    badgeBg: "rgba(244, 63, 94, 0.12)",
    description: "VIP couple package with dedicated coach"
  },
  "Couple": {
    themeColor: "#34d399",
    gradient: "linear-gradient(135deg, #059669 0%, #6ee7b7 100%)",
    badgeBg: "rgba(52, 211, 153, 0.12)",
    description: "Joint membership package for pairs"
  },
  "Super Premium": {
    themeColor: "#c084fc",
    gradient: "linear-gradient(135deg, #9333ea 0%, #e9d5ff 100%)",
    badgeBg: "rgba(192, 132, 252, 0.12)",
    description: "All access + personalized nutrition & spa"
  },
  "Zumba": {
    themeColor: "#fb923c",
    gradient: "linear-gradient(135deg, #ea580c 0%, #fed7aa 100%)",
    badgeBg: "rgba(251, 146, 60, 0.12)",
    description: "High-intensity aerobic fitness sessions"
  },
  "Dance": {
    themeColor: "#f472b6",
    gradient: "linear-gradient(135deg, #db2777 0%, #fbcfe8 100%)",
    badgeBg: "rgba(244, 114, 182, 0.12)",
    description: "Rhythm & choreography cardio classes"
  }
};

const DEFAULT_THEME: PlanTheme = {
  themeColor: "#2dd4bf",
  gradient: "linear-gradient(135deg, #0d9488 0%, #5eead4 100%)",
  badgeBg: "rgba(45, 212, 191, 0.12)",
  description: "Special custom membership package"
};

// Professional Phosphor vector SVG icon renderer
function renderPlanPhosphorIcon(plan: string) {
  switch (plan.toLowerCase()) {
    case "general":
      return <Barbell size={24} weight="duotone" />;
    case "general combo":
      return (
        <div className="duo-icon-combo" title="Barbell with Combo Stack">
          <Barbell size={22} weight="duotone" />
          <Stack size={14} weight="fill" className="secondary-corner-icon" />
        </div>
      );
    case "premium":
      return <Crown size={24} weight="duotone" />;
    case "premium couple":
      return (
        <div className="duo-icon-combo" title="Crown with Users">
          <Crown size={20} weight="duotone" />
          <Users size={16} weight="duotone" className="secondary-corner-icon" />
        </div>
      );
    case "couple":
      return <Users size={24} weight="duotone" />;
    case "super premium":
      return (
        <div className="duo-icon-combo" title="Shield with Crown">
          <ShieldStar size={22} weight="duotone" />
          <Crown size={14} weight="fill" className="secondary-corner-icon" />
        </div>
      );
    case "zumba":
      return (
        <div className="duo-icon-combo" title="Dynamic Dancer with Flame">
          <PersonArmsSpread size={22} weight="duotone" />
          <Flame size={14} weight="fill" className="secondary-corner-icon" />
        </div>
      );
    case "dance":
      return (
        <div className="duo-icon-combo" title="Dancer with Music">
          <PersonSimpleTaiChi size={22} weight="duotone" />
          <MusicNotes size={14} weight="fill" className="secondary-corner-icon" />
        </div>
      );
    default:
      return <Sparkle size={24} weight="duotone" />;
  }
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/members/stats")
      .then((response) => setStats(response.data.data))
      .catch(() => setError("Unable to load dashboard statistics."))
      .finally(() => setLoading(false));
  }, []);

  const totalMembers = stats?.totalMembers ?? 0;

  // Find top enrolled plan
  const mostPopularPlan = stats?.planDistribution
    ? Object.entries(stats.planDistribution).reduce(
        (max, curr) => (curr[1] > max[1] ? curr : max),
        ["None", 0]
      )
    : ["None", 0];

  const totalEnrolledInPlans = stats?.planDistribution
    ? Object.values(stats.planDistribution).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div className="page-container">
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-subtitle">OVERVIEW & ANALYTICS</div>
            <h1 className="dashboard-title">Welcome to GymGenius</h1>
          </div>
          <div className="dashboard-header-actions">
            <Link to="/members" className="button action-glow-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
              Manage Members
            </Link>
          </div>
        </div>

        {loading && <DashboardSkeleton />}

        {error && <div className="error-text">{error}</div>}

        {stats && (
          <>
            {/* Quick Stat Metric Cards */}
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-card-label">Total Members</span>
                  <div className="stat-icon-wrapper blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <span className="stat-card-value">{stats.totalMembers}</span>
                <span className="stat-card-footer">All registered members</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-card-label">Active Members</span>
                  <div className="stat-icon-wrapper green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <span className="stat-card-value text-green">{stats.activeMembers}</span>
                <span className="stat-card-footer">
                  {totalMembers > 0 ? `${Math.round((stats.activeMembers / totalMembers) * 100)}% of total` : "Active"}
                </span>
              </div>

              <Link to="/members?filter=expired" className="stat-card stat-card-link">
                <div className="stat-card-top">
                  <span className="stat-card-label">Expired</span>
                  <div className="stat-icon-wrapper red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                </div>
                <span className="stat-card-value text-red">{stats.expiredMembers}</span>
                <span className="stat-card-footer link-hint">Click to review →</span>
              </Link>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-card-label">New This Month</span>
                  <div className="stat-icon-wrapper purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <span className="stat-card-value">{stats.newThisMonth}</span>
                <span className="stat-card-footer">Joined recently</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-card-label">Monthly Revenue</span>
                  <div className="stat-icon-wrapper gold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <span className="stat-card-value text-gold">₹{stats.monthlyRevenue.toLocaleString("en-IN")}</span>
                <span className="stat-card-footer">Collected this month</span>
              </div>

              <Link to="/members?filter=expiring7" className="stat-card stat-card-link">
                <div className="stat-card-top">
                  <span className="stat-card-label">Expiring in 7 Days</span>
                  <div className="stat-icon-wrapper orange">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                <span className="stat-card-value text-orange">{stats.expiringSoon}</span>
                <span className="stat-card-footer link-hint">Send renewal alert →</span>
              </Link>
            </div>

            {/* Professional Membership Plan Distribution Section */}
            {stats.planDistribution && Object.keys(stats.planDistribution).length > 0 && (
              <div className="card plan-distribution-card">
                <div className="plan-section-header">
                  <div>
                    <div className="plan-section-badge">MEMBER ENROLLMENT</div>
                    <h2 className="plan-section-title">Membership Plan Distribution</h2>
                    <p className="plan-section-desc">
                      Live enrollment metrics across all gym categories. Click any plan to view and filter members.
                    </p>
                  </div>
                  <div className="plan-header-summary">
                    <div className="plan-summary-chip">
                      <span className="chip-label">Top Plan:</span>
                      <span className="chip-val">{mostPopularPlan[0]} ({mostPopularPlan[1]})</span>
                    </div>
                    <div className="plan-summary-chip">
                      <span className="chip-label">Total Assigned:</span>
                      <span className="chip-val">{totalEnrolledInPlans}</span>
                    </div>
                  </div>
                </div>

                <div className="plans-grid">
                  {Object.entries(stats.planDistribution).map(([plan, count]) => {
                    const theme = PLAN_THEMES[plan] ?? DEFAULT_THEME;
                    const percent = totalMembers > 0 ? ((count / totalMembers) * 100).toFixed(1) : "0";
                    const isTop = plan === mostPopularPlan[0] && count > 0;

                    return (
                      <Link
                        to={`/members?filter=plan:${encodeURIComponent(plan)}`}
                        key={plan}
                        className={`plan-card ${isTop ? "plan-card-featured" : ""}`}
                        style={{ "--plan-color": theme.themeColor } as React.CSSProperties}
                        title={`Filter members on ${plan} plan`}
                      >
                        <div className="plan-card-top">
                          <div className="plan-icon-container" style={{ background: theme.badgeBg, color: theme.themeColor }}>
                            {renderPlanPhosphorIcon(plan)}
                          </div>
                          <div className="plan-top-right">
                            {isTop && (
                              <div className="featured-ribbon-pill">
                                <Trophy size={12} weight="fill" />
                                <span>Top Enrolled</span>
                              </div>
                            )}
                            <div className="plan-count-badge">
                              <span className="count-number">{count}</span>
                              <span className="count-unit">members</span>
                            </div>
                          </div>
                        </div>

                        <div className="plan-card-info">
                          <h3 className="plan-name">{plan}</h3>
                          <p className="plan-desc">{theme.description}</p>
                        </div>

                        <div className="plan-progress-wrapper">
                          <div className="plan-progress-stats">
                            <span className="progress-label">Enrollment share</span>
                            <span className="progress-percent" style={{ color: theme.themeColor }}>
                              {percent}%
                            </span>
                          </div>
                          <div className="plan-progress-bar">
                            <div
                              className="plan-progress-fill"
                              style={{
                                width: `${Math.max(Number(percent), count > 0 ? 5 : 0)}%`,
                                background: theme.gradient
                              }}
                            />
                          </div>
                        </div>

                        <div className="plan-card-footer">
                          <span>View {count} {count === 1 ? "Member" : "Members"}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}