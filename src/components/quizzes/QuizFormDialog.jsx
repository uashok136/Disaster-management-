import { useState } from 'react';
import { realtimeApp } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export default function QuizFormDialog({ onClose, courses, quiz }) {
  const [form, setForm] = useState({
    title: quiz?.title ?? '',
    course_id: quiz?.course_id ?? (courses[0]?.id ?? ''),
    passing_score: quiz?.passing_score ?? 70,
    questions: quiz?.questions ?? [],
  });
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addQuestion = () => setField('questions', [...form.questions, { question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' }]);
  const removeQuestion = (i) => setField('questions', form.questions.filter((_, idx) => idx !== i));
  const updateQuestion = (i, k, v) => {
    const qs = [...form.questions];
    qs[i] = { ...qs[i], [k]: v };
    setField('questions', qs);
  };
  const updateOption = (qi, oi, v) => {
    const qs = [...form.questions];
    const opts = [...qs[qi].options];
    opts[oi] = v;
    qs[qi] = { ...qs[qi], options: opts };
    setField('questions', qs);
  };

  const handleSave = async () => {
    setSaving(true);
    if (quiz?.id) {
      await realtimeApp.entities.Quiz.update(quiz.id, form);
    } else {
      await realtimeApp.entities.Quiz.create(form);
    }
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz ? 'Edit Quiz' : 'Create Quiz'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quiz Title</Label>
              <Input value={form.title} onChange={e => setField('title', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Linked Course</Label>
              <select value={form.course_id} onChange={e => setField('course_id', e.target.value)} className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 bg-background">
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <div className="w-32">
            <Label>Passing Score (%)</Label>
            <Input type="number" value={form.passing_score} onChange={e => setField('passing_score', +e.target.value)} className="mt-1" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Questions ({form.questions.length})</Label>
              <Button size="sm" variant="outline" onClick={addQuestion} className="gap-1 text-xs"><Plus className="w-3 h-3" />Add Question</Button>
            </div>
            <div className="space-y-4">
              {form.questions.map((q, qi) => (
                <div key={qi} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">Question {qi + 1}</Label>
                    <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <Input value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Enter question..." />
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={q.correct_answer === oi} onChange={() => updateQuestion(qi, 'correct_answer', oi)} className="shrink-0" />
                        <Input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="text-xs h-8" />
                      </div>
                    ))}
                  </div>
                  <Input value={q.explanation} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} placeholder="Explanation (optional)" className="text-xs" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Quiz'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}