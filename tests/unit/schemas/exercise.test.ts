import { describe, it, expect } from "vitest";
import {
  ExerciseSchema,
  ExerciseProgressSchema,
  SaveExerciseProgressSchema,
} from "@/lib/schemas/exercise";

/**
 * Unit Tests for Exercise Schemas (Zod validation)
 *
 * Design Decision D-2 & D-4: Validate all exercise-related schemas
 * - ExerciseSchema: full exercise definition
 * - ExerciseProgressSchema: user progress record
 * - SaveExerciseProgressSchema: Server Action input validation
 *
 * Test coverage per task 4a.2: valid inputs pass, invalid inputs rejected
 */

describe("Exercise Schemas", () => {
  // --- ExerciseSchema Tests ---
  describe("ExerciseSchema", () => {
    it("should validate a correct exercise", () => {
      const valid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        workshop_id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Test Exercise",
        objective: "Learn something",
        prompt_text: "Do this task...",
        order: 1,
        created_at: "2026-06-16T10:00:00Z",
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for id", () => {
      const invalid = {
        id: "not-a-uuid",
        workshop_id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Test Exercise",
        objective: "Learn something",
        prompt_text: "Do this task...",
        order: 1,
        created_at: "2026-06-16T10:00:00Z",
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid order (negative)", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        workshop_id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Test Exercise",
        objective: "Learn something",
        prompt_text: "Do this task...",
        order: -1,
        created_at: "2026-06-16T10:00:00Z",
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing title", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        workshop_id: "550e8400-e29b-41d4-a716-446655440001",
        // title missing
        objective: "Learn something",
        prompt_text: "Do this task...",
        order: 1,
        created_at: "2026-06-16T10:00:00Z",
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  // --- ExerciseProgressSchema Tests ---
  describe("ExerciseProgressSchema", () => {
    it("should validate pending status", () => {
      const valid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        exercise_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        user_response_text: null,
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseProgressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate in_progress status with response text", () => {
      const valid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        exercise_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "in_progress",
        user_response_text: "This is my response...",
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseProgressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate done status", () => {
      const valid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        exercise_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "done",
        user_response_text: "Completed response",
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseProgressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        exercise_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "invalid_status",
        user_response_text: null,
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID for user_id", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        user_id: "not-a-uuid",
        exercise_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        user_response_text: null,
        updated_at: "2026-06-16T10:00:00Z",
      };

      const result = ExerciseProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  // --- SaveExerciseProgressSchema Tests ---
  describe("SaveExerciseProgressSchema", () => {
    it("should validate save with in_progress status", () => {
      const valid = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        userResponse: "This is my response text...",
        status: "in_progress",
      };

      const result = SaveExerciseProgressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate save with done status", () => {
      const valid = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        userResponse: "Final response",
        status: "done",
      };

      const result = SaveExerciseProgressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate save without status (defaults to in_progress)", () => {
      const valid = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        userResponse: "Response without explicit status",
      };

      const result = SaveExerciseProgressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject response over 10000 characters", () => {
      const invalid = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        userResponse: "a".repeat(10001),
      };

      const result = SaveExerciseProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should accept response of exactly 10000 characters", () => {
      const valid = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        userResponse: "a".repeat(10000),
      };

      const result = SaveExerciseProgressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid exercise UUID", () => {
      const invalid = {
        exerciseId: "not-a-uuid",
        userResponse: "Response text",
      };

      const result = SaveExerciseProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status enum", () => {
      const invalid = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        userResponse: "Response",
        status: "invalid_status",
      };

      const result = SaveExerciseProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing userResponse", () => {
      const invalid = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        // userResponse missing
      };

      const result = SaveExerciseProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing exerciseId", () => {
      const invalid = {
        // exerciseId missing
        userResponse: "Response",
      };

      const result = SaveExerciseProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
