import { runtimeConfig } from "@/lib/runtime";
import { apiRequest } from "@/services/api-client";
import { mockApi } from "@/services/mock-api";
import type { SessionUser } from "@/types/domain";

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export interface AuthSession {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string | null;
}

export interface UpdateProfileInput {
  fullName: string;
  phone: string;
  email?: string;
  specialization?: string;
  parentName?: string;
  parentPhone?: string;
  parentTelegramHandle?: string;
}

function mapUser(user: Record<string, unknown>): SessionUser {
  return {
    id: String(user.id),
    profileId: user.profileId ? String(user.profileId) : undefined,
    fullName: String(user.fullName),
    role: String(user.role) as SessionUser["role"],
    phone: String(user.phone),
    email: user.email ? String(user.email) : undefined,
    avatar: user.avatar ? String(user.avatar) : undefined
  };
}

export const authService = {
  isMockMode: runtimeConfig.useMockApi,

  async login(input: LoginInput): Promise<AuthSession> {
    if (runtimeConfig.useMockApi) {
      const response = await mockApi.login(input.identifier, input.password);
      return {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: null
      };
    }

    const response = await apiRequest<{
      user: Record<string, unknown>;
      tokens: { accessToken: string; refreshToken: string };
    }>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(input)
    });

    return {
      user: mapUser(response.user),
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken
    };
  },

  async register(input: RegisterInput) {
    if (runtimeConfig.useMockApi) {
      return mockApi.register();
    }

    return apiRequest<{ message: string }>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(input)
    });
  },

  async forgotPassword(identifier: string) {
    if (runtimeConfig.useMockApi) {
      return {
        message: "Tiklash tokeni yaratildi.",
        token: "demo-reset-token"
      };
    }

    return apiRequest<{ message: string; token?: string }>("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ identifier })
    });
  },

  async resetPassword(token: string, password: string) {
    if (runtimeConfig.useMockApi) {
      return { message: "Parol yangilandi." };
    }

    return apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ token, password })
    });
  },

  async me() {
    return apiRequest<SessionUser>("/auth/me").then((user) => mapUser(user as unknown as Record<string, unknown>));
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    const response = await apiRequest<{
      user: Record<string, unknown>;
      tokens: { accessToken: string; refreshToken: string };
    }>("/auth/refresh", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refreshToken })
    });

    return {
      user: mapUser(response.user),
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken
    };
  },

  async logout() {
    if (runtimeConfig.useMockApi) {
      return { message: "Sessiya yopildi." };
    }

    return apiRequest<{ message: string }>("/auth/logout", {
      method: "POST"
    });
  },

  async updateProfile(input: UpdateProfileInput) {
    return apiRequest<SessionUser>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(input)
    }).then((user) => mapUser(user as unknown as Record<string, unknown>));
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async uploadAvatar(fileName: string, dataUrl: string) {
    return apiRequest<SessionUser>("/auth/avatar", {
      method: "POST",
      body: JSON.stringify({ fileName, dataUrl })
    }).then((user) => mapUser(user as unknown as Record<string, unknown>));
  }
};
