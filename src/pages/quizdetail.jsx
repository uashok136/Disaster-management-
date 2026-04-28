import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

export default function QuizDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    const [quizzes] = await Promise.all([
      realtimeApp.entities.Quiz.filter({ id }),
    ]);
    setQuiz(quizzes[0] || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleSubmit = async () => {
    const questions = quiz.questions ?? [];
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (quiz.passing_score ?? 70);

    await realtimeApp.entities.QuizAttempt.create({
      quiz_id: id,
      user_email: user?.email,
      score,
      passed,
      answers: questions.map((_, i) => answers[i] ?? -1),
      completed_at: new Date().toISOString(),
    });

    setResult({ score, passed, correct, total: questions.length });
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!quiz) return <div className="text-center py-20 text-muted-foreground">Quiz not found.</div>;

  const questions = quiz.questions ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/quizzes" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
        <span className="text-sm text-muted-foreground">Back to Quizzes</span>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-xl font-outfit font-semibold mb-1">{quiz.title}</h1>
        <p className="text-sm text-muted-foreground">{questions.length} questions · Passing score: {quiz.passing_score ?? 70}%</p>
      </div>

      {/* Result */}
      {submitted && result && (
        <div className={`rounded-xl p-6 text-center border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.passed
            ? <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            : <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />}
          <p className="text-2xl font-outfit font-bold mb-1">{result.score}%</p>
          <p className={`font-semibold ${result.passed ? 'text-green-700' : 'text-red-600'}`}>
            {result.passed ? '🎉 Congratulations! You passed!' : 'You did not pass this time.'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{result.correct} / {result.total} correct</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={handleRetry}>
            <RotateCcw className="w-3 h-3" /> Retry Quiz
          </Button>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const selected = answers[qi];
          const correct = q.correct_answer;
          return (
            <div key={qi} className="bg-card border border-border rounded-xl p-5">
              <p className="font-medium text-sm mb-4">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {(q.options ?? []).map((opt, oi) => {
                  let className = 'flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-all ';
                  if (submitted) {
                    if (oi === correct) className += 'bg-green-50 border-green-300 text-green-800';
                    else if (oi === selected && oi !== correct) className += 'bg-red-50 border-red-200 text-red-700';
                    else className += 'border-border text-muted-foreground';
                  } else {
                    className += selected === oi
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border hover:bg-muted/40 text-foreground';
                  }
                  return (
                    <div key={oi} className={className} onClick={() => !submitted && setAnswers(a => ({ ...a, [qi]: oi }))}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${selected === oi ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                      {opt}
                    </div>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && questions.length > 0 && (
        <Button onClick={handleSubmit} className="w-full" disabled={Object.keys(answers).length < questions.length}>
          Submit Quiz ({Object.keys(answers).length}/{questions.length} answered)
        </Button>
      )}
    </div>
  );
}