import { LoginForm } from "@/components/auth/LoginForm";

/**
 * Página de login — Server Component que renderiza el formulario de autenticación.
 * Layout: centrado vertical + horizontal con fondo navy-900.
 */
export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-navy-900">
      <LoginForm />
    </main>
  );
}
