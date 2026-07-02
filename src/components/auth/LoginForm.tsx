"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/(auth)/auth/login/actions";
import { AuthCard } from "./AuthCard";
import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

/**
 * Componente LoginForm — formulario de login con useFormState de React 19.
 *
 * Campos:
 * - email (type="email")
 * - password (type="password")
 *
 * Botones:
 * - Primario cyan: "Ingresar"
 * - Secundario deshabilitado: "Ingresá con Google" (tooltip "Disponible próximamente")
 *
 * Comportamiento:
 * - Errores Zod mostrados inline bajo cada campo
 * - Errores de Supabase mostrados bajo los botones
 * - Microanimación sd-rise en el card (entrada fade + slide up)
 */
export function LoginForm() {
  const [state, formAction] = useActionState(signIn, {
    errors: undefined,
  });

  return (
    <AuthCard className="sd-rise">
      {/* Logo oficial Salazar Duke Impact Hub */}
      <div className="flex justify-center mb-6">
        <span className="relative inline-block h-32 w-32 sm:h-36 sm:w-36 overflow-hidden rounded-xl ring-1 ring-white/10">
          <Image
            src="/branding/logo-lockup.png"
            alt="Salazar Duke Impact Hub"
            width={220}
            height={220}
            priority
            className="absolute inset-0 h-full w-full object-cover scale-[1.18]"
          />
        </span>
      </div>

      <form action={formAction} className="space-y-4">
        {/* Título */}
        <h1 className="text-2xl font-bold text-center mb-6 font-display">
          Ingresá
        </h1>

        {/* Campo email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2 text-text-primary"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            className="w-full px-4 py-2.5 bg-navy-600 border border-navy-500 text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan transition-shadow"
            autoFocus
          />
          {state.errors?.email && (
            <FormError message={state.errors.email} />
          )}
        </div>

        {/* Campo password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-2 text-text-primary"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            className="w-full px-4 py-2.5 bg-navy-600 border border-navy-500 text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan transition-shadow"
          />
          {state.errors?.password && (
            <FormError message={state.errors.password} />
          )}
        </div>

        {/* Error genérico (Supabase, etc.) */}
        {state.errors?.submit && (
          <FormError message={state.errors.submit} />
        )}

        {/* Botón primario "Ingresar" */}
        <SubmitButton>Ingresar</SubmitButton>

        {/* Botón secundario deshabilitado "Ingresá con Google" */}
        <button
          type="button"
          disabled
          title="Disponible próximamente"
          className="w-full px-4 py-2.5 border-2 border-cyan text-cyan rounded-lg font-semibold cursor-not-allowed opacity-50 transition-opacity"
        >
          Ingresá con Google
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿No tenés cuenta?{" "}
        <Link href="/auth/registro" className="font-semibold text-cyan hover:underline">
          Registrate
        </Link>
      </p>
    </AuthCard>
  );
}
