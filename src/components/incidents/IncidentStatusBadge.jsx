const cx = (...classes) => classes.filter(Boolean).join(" ");

const statusConfig = Object.freeze({
  reported: {
    label: "Reported",
    description: "New report awaiting review.",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  under_review: {
    label: "Under Review",
    description: "Approval step before active response begins.",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  responding: {
    label: "Responding",
    description: "The response team is actively handling the incident.",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  resolved: {
    label: "Resolved",
    description: "The report is closed.",
    className: "bg-green-100 text-green-700 border-green-200",
  },
});

const severityConfig = Object.freeze({
  low: { label: "Low", className: "bg-gray-100 text-gray-600 border-gray-200" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200" },
});

const severityAliases = Object.freeze({
  minor: "low",
  moderate: "medium",
  normal: "medium",
  major: "high",
  urgent: "critical",
});

export const INCIDENT_STATUS_ORDER = Object.freeze([
  "reported",
  "under_review",
  "responding",
  "resolved",
]);

export const INCIDENT_STATUS_META = statusConfig;

export const getIncidentStatusMeta = (status) => statusConfig[status] || statusConfig.reported;

export const getIncidentStatusLabel = (status) => getIncidentStatusMeta(status).label;

export const getIncidentStatusDescription = (status) => getIncidentStatusMeta(status).description;

const getSeverityKey = (severity) => {
  if (!severity) {
    return null;
  }

  const normalized = String(severity).toLowerCase();
  return severityConfig[normalized] ? normalized : severityAliases[normalized] ?? null;
};

export function StatusBadge({ status, className = "" }) {
  const cfg = getIncidentStatusMeta(status);

  return (
    <span
      className={cx(
        "inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border",
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ severity, className = "" }) {
  const severityKey = getSeverityKey(severity);
  const cfg = (severityKey && severityConfig[severityKey]) || severityConfig.low;

  return (
    <span
      className={cx(
        "inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border",
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}