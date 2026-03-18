const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return res.json();
}

export const authApi = {
  login(body: { email: string; password: string }) {
    return apiFetch<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  googleLink() {
    return apiFetch<{ url: string }>("/auth/google-link");
  },
};
