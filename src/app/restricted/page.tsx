import Link from "next/link";

/**
 * Página /restricted — stub de acceso restringido por VPN.
 * Pública, sin autenticación requerida.
 * Implementación final de VPN enforcement va en change 8.
 */
export default function RestrictedPage() {
  return (
    <main className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Isotipo cerebro SDIH */}
        <div className="mb-6">
          <span className="text-6xl inline-block">🧠</span>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-text-primary font-display mb-4">
          Acceso restringido
        </h1>

        {/* Mensaje */}
        <p className="text-text-secondary mb-8 text-base sm:text-lg">
          Para acceder al portal necesitás estar conectado a la VPN. Si tenés problemas, contactá a Jennifer.
        </p>

        {/* Link de contacto (placeholder, definitivo en change 7) */}
        <Link
          href="https://wa.me/+5491234567890?text=Hola%20Jennifer%2C%20tengo%20problemas%20accediendo%20al%20portal."
          className="inline-block px-6 py-2.5 bg-cyan text-navy-900 rounded font-semibold hover:bg-cyan/90 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contactar a Jennifer
        </Link>
      </div>
    </main>
  );
}
