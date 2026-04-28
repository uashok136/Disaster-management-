import { useEffect, useState } from 'react';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Zap, AlertTriangle, Info, Trash2, BellOff } from 'lucide-react';
import AlertFormDialog from '@/components/alerts/AlertFormDialog';
import { format } from 'date-fns';

const severityConfig = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Info' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', label: 'Warning' },
  critical: { icon: Zap, bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Critical' },
};

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    const a = await realtimeApp.entities.Alert.list('-created_date', 50);
    setAlerts(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (id) => {
    await realtimeApp.entities.Alert.update(id, { is_active: false });
    load();
  };

  const handleDelete = async (id) => {
    await realtimeApp.entities.Alert.delete(id);
    load();
  };

  const filtered = filter === 'all' ? alerts : filter === 'active' ? alerts.filter(a => a.is_active) : alerts.filter(a => a.severity === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-outfit font-semibold">Emergency Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">Active notifications and emergency broadcasts</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Send Alert
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'critical', 'warning', 'info'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const cfg = severityConfig[alert.severity] || severityConfig.info;
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border} ${!alert.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    <Icon className="w-5 h-5 text-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      <span className="text-xs text-muted-foreground capitalize bg-white/60 px-2 py-0.5 rounded-full border">{alert.disaster_type}</span>
                      {!alert.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-sm text-foreground/80 mt-0.5">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {alert.target_institution && <span>📍 {alert.target_institution}</span>}
                      <span>Sent {format(new Date(alert.created_date), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      {alert.is_active && (
                        <button onClick={() => handleDeactivate(alert.id)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-white/60 transition-colors" title="Deactivate">
                          <BellOff className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(alert.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <AlertFormDialog onClose={() => { setShowForm(false); load(); }} />}
    </div>
  );
}