import { useEffect, useMemo, useState } from 'react';
import { format, isValid } from 'date-fns';
import { AlertCircle, ArrowUpDown, Loader2, Lock, Search, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import { realtimeApp } from '../api/client';
import { useAuth } from '../lib/AuthContext';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'student', label: 'Student' },
];

const formatDate = (value) => {
  if (!value) return '—';

  const normalizedValue =
    typeof value === 'string' && value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
  const parsedDate = new Date(normalizedValue);

  if (!isValid(parsedDate)) return '—';

  return format(parsedDate, 'PP p');
};

const roleBadgeClasses = {
  admin: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  student: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
};

export default function AdminUsers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [draftRoles, setDraftRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await realtimeApp.admin.users.list();

        if (!active) return;

        setUsers(Array.isArray(data) ? data : []);
        setDraftRoles(
          Object.fromEntries(
            (Array.isArray(data) ? data : []).map((item) => [String(item.id), item.role || 'student'])
          )
        );
      } catch (requestError) {
        if (!active) return;
        setError(requestError?.message || 'Unable to load users.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return users;

    return users.filter((item) => {
      return [item.full_name, item.email, item.role]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));
    });
  }, [query, users]);

  const handleRoleChange = (id, nextRole) => {
    setDraftRoles((current) => ({
      ...current,
      [String(id)]: nextRole,
    }));
  };

  const handleSave = async (item) => {
    const nextRole = draftRoles[String(item.id)] || item.role;

    if (nextRole === item.role) {
      return;
    }

    setSavingId(String(item.id));
    setError('');

    try {
      const updated = await realtimeApp.admin.users.update(item.id, { role: nextRole });

      setUsers((current) =>
        current.map((entry) => {
          return String(entry.id) === String(updated.id) ? { ...entry, ...updated } : entry;
        })
      );
      setDraftRoles((current) => ({
        ...current,
        [String(updated.id)]: updated.role || nextRole,
      }));
    } catch (requestError) {
      setError(requestError?.message || 'Unable to update the user role.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (String(item.id) === String(user?.id)) {
      return;
    }

    const userLabel = item.full_name || item.email || 'this user';
    const confirmed = window.confirm(`Remove ${userLabel}? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeletingId(String(item.id));
    setError('');

    try {
      await realtimeApp.admin.users.delete(item.id);
      setUsers((current) => current.filter((entry) => String(entry.id) !== String(item.id)));
      setDraftRoles((current) => {
        const next = { ...current };
        delete next[String(item.id)];
        return next;
      });
    } catch (requestError) {
      setError(requestError?.message || 'Unable to remove the user.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Only administrators can manage users and change roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <Users className="h-3.5 w-3.5" />
              Admin users
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Manage users</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Review the people in the system and promote or demote roles when needed.
              </p>
            </div>
          </div>

          <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or role"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
            <p className="text-sm text-slate-500">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} shown
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 md:flex">
            <ArrowUpDown className="h-4 w-4" />
            Sorted by most recent activity
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center px-6 py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <UserCog className="h-10 w-10 text-slate-300" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">No users found</h3>
              <p className="text-sm text-slate-500">
                Try a different search term or clear the filter to view the full user list.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((item) => {
                  const currentRole = draftRoles[String(item.id)] || item.role || 'student';
                  const hasChanges = currentRole !== (item.role || 'student');
                  const isSelf = String(item.id) === String(user?.id);

                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">{item.full_name || 'Unnamed user'}</div>
                          {isSelf ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              You
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            roleBadgeClasses[item.role] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                          }`}
                        >
                          {item.role || 'student'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(item.created_date)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          <label className="sr-only" htmlFor={`role-${item.id}`}>
                            Role for {item.full_name || item.email}
                          </label>
                          <select
                            id={`role-${item.id}`}
                            value={currentRole}
                            onChange={(event) => handleRoleChange(item.id, event.target.value)}
                            disabled={isSelf || savingId === String(item.id) || deletingId === String(item.id)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSave(item)}
                            disabled={isSelf || savingId === String(item.id) || deletingId === String(item.id) || !hasChanges}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {savingId === String(item.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={isSelf || savingId === String(item.id) || deletingId === String(item.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
                          >
                            {deletingId === String(item.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Removing
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
