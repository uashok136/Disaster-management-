import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldAlert } from 'lucide-react';

export default function AuthPage() {
  const { isAuthenticated, login, register, isLoadingAuth, authError } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!form.email || !form.password) return false;
    if (mode === 'register' && !form.full_name) return false;
    return true;
  }, [form, mode]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);

    const action = mode === 'login' ? login : register;
    const payload = mode === 'login'
      ? { email: form.email, password: form.password }
      : { full_name: form.full_name, email: form.email, password: form.password };

    const result = await action(payload);
    setSubmitting(false);

    if (result?.success) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mx-auto">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold font-outfit">DisasterEdu</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`text-sm rounded-md py-1.5 transition ${mode === 'login' ? 'bg-card border border-border' : 'text-muted-foreground'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`text-sm rounded-md py-1.5 transition ${mode === 'register' ? 'bg-card border border-border' : 'text-muted-foreground'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setField('full_name', e.target.value)}
                placeholder="Your full name"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="••••••••"
              className="mt-1"
            />
          </div>

          {(authError?.message && !isLoadingAuth) && (
            <p className="text-sm text-red-600">{authError.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={!canSubmit || submitting || isLoadingAuth}>
            {submitting || isLoadingAuth
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1">
          <p className="font-medium">Default Admin (seeded):</p>
          <p>Email: admin@local.app</p>
          <p>Password: Admin@123</p>
        </div>
      </div>
    </div>
  );
}
