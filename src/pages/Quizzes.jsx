import { useEffect, useState } from 'react';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuizFormDialog from '@/components/quizzes/QuizFormDialog';

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    const [q, c, a] = await Promise.all([
      realtimeApp.entities.Quiz.list(),
      realtimeApp.entities.Course.list(),
      realtimeApp.entities.QuizAttempt.filter({ user_email: user?.email }),
    ]);
    setQuizzes(q);
    setCourses(c);
    setAttempts(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));
  const attemptMap = Object.fromEntries(attempts.map(a => [a.quiz_id, a]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-outfit font-semibold">Quizzes</h1>
          <p className="text-sm text-muted-foreground mt-1">Test your disaster preparedness knowledge</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Quiz
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No quizzes available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(q => {
            const attempt = attemptMap[q.id];
            const course = courseMap[q.course_id];
            return (
              <Link key={q.id} to={`/quizzes/${q.id}`}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ClipboardList className="w-4 h-4 text-primary" />
                  </div>
                  {attempt && (
                    attempt.passed
                      ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Passed</span>
                      : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle className="w-3 h-3" /> Failed</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">{q.title}</h3>
                {course && <p className="text-xs text-muted-foreground mb-3">From: {course.title}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{q.questions?.length ?? 0} questions</span>
                  <span>Pass: {q.passing_score ?? 70}%</span>
                </div>
                {attempt && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Your score</span>
                      <span className={`font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-500'}`}>{attempt.score}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${attempt.passed ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${attempt.score}%` }} />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {showForm && <QuizFormDialog courses={courses} onClose={() => { setShowForm(false); load(); }} />}
    </div>
  );
}