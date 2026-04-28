import { useEffect, useState } from 'react';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import CourseCard from '@/components/courses/CourseCard';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CourseFormDialog from '@/components/courses/Courseformdialog';

const categories = ['all', 'earthquake', 'flood', 'fire', 'cyclone', 'chemical', 'biological', 'general'];
const levels = ['all', 'beginner', 'intermediate', 'advanced'];

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    const [c, e] = await Promise.all([
      realtimeApp.entities.Course.filter({ is_published: true }),
      realtimeApp.entities.CourseEnrollment.filter({ user_email: user?.email }),
    ]);
    setCourses(c);
    setEnrollments(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const enrollmentMap = Object.fromEntries(enrollments.map(e => [e.course_id, e]));

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || c.category === category;
    const matchLevel = level === 'all' || c.level === level;
    return matchSearch && matchCat && matchLevel;
  });

  const handleEnroll = async (courseId) => {
    await realtimeApp.entities.CourseEnrollment.create({ course_id: courseId, user_email: user?.email, progress_percent: 0 });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-outfit font-semibold">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">Disaster preparedness & response training</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Course
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground">
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground">
          {levels.map(l => <option key={l} value={l}>{l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No courses found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CourseCard key={c.id} course={c} enrollment={enrollmentMap[c.id]} onEnroll={handleEnroll} />
          ))}
        </div>
      )}

      {showForm && <CourseFormDialog onClose={() => { setShowForm(false); load(); }} />}
    </div>
  );
}