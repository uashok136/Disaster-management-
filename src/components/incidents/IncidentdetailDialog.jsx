import { useEffect, useMemo, useState } from 'react';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, SeverityBadge, INCIDENT_STATUS_ORDER, getIncidentStatusDescription, getIncidentStatusLabel } from './IncidentStatusBadge';
import { format } from 'date-fns';
import { Building2, Calendar, MapPin, Users2 } from 'lucide-react';

const getDateLabel = (value) => {
  if (!value) {
    return '—';
  }

  try {
    return format(new Date(value), 'MMM d, yyyy');
  } catch {
    return String(value);
  }
};

const getWorkflowSummary = (status) => {
  if (status === 'reported') {
    return 'Reported is the intake step for a new incident.';
  }

  if (status === 'under_review') {
    return 'Under review is the approval step before action begins.';
  }

  if (status === 'responding') {
    return 'Responding means the team is actively working the case.';
  }

  if (status === 'resolved') {
    return 'Resolved closes the report and records a closure timestamp.';
  }

  return '';
};

export default function IncidentDetailDialog({ incident, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [status, setStatus] = useState(incident?.status ?? 'reported');
  const [notes, setNotes] = useState(incident?.response_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(incident?.status ?? 'reported');
    setNotes(incident?.response_notes ?? '');
    setSaving(false);
    setError('');
  }, [incident]);

  const workflowSteps = useMemo(
    () =>
      INCIDENT_STATUS_ORDER.map((step, index) => ({
        value: step,
        order: index + 1,
        label: getIncidentStatusLabel(step),
        description: getIncidentStatusDescription(step),
      })),
    []
  );

  if (!incident) {
    return null;
  }

  const handleUpdate = async () => {
    if (!isAdmin) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');

    try {
      const nextResolvedAt =
        status === 'resolved'
          ? incident?.status === 'resolved'
            ? incident?.resolved_at ?? new Date().toISOString()
            : new Date().toISOString()
          : null;

      await realtimeApp.entities.Incident.update(incident.id, {
        status,
        response_notes: notes,
        resolved_at: nextResolvedAt,
      });

      onClose();
    } catch (requestError) {
      setError(requestError?.message || 'Unable to update this incident right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incident Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{incident.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={status} />
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border capitalize">
                {incident.incident_type}
              </span>
            </div>
          </div>

          {incident.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{incident.description}</p>
          )}

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{incident.location}</span>
            </div>
            {incident.institution && (
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{incident.institution}</span>
              </div>
            )}
            {Number(incident.casualties) > 0 && (
              <div className="flex items-center gap-2 text-slate-600">
                <Users2 className="w-4 h-4 shrink-0" />
                <span>{incident.casualties} casualties</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{getDateLabel(incident.created_date)}</span>
            </div>
          </div>

          {incident.reported_by && (
            <p className="text-xs text-slate-500">Reported by: {incident.reported_by}</p>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Workflow overview
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Reported is the intake step, under review is the approval step, responding means
              active response, and resolved closes the report.
            </p>

            <div className="mt-4 grid gap-3">
              {workflowSteps.map((step) => {
                const isActive = status === step.value;

                return (
                  <button
                    key={step.value}
                    type="button"
                    onClick={() => {
                      if (isAdmin) {
                        setStatus(step.value);
                      }
                    }}
                    disabled={!isAdmin}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    } ${!isAdmin ? 'cursor-default opacity-90' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                              isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {step.order}
                          </span>
                          <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {step.label}
                          </p>
                        </div>
                        <p className={`mt-2 text-sm ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-500">{getWorkflowSummary(status)}</p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{getIncidentStatusLabel(status)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{getDateLabel(incident.created_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resolved at</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {incident.resolved_at ? getDateLabel(incident.resolved_at) : 'Not resolved'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>Response Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  placeholder="Add approval notes, response details, or closure comments..."
                  className="mt-1"
                />
              </div>

              {status === 'resolved' && (
                <p className="text-xs text-slate-500">
                  Saving in resolved status will set <code>resolved_at</code> to the current time.
                </p>
              )}

              {status !== 'resolved' && incident.resolved_at && (
                <p className="text-xs text-slate-500">
                  Changing away from resolved clears the stored <code>resolved_at</code> value.
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving...' : 'Update Incident'}
                </Button>
              </div>
            </>
          )}

          {!isAdmin && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}