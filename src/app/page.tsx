import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Image
        src="/logo-brain.png"
        alt="Salazar Duke Impact Hub"
        width={120}
        height={120}
        priority
      />
      <h1 className="mt-8 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-text-primary md:text-4xl">
        SDIH Talleres
      </h1>
      <p className="mt-3 max-w-md text-base text-text-secondary">
        Portal privado de talleres en vivo. Próximamente.
      </p>
      <p className="mt-12 font-[family-name:var(--font-space-grotesk)] text-sm uppercase tracking-[0.2em] text-cyan">
        Inteligencia con alma
      </p>
    </main>
  );
}
