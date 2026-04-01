import { create } from "zustand";
import { api, getToken, getSession, setSession, clearSession, getLoginRedirect } from "@/lib/api";

export type AccessRights = "All" | "CRM" | "Wholesale" | "Emailer" | "CRM+Wholesale" | "CRM+Emailer" | "OrderManager+Wholesale";
export type UserRole = "Superadmin" | "SiteOwner" | "BranchOwner" | "StaffUser";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  branch_name: string;
  branch_id: number;
  access_rights: AccessRights;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Authenticate against POST /user/login/
   * Returns the redirect path on success.
   * Throws an error message string on failure.
   */
  login: async (username: string, password: string) => {
    const response = await api.post("/user/login/", { username, password });
    const data = response.data;

    // Persist session
    setSession(data);

    const user: User = {
      id: data.id,
      first_name: data.firstName,
      last_name: data.lastName,
      branch_name: data.branch_acess,
      branch_id: data.branch_id,
      access_rights: data.acess_rights,
      role: data.role,
    };

    set({ user, isAuthenticated: true, isLoading: false });

    return getLoginRedirect(data.acess_rights);
  },

  logout: () => {
    clearSession();
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  /**
   * Hydrate session from localStorage/cookies on app load.
   * No API call needed — just check if we have a valid token + session.
   */
  hydrate: () => {
    const token = getToken();
    const session = getSession();

    if (token && session) {
      set({
        user: {
          id: session.user_id,
          first_name: session.first_name,
          last_name: session.last_name,
          branch_name: session.branch_name,
          branch_id: session.branch_id,
          access_rights: session.access_rights as AccessRights,
          role: session.role as UserRole,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
