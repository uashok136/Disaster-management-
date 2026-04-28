import { useState } from 'react';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function IncidentFormDialog({ onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    incident_type: 'general',
    location: '',
    institution: '',
    severity: 'medium',
    casualties: 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await realtimeApp.entities.Incident.create({ ...form, reported_by: user?.email, status: 'reported' });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Incident Title</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief title" className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe what happened..." className="mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Incident Type</Label>
              <select value={form.incident_type} onChange={e => set('incident_type', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                {['earthquake','flood','fire','cyclone','chemical','biological','general'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Severity</Label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Street, City, State" className="mt-1" />
          </div>
          <div>
            <Label>Institution</Label>
            <Input value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="School / College name" className="mt-1" />
          </div>
          <div className="w-32">
            <Label>Casualties</Label>
            <Input type="number" value={form.casualties} onChange={e => set('casualties', +e.target.value)} className="mt-1" min={0} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.location}>
              {saving ? 'Reporting...' : 'Report Incident'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}