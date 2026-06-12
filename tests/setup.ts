import { vi } from "vitest";

/**
 * Setup file para Vitest con jsdom.
 * Mocks de Supabase y otros servicios que se usan en Server Actions.
 */

// Mock de @supabase/ssr para uso en tests
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    })),
  })),
}));

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirect to ${url}`);
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

// Mock de next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));
