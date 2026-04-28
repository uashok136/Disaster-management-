import { useState } from 'react';
import { realtimeApp } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CourseFormDialog({ onClose, course }) {
  const [form, setForm] = useState({
    title: course?.title ?? '',
    description: course?.description ?? '',
    category: course?.category ?? 'general',
    level: course?.level ?? 'beginner',
    duration_minutes: course?.duration_minutes ?? 30,
    content: course?.content ?? '',
    target_audience: course?.target_audience ?? 'all',
    is_published: course?.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    if (course?.id) {
      await realtimeApp.entities.Course.update(course.id, form);
    } else {
      await realtimeApp.entities.Course.create(form);
    }
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'New Course'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Course title" className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description" className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                {['earthquake','flood','fire','cyclone','chemical','biological','general'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Level</Label>
              <select value={form.level} onChange={e => set('level', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                {['beginner','intermediate','advanced'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', +e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Target Audience</Label>
              <select value={form.target_audience} onChange={e => set('target_audience', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                {['all','students','teachers'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Course Content</Label>
            <Textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Course content..." className="mt-1" rows={5} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="rounded" />
            <Label htmlFor="published">Published (visible to students)</Label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Course'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}