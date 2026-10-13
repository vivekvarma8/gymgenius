import React from "react";

export const SkeletonBox: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = "100%", height = 20, borderRadius = 8, className = "", style = {} }) => {
  return (
    <div
      className={`skeleton-shimmer-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton-container" aria-label="Loading dashboard analytics...">
      {/* Header Skeleton */}
      <div className="skeleton-header-row">
        <div>
          <SkeletonBox width={120} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonBox width={260} height={28} borderRadius={8} />
        </div>
        <SkeletonBox width={140} height={40} borderRadius={10} className="skeleton-hide-mobile" />
      </div>

      {/* Stat Grid Skeleton (6 compact cards) */}
      <div className="stat-grid skeleton-stat-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stat-card skeleton-stat-card">
            <div className="stat-card-top">
              <SkeletonBox width="60%" height={12} borderRadius={4} />
              <SkeletonBox width={28} height={28} borderRadius={8} />
            </div>
            <SkeletonBox width="45%" height={26} borderRadius={6} style={{ margin: "8px 0" }} />
            <SkeletonBox width="80%" height={11} borderRadius={4} />
          </div>
        ))}
      </div>

      {/* Plan Distribution & Actions Skeleton */}
      <div className="skeleton-bottom-grid">
        <div className="card skeleton-card">
          <SkeletonBox width={160} height={20} borderRadius={6} style={{ marginBottom: 16 }} />
          <div className="plans-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="plan-card skeleton-plan-card">
                <SkeletonBox width="50%" height={16} borderRadius={4} style={{ marginBottom: 10 }} />
                <SkeletonBox width="30%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
                <SkeletonBox width="100%" height={6} borderRadius={3} />
              </div>
            ))}
          </div>
        </div>

        <div className="card skeleton-card">
          <SkeletonBox width={140} height={20} borderRadius={6} style={{ marginBottom: 16 }} />
          <div className="quick-actions-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="quick-action-card skeleton-action-card">
                <SkeletonBox width={32} height={32} borderRadius={8} style={{ marginBottom: 8 }} />
                <SkeletonBox width="70%" height={14} borderRadius={4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MembersTableSkeleton: React.FC = () => {
  return (
    <div className="table-skeleton-container" aria-label="Loading member records...">
      <div className="skeleton-table-header">
        <SkeletonBox width={28} height={28} borderRadius={6} />
        <SkeletonBox width="20%" height={16} borderRadius={4} />
        <SkeletonBox width="25%" height={16} borderRadius={4} />
        <SkeletonBox width="18%" height={16} borderRadius={4} />
        <SkeletonBox width="15%" height={16} borderRadius={4} />
        <SkeletonBox width="10%" height={16} borderRadius={4} />
      </div>

      <div className="skeleton-table-rows">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-table-row">
            <SkeletonBox width={20} height={20} borderRadius={4} />
            <div className="skeleton-member-cell">
              <SkeletonBox width={34} height={34} borderRadius={10} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBox width="75%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonBox width="50%" height={11} borderRadius={4} />
              </div>
            </div>
            <SkeletonBox width="60%" height={14} borderRadius={4} />
            <SkeletonBox width={70} height={22} borderRadius={12} />
            <SkeletonBox width="50%" height={14} borderRadius={4} />
            <div style={{ display: "flex", gap: 6 }}>
              <SkeletonBox width={28} height={28} borderRadius={6} />
              <SkeletonBox width={28} height={28} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PageFallbackSkeleton: React.FC = () => {
  return (
    <div className="page-container page-fallback-skeleton">
      <div className="dashboard-wrapper">
        <DashboardSkeleton />
      </div>
    </div>
  );
};
