import axios from "axios";

export const IS_DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

export const API_BASE_URL = IS_DEBUG
  ? (process.env.NEXT_PUBLIC_API_URL_DEV || "http://0.0.0.0:8009")
  : (process.env.NEXT_PUBLIC_API_URL_PROD || "https://django.onlinecrmpro.com");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `JWT ${token}`;
    }
  }
  return config;
});

// Handle 401/403 — clear session, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      clearSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * POST with form-encoded body for Django views using request.POST.get().
 */
export function formPost(url: string, data: Record<string, string>) {
  const params = new URLSearchParams(data);
  return api.post(url, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

// --- Session helpers ---

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // Read from cookie (preferred) or fallback to localStorage
  const match = document.cookie.match(/(?:^|; )jwt=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSession(data: {
  jwt: string;
  id: number;
  firstName: string;
  lastName: string;
  branch_acess: string;
  acess_rights: string;
  branch_id: number;
  role: string;
}) {
  // Store JWT in a cookie (accessible across the app, sent with page navigations)
  document.cookie = `jwt=${encodeURIComponent(data.jwt)}; path=/; max-age=${200 * 60}; SameSite=Lax`;
  // Store branch_access cookie (used by backend and for branch context)
  document.cookie = `branch_access=${encodeURIComponent(data.branch_acess)}; path=/; max-age=${200 * 60}; SameSite=Lax`;

  // Store user session in a single JSON object (not scattered keys)
  const session = {
    user_id: data.id,
    first_name: data.firstName,
    last_name: data.lastName,
    branch_name: data.branch_acess,
    branch_id: data.branch_id,
    access_rights: data.acess_rights,
    role: data.role,
  };
  localStorage.setItem("miami_session", JSON.stringify(session));
}

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("miami_session");
    if (!raw) return null;
    return JSON.parse(raw) as {
      user_id: number;
      first_name: string;
      last_name: string;
      branch_name: string;
      branch_id: number;
      access_rights: string;
      role: string;
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  document.cookie = "jwt=; path=/; max-age=0";
  document.cookie = "branch_access=; path=/; max-age=0";
  localStorage.removeItem("miami_session");
}

// Get redirect path based on access rights
export function getLoginRedirect(accessRights: string): string {
  if (accessRights === "Wholesale") return "/profile";
  if (accessRights === "Emailer") return "/bulk-email";
  return "/";
}
