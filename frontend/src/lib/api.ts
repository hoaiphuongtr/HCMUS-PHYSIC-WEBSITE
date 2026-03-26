const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return res.json();
}

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
}

export type UserProfile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  phone: string | null;
  position: string | null;
  bio: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const authApi = {
  getProfile() {
    return authFetch<UserProfile>("/auth/profile");
  },
  login(body: { email: string; password: string }) {
    return apiFetch<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  register(body: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
    code: string;
  }) {
    return apiFetch<{ id: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  sendOTP(body: { email: string; type: "REGISTER" | "FORGOT_PASSWORD" }) {
    return apiFetch<{ message: string }>("/auth/otp", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  verifyOTP(body: {
    email: string;
    code: string;
    type: "REGISTER" | "FORGOT_PASSWORD";
  }) {
    return apiFetch<{ message: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  forgotPassword(body: {
    email: string;
    code: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    return apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  googleLink() {
    return apiFetch<{ url: string }>("/auth/google-link");
  },
};

export type WidgetType = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WidgetInstance = {
  id: string;
  widgetId: string;
  pageLayoutId: string;
  config: Record<string, any>;
  order: number;
  row: number;
  colSpan: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  widget?: Pick<
    WidgetType,
    "id" | "type" | "name" | "icon" | "configSchema" | "defaultConfig"
  >;
};

export type PageLayout = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  puckData: any | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  widgets?: WidgetInstance[];
};

export const widgetApi = {
  list(params?: { category?: string; isActive?: string }) {
    const query = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined),
    ).toString();
    return apiFetch<WidgetType[]>(`/widgets${query ? `?${query}` : ""}`);
  },
  getById(id: string) {
    return apiFetch<WidgetType>(`/widgets/${id}`);
  },
  create(body: Partial<WidgetType>) {
    return authFetch<WidgetType>("/widgets", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: Partial<WidgetType>) {
    return authFetch<WidgetType>(`/widgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return authFetch<WidgetType>(`/widgets/${id}`, { method: "DELETE" });
  },
};

export const pageLayoutApi = {
  list() {
    return apiFetch<PageLayout[]>("/page-layouts");
  },
  getById(id: string) {
    return apiFetch<PageLayout>(`/page-layouts/${id}`);
  },
  getBySlug(slug: string) {
    return apiFetch<PageLayout>(`/page-layouts/slug/${slug}`);
  },
  create(body: { name: string; slug: string; description?: string }) {
    return authFetch<PageLayout>("/page-layouts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: Partial<PageLayout>) {
    return authFetch<PageLayout>(`/page-layouts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return authFetch<{ message: string }>(`/page-layouts/${id}`, {
      method: "DELETE",
    });
  },
  publish(id: string) {
    return authFetch<PageLayout>(`/page-layouts/${id}/publish`, {
      method: "POST",
    });
  },
  duplicate(id: string, name?: string) {
    return authFetch<PageLayout>(`/page-layouts/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify(name ? { name } : {}),
    });
  },
  addWidget(
    layoutId: string,
    body: {
      widgetId: string;
      config?: Record<string, any>;
      order: number;
      row?: number;
      colSpan?: number;
    },
  ) {
    return authFetch<WidgetInstance>(`/page-layouts/${layoutId}/widgets`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateWidget(
    layoutId: string,
    instanceId: string,
    body: {
      config?: Record<string, any>;
      order?: number;
      row?: number;
      colSpan?: number;
      isVisible?: boolean;
    },
  ) {
    return authFetch<WidgetInstance>(
      `/page-layouts/${layoutId}/widgets/${instanceId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  },
  removeWidget(layoutId: string, instanceId: string) {
    return authFetch<{ message: string }>(
      `/page-layouts/${layoutId}/widgets/${instanceId}`,
      { method: "DELETE" },
    );
  },
  reorderWidgets(layoutId: string, orderedInstanceIds: string[]) {
    return authFetch<PageLayout>(`/page-layouts/${layoutId}/widgets/reorder`, {
      method: "PUT",
      body: JSON.stringify({ orderedInstanceIds }),
    });
  },
  savePuckData(layoutId: string, puckData: any) {
    return authFetch<PageLayout>(`/page-layouts/${layoutId}/puck-data`, {
      method: "PUT",
      body: JSON.stringify({ puckData }),
    });
  },
};
