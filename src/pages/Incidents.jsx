import { useEffect, useMemo, useState } from 'react';
import { realtimeApp } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import IncidentFormDialog from '@/components/incidents/IncidentFormDialog';
import IncidentDetailDialog from '@/components/incidents/IncidentdetailDialog';
import {
  INCIDENT_STATUS_ORDER,
  StatusBadge,
  SeverityBadge,
  getIncidentStatusMeta,
} from '@/components/incidents/IncidentStatusBadge';

const getIncidentTitle = (incident) =>
  incident?.title || incident?.incident_type || incident?.type || 'Incident';

const getIncidentLocation = (incident) => incident?.location || 'Unknown location';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const response = await realtimeApp.entities.Incident.list('-created_date', 100);
    setIncidents(Array.isArray(response) ? response : response?.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const statusCounts = useMemo(() => {
    return INCIDENT_STATUS_ORDER.reduce((acc, status) => {
      acc[status] = incidents.filter((incident) => incident.status === status).length;
      return acc;
    }, {});
  }, [incidents]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incidents.filter((incident) => {
      const title = String(getIncidentTitle(incident)).toLowerCase();
      const location = String(getIncidentLocation(incident)).toLowerCase();
      const incidentType = String(incident?.incident_type || '').toLowerCase();
      const matchSearch =
        !query || title.includes(query) || location.includes(query) || incidentType.includes(query);
      const matchStatus = statusFilter === 'all' || incident.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [incidents, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-outfit font-semibold">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-1">Report and track disaster incidents</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Report Incident
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            All
          </button>

          {INCIDENT_STATUS_ORDER.map((status) => {
            const meta = getIncidentStatusMeta(status);

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {INCIDENT_STATUS_ORDER.map((status) => {
          const meta = getIncidentStatusMeta(status);

          return (
            <div key={status} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xl font-semibold font-outfit">{statusCounts[status] || 0}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{meta.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No incidents found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Location</th>
                <th className="text-left px-5 py-3">Severity</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => setSelected(incident)}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{getIncidentTitle(incident)}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell capitalize">
                    {incident.incident_type}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {getIncidentLocation(incident)}
                  </td>
                  <td className="px-5 py-3">
                    <SeverityBadge severity={incident.severity} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                    {incident.created_date ? format(new Date(incident.created_date), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <IncidentFormDialog
          onClose={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {selected && (
        <IncidentDetailDialog
          incident={selected}
          onClose={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}