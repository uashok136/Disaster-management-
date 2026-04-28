import { AlertTriangle, Info, Zap, X } from 'lucide-react';
import { useState } from 'react';

const severityConfig = {
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: Info, iconColor: 'text-blue-500' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: AlertTriangle, iconColor: 'text-yellow-500' },
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: Zap, iconColor: 'text-red-500' },
};

export default function AlertBanner({ alert }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const cfg = severityConfig[alert.severity] || severityConfig.info;
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${cfg.bg} ${cfg.text} mb-3`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{alert.title}</p>
        <p className="text-sm mt-0.5 opacity-90">{alert.message}</p>
      </div>
      <button onClick={() => setDismissed(true)} className="opacity-50 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}