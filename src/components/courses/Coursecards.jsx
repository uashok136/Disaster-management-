import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';

const categoryColors = {
  earthquake: 'bg-orange-100 text-orange-700',
  flood: 'bg-blue-100 text-blue-700',
  fire: 'bg-red-100 text-red-700',
  cyclone: 'bg-purple-100 text-purple-700',
  chemical: 'bg-yellow-100 text-yellow-700',
  biological: 'bg-green-100 text-green-700',
  general: 'bg-gray-100 text-gray-700',
};

const levelColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function CourseCard({ course, enrollment }) {
  const progress = enrollment?.progress_percent ?? 0;

  return (
    <Link
      to={`/courses/${course.id}`}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group block"
    >
      <div className="h-2 bg-secondary">
        {progress > 0 && (
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex gap-1.5 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[course.category] || categoryColors.general}`}>
              {course.category}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColors[course.level] || levelColors.beginner}`}>
              {course.level}
            </span>
          </div>
          {enrollment?.completed && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Done</span>
          )}
        </div>

        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{course.description}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration_minutes ?? '—'} min
          </span>
          <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
            {progress > 0 ? `${progress}% done` : 'Start'}
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}