import { z } from 'zod';

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  workshop_id: z.string().uuid(),
  title: z.string(),
  objective: z.string(),
  prompt_text: z.string(),
  order: z.number().int().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

export const ExerciseProgressSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'done']),
  user_response_text: z.string().nullable(),
  updated_at: z.string().datetime(),
});

export type ExerciseProgress = z.infer<typeof ExerciseProgressSchema>;

export const SaveExerciseProgressSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  userResponse: z.string().max(10000, 'Response too long'),
  status: z.enum(['in_progress', 'done']).optional(),
});

export type SaveExerciseProgress = z.infer<typeof SaveExerciseProgressSchema>;
