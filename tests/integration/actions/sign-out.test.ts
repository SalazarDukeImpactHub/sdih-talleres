import { describe, it, expect, vi, beforeEach } from "vitest";
import { signOut } from "@/app/(authenticated)/_actions/sign-out";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";

describe("Server Action: signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe llamar signOut() y redirigir a /auth/login", async () => {
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    try {
      await signOut();
    } catch (err) {
      const error = err as Error;
      expect(error.message).toBe("REDIRECT:/auth/login");
    }

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
