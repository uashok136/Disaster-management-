import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, BookOpen, Users, CheckCircle, Edit } from 'lucide-react';
import CourseFormDialog from '@/components/courses/Courseformdialog';
import ReactMarkdown from 'react-markdown';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    const [allCourses, enrolls, qs] = await Promise.all([
      realtimeApp.entities.Course.filter({ id }),
      realtimeApp.entities.CourseEnrollment.filter({ course_id: id, user_email: user?.email }),
      realtimeApp.entities.Quiz.filter({ course_id: id }),
    ]);
    setCourse(allCourses[0] || null);
    setEnrollment(enrolls[0] || null);
    setQuizzes(qs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleEnroll = async () => {
    await realtimeApp.entities.CourseEnrollment.create({ course_id: id, user_email: user?.email, progress_percent: 10 });
    load();
  };

  const handleMarkComplete = async () => {
    if (enrollment) {
      await realtimeApp.entities.CourseEnrollment.update(enrollment.id, { progress_percent: 100, completed: true, completed_at: new Date().toISOString() });
      load();
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!course) return <div className="text-center py-20 text-muted-foreground">Course not found.</div>;

  const categoryColors = {
    earthquake: 'bg-orange-100 text-orange-700', flood: 'bg-blue-100 text-blue-700',
    fire: 'bg-red-100 text-red-700', cyclone: 'bg-purple-100 text-purple-700',
    chemical: 'bg-yellow-100 text-yellow-700', biological: 'bg-green-100 text-green-700', general: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/courses" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-sm text-muted-foreground">Back to Courses</span>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[course.category] || categoryColors.general}`}>{course.category}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{course.level}</span>
          </div>
          {isAdmin && <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-1"><Edit className="w-3 h-3" />Edit</Button>}
        </div>

        <h1 className="text-2xl font-outfit font-semibold mb-2">{course.title}</h1>
        <p className="text-muted-foreground text-sm mb-5">{course.description}</p>

        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap mb-6">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_minutes} min</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.target_audience}</span>
        </div>

        {enrollment ? (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span><span>{enrollment.progress_percent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${enrollment.progress_percent}%` }} />
              </div>
            </div>
            {!enrollment.completed && (
              <Button size="sm" onClick={handleMarkComplete} className="gap-1 shrink-0">
                <CheckCircle className="w-3 h-3" /> Mark Complete
              </Button>
            )}
            {enrollment.completed && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Completed
              </span>
            )}
          </div>
        ) : (
          <Button onClick={handleEnroll} className="gap-2"><BookOpen className="w-4 h-4" />Enroll in Course</Button>
        )}
      </div>

      {/* Content */}
      {course.content && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Course Content</h2>
          <div className="prose prose-sm max-w-none text-foreground">
            <ReactMarkdown>{course.content}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Quizzes</h2>
          <div className="space-y-3">
            {quizzes.map(q => (
              <Link key={q.id} to={`/quizzes/${q.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                <span className="text-sm font-medium">{q.title}</span>
                <span className="text-xs text-muted-foreground">{q.questions?.length ?? 0} questions →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showEdit && <CourseFormDialog course={course} onClose={() => { setShowEdit(false); load(); }} />}
    </div>
  );
}