import { useEffect, useState } from 'react';
import { realtimeApp } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import AlertBanner from '@/components/alerts/AlertBanner';
import { BookOpen, AlertTriangle, Bell, ClipboardList, TrendingUp, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  INCIDENT_STATUS_ORDER,
  StatusBadge,
  getIncidentStatusMeta,
} from '@/components/incidents/IncidentStatusBadge';

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      realtimeApp.entities.Course.list(),
      realtimeApp.entities.Alert.filter({ is_active: true }),
      realtimeApp.entities.Incident.list('-created_date', 10),
      realtimeApp.entities.CourseEnrollment.filter({ user_email: user?.email }),
    ]).then(([c, a, i, e]) => {
      setCourses(c);
      setAlerts(a);
      setIncidents(i);
      setEnrollments(e);
      setLoading(false);
    });
  }, [user]);

  const activeAlerts = alerts.filter((alert) => alert.is_active);
  const criticalAlerts = alerts.filter((alert) => alert.severity === 'critical');
  const completedCourses = enrollments.filter((enrollment) => enrollment.completed).length;

  const incidentsByType = incidents.reduce((acc, incident) => {
    acc[incident.incident_type] = (acc[incident.incident_type] || 0) + 1;
    return acc;
  }, {});
  const incidentChartData = Object.entries(incidentsByType).map(([name, count]) => ({ name, count }));

  const incidentStatusSummary = INCIDENT_STATUS_ORDER.map((status) => {
    const meta = getIncidentStatusMeta(status);
    const colorMap = {
      reported: '#facc15',
      under_review: '#3b82f6',
      responding: '#f97316',
      resolved: '#22c55e',
    };

    return {
      key: status,
      name: meta.label,
      value: incidents.filter((incident) => incident.status === status).length,
      color: colorMap[status],
    };
  });

  const incidentsByStatus = incidentStatusSummary.filter((entry) => entry.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Disaster Preparedness & Response Education System
        </p>
      </div>

      {criticalAlerts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Active Alerts
          </p>
          {criticalAlerts.slice(0, 2).map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Courses" value={courses.length} icon={BookOpen} color="blue" sub="Available to enroll" />
        <StatCard
          label="Completed Courses"
          value={completedCourses}
          icon={TrendingUp}
          color="green"
          sub="By you"
        />
        <StatCard
          label="Active Alerts"
          value={activeAlerts.length}
          icon={Bell}
          color={criticalAlerts.length > 0 ? 'red' : 'orange'}
          sub={`${criticalAlerts.length} critical`}
        />
        <StatCard label="Total Incidents" value={incidents.length} icon={AlertTriangle} color="purple" sub="Reported incidents" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {incidentChartData.length > 0 ? (
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-semibold text-sm mb-4">Incidents by Type</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incidentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No incident data yet</p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-sm">Incidents by Status</p>
          </div>

          {incidentsByStatus.length > 0 ? (
            <>
              <div className="flex items-center gap-6 mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={incidentsByStatus}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {incidentsByStatus.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {incidentStatusSummary.map((status) => (
                  <div key={status.key} className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge status={status.key} />
                      <span className="text-sm font-semibold text-foreground">{status.value}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{status.name}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No status data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <p className="font-semibold text-sm">Recent Incidents</p>
          <Link to="/incidents" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No incidents reported yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Location</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents.slice(0, 5).map((incident) => (
                <tr key={incident.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{incident.title}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell capitalize">
                    {incident.incident_type}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {incident.location}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={incident.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}