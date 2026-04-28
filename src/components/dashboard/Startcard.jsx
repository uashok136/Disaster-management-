import { TrendingUp } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color, sub }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-semibold font-outfit mt-0.5">{value}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {sub}
          </p>
        )}
      </div>
    </div>
  );
}