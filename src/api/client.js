const AUTH_TOKEN_KEY = 'disaster_auth_token_v1';

const getBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  if (typeof window !== 'undefined') return '';
  return 'http://127.0.0.1:8787';
};

const buildUrl = (path, query = {}) => {
  const base = getBaseUrl();
  const url = new URL(`${base}${path}`, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8787');

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

const setToken = (token) => {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

class ApiError extends Error {
  constructor(message, status, type = 'api_error') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
  }
}

const request = async (path, options = {}, requireAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (requireAuth) {
    const token = getToken();
    if (!token) {
      throw new ApiError('Authentication required', 401, 'auth_required');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError(data?.message || 'Authentication required', 401, 'auth_required');
    }
    throw new ApiError(data?.message || 'Request failed', res.status);
  }

  return data;
};

const entityApi = (entityName) => ({
  list: async (sortBy, limit) => {
    const query = {};
    if (sortBy) query.sortBy = sortBy;
    if (typeof limit === 'number') query.limit = limit;
    return request(`/api/entities/${entityName}${toQueryString(query)}`);
  },
  filter: async (criteria = {}) => {
    return request(`/api/entities/${entityName}${toQueryString(criteria)}`);
  },
  create: async (payload) => {
    return request(`/api/entities/${entityName}`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  update: async (id, patch) => {
    return request(`/api/entities/${entityName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch || {}),
    });
  },
  delete: async (id) => {
    return request(`/api/entities/${entityName}/${id}`, {
      method: 'DELETE',
    });
  },
});

function toQueryString(query = {}) {
  const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  const params = new URLSearchParams();
  entries.forEach(([k, v]) => params.set(k, String(v)));
  return `?${params.toString()}`;
}

export const realtimeApp = {
  entities: {
    Alert: entityApi('Alert'),
    Course: entityApi('Course'),
    CourseEnrollment: entityApi('CourseEnrollment'),
    Incident: entityApi('Incident'),
    Quiz: entityApi('Quiz'),
    QuizAttempt: entityApi('QuizAttempt'),
  },
  auth: {
    login: async ({ email, password }) => {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false);
      setToken(data?.token);
      return data?.user;
    },
    register: async ({ full_name, email, password }) => {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password }),
      }, false);
      setToken(data?.token);
      return data?.user;
    },
    me: async () => request('/api/auth/me'),
    logout: async () => {
      try {
        await request('/api/auth/logout', { method: 'POST' }, false);
      } catch {
        // ignore logout API errors for client-side signout
      }
      setToken(null);
    },
    redirectToLogin: (redirectUrl) => {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl || '/login';
      }
    },
  },
  admin: {
    users: {
      list: async () => request('/api/admin/users'),
      update: async (id, patch) =>
        request(`/api/admin/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch || {}),
        }),
      delete: async (id) =>
        request(`/api/admin/users/${id}`, {
          method: 'DELETE',
        }),
    },
  },
  realtime: {
    subscribe: (_listener) => {
      return () => {};
    },
  },
};
