"use client";

import { useFormState } from "react-dom";
import { changePassword } from "@/app/(auth)/auth/change-password/actions";
import { AuthCard } from "./AuthCard";
import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

/**
 * Componente ChangePasswordForm — formulario para cambio forzado de contraseña.
 *
 * Campos:
 * - currentPassword (type="password"): contraseña actual (para re-verificación)
 * - newPassword (type="password"): nueva contraseña
 * - confirmPassword (type="password"): confirmación de nueva contraseña
 *
 * Comportamiento:
 * - Mensaje contextual: "Cambiá tu contraseña antes de continuar"
 * - Errores Zod mostrados inline bajo cada campo
 * - Errores de Supabase mostrados bajo los botones
 */
export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePassword, {
    errors: undefined,
  });

  return (
    <AuthCard className="sd-rise">
      <form action={formAction} className="space-y-4">
        {/* Título y mensaje contextual */}
        <h1 className="text-2xl font-bold text-center mb-2 font-display">
          Cambiar contraseña
        </h1>
        <p className="text-center text-text-secondary text-sm mb-6">
          Cambiá tu contraseña antes de continuar
        </p>

        {/* Campo contraseña actual */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium mb-2 text-text-primary"
          >
            Contraseña actual
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            placeholder="Tu contraseña temporal"
            className="w-full px-4 py-2.5 bg-navy-600 border border-navy-500 text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan transition-shadow"
            autoFocus
          />
          {state.errors?.currentPassword && (
            <FormError message={state.errors.currentPassword} />
          )}
        </div>

        {/* Campo contraseña nueva */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium mb-2 text-text-primary"
          >
            Contraseña nueva
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Mínimo 8 caracteres"
            className="w-full px-4 py-2.5 bg-navy-600 border border-navy-500 text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan transition-shadow"
          />
          {state.errors?.newPassword && (
            <FormError message={state.errors.newPassword} />
          )}
        </div>

        {/* Campo confirmación de contraseña nueva */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-2 text-text-primary"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirma tu nueva contraseña"
            className="w-full px-4 py-2.5 bg-navy-600 border border-navy-500 text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan transition-shadow"
          />
          {state.errors?.confirmPassword && (
            <FormError message={state.errors.confirmPassword} />
          )}
        </div>

        {/* Error genérico */}
        {state.errors?.submit && (
          <FormError message={state.errors.submit} />
        )}

        {/* Botón primario "Cambiar contraseña" */}
        <SubmitButton>Cambiar contraseña</SubmitButton>
      </form>
    </AuthCard>
  );
}
