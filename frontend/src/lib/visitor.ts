const COOKIE_NAME = "visitor_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

export function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )visitor_id=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
  return id;
}

export function getSubscriberEmail(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )subscriber_email=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSubscriberEmail(email: string) {
  if (typeof document === "undefined") return;
  document.cookie = `subscriber_email=${encodeURIComponent(email)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
}

export function clearSubscriberEmail() {
  if (typeof document === "undefined") return;
  document.cookie = `subscriber_email=; max-age=0; path=/`;
}
