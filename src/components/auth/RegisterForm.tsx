"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/(auth)/auth/registro/actions";
import { AuthCard } from "./AuthCard";
import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

const inputClass =
  "w-full px-4 py-2.5 bg-navy-600 border border-navy-500 text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan transition-shadow";

/**
 * RegisterForm — autoregistro público de una alumna.
 * Nombre + email + contraseña + confirmación. Al crear la cuenta va al catálogo
 * (o muestra aviso de confirmación de email según config de Supabase).
 */
export function RegisterForm() {
  const [state, formAction] = useActionState(signUp, {});

  return (
    <AuthCard className="sd-rise">
      {/* Volver a la vitrina */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-cyan"
      >
        ← Volver a los talleres
      </Link>

      {/* Logo */}
      <div className="flex justify-center mb-6">
        <span className="relative inline-block h-24 w-24 overflow-hidden rounded-xl ring-1 ring-white/10">
          <Image
            src="/branding/logo-lockup.png"
            alt="Salazar Duke Impact Hub"
            width={160}
            height={160}
            priority
            className="absolute inset-0 h-full w-full object-cover scale-[1.18]"
          />
        </span>
      </div>

      <h1 className="text-2xl font-bold text-center mb-2 font-display">
        Creá tu cuenta
      </h1>
      <p className="text-sm text-center text-text-secondary mb-6">
        Registrate para acceder a tus talleres con tu clave.
      </p>

      {/* Aviso de confirmación de email (si aplica) */}
      {state.info && (
        <div className="mb-4 rounded-lg border border-lime/30 bg-lime/10 p-4 text-sm text-lime">
          {state.info}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-text-primary">
            Nombre
          </label>
          <input id="name" name="name" type="text" placeholder="Tu nombre" className={inputClass} autoFocus />
          {state.errors?.name && <FormError message={state.errors.name} />}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-text-primary">
            Email
          </label>
          <input id="email" name="email" type="email" placeholder="tu@email.com" className={inputClass} />
          {state.errors?.email && <FormError message={state.errors.email} />}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2 text-text-primary">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="8+ caracteres, con letra y número"
            className={inputClass}
          />
          {state.errors?.password && <FormError message={state.errors.password} />}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-text-primary">
            Repetí la contraseña
          </label>
          <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Otra vez" className={inputClass} />
          {state.errors?.confirmPassword && <FormError message={state.errors.confirmPassword} />}
        </div>

        {state.errors?.submit && <FormError message={state.errors.submit} />}

        <SubmitButton>Crear cuenta</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿Ya tenés cuenta?{" "}
        <Link href="/auth/login" className="font-semibold text-cyan hover:underline">
          Ingresá
        </Link>
      </p>
    </AuthCard>
  );
}
