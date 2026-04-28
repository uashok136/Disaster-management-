import { useState } from 'react';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AlertFormDialog({ onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    message: '',
    severity: 'warning',
    disaster_type: 'general',
    target_institution: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    setSaving(true);
    await realtimeApp.entities.Alert.create({ ...form, sent_by: user?.email });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Emergency Alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Alert title" className="mt-1" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="Describe the alert..." className="mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Severity</Label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <Label>Disaster Type</Label>
              <select value={form.disaster_type} onChange={e => set('disaster_type', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                {['earthquake','flood','fire','cyclone','chemical','biological','general'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Target Institution (optional)</Label>
            <Input value={form.target_institution} onChange={e => set('target_institution', e.target.value)} placeholder="e.g. Delhi Public School" className="mt-1" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={saving || !form.title || !form.message} className="bg-destructive hover:bg-destructive/90">
              {saving ? 'Sending...' : 'Send Alert'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}