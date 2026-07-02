import { RegisterForm } from "@/components/auth/RegisterForm";

/**
 * Página de registro — autoregistro público de alumnas.
 * Layout centrado sobre fondo navy, igual al login.
 */
export default function RegistroPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-navy-900 py-10">
      <RegisterForm />
    </main>
  );
}
