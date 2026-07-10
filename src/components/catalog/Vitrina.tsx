"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicWorkshop } from "@/app/vitrina-actions";

interface VitrinaProps {
  workshops: PublicWorkshop[];
  whatsappNumber?: string;
}

/**
 * Vitrina — landing pública (sin login). Cualquiera ve los talleres:
 * portada, título, descripción, categoría, precio. CTAs para ingresar,
 * registrarse o consultar por WhatsApp. NO muestra el contenido pago.
 */
export function Vitrina({ workshops, whatsappNumber }: VitrinaProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const w of workshops) if (w.category) set.add(w.category);
    return ["Todos", ...Array.from(set).sort()];
  }, [workshops]);

  const filtered = useMemo(
    () =>
      activeCategory === "Todos"
        ? workshops
        : workshops.filter((w) => w.category === activeCategory),
    [workshops, activeCategory]
  );

  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        "Hola Jennifer, quiero información sobre un taller."
      )}`
    : null;

  return (
    <main className="min-h-screen bg-navy-900">
      {/* Top bar pública */}
      <header className="sticky top-0 z-40 border-b border-navy-600 bg-navy-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="relative inline-block h-9 w-9 overflow-hidden rounded-md ring-1 ring-white/10">
              <Image
                src="/branding/logo-brain.png"
                alt="Salazar Duke Impact Hub"
                width={56}
                height={56}
                priority
                className="absolute inset-0 h-full w-full object-cover scale-[1.35]"
              />
            </span>
            <span className="hidden text-base font-bold text-text-primary font-display sm:inline">
              SALAZAR DUKE <span className="font-normal text-text-muted">· Impact Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
            >
              Ingresar
            </Link>
            <Link
              href="/auth/registro"
              className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-navy-900 transition-all hover:brightness-110"
            >
              Registrate
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(25,198,230,0.12), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-[sdPulse_2s_ease-in-out_infinite]" />
            Talleres SDIH
          </div>
          <h1 className="mb-5 text-4xl font-bold font-display leading-[1.1] text-text-primary sm:text-5xl">
            Aprendé con propósito
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-text-secondary">
            Talleres prácticos de IA, negocio con impacto, bienestar y creatividad.
            Elegí uno, conseguí tu clave y empezá.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/registro"
              className="rounded-lg bg-cyan px-6 py-3 font-semibold text-navy-900 transition-all hover:brightness-110"
            >
              Crear cuenta gratis
            </Link>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-lime/40 px-6 py-3 font-semibold text-lime transition-colors hover:bg-lime/10"
              >
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="mb-4 text-2xl font-bold text-text-primary font-display">
          Nuestros talleres
        </h2>

        {/* Filtros */}
        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              const count =
                cat === "Todos"
                  ? workshops.length
                  : workshops.filter((w) => w.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-cyan text-navy-900"
                      : "border border-navy-600 bg-navy-700 text-text-secondary hover:border-cyan/60 hover:text-text-primary"
                  }`}
                >
                  {cat} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-navy-600 bg-navy-700 p-6 text-center text-text-secondary">
            Pronto vas a ver acá nuestros talleres.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((w) => (
              <article
                key={w.id}
                className="flex flex-col overflow-hidden rounded-xl border border-navy-600 bg-navy-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan/40"
              >
                {/* Cover */}
                <div
                  className="relative h-32 w-full bg-gradient-to-br from-navy-700 to-navy-800 bg-cover bg-center"
                  style={w.cover_image ? { backgroundImage: `url(${w.cover_image})` } : undefined}
                >
                  {!w.cover_image && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-transparent to-magenta/10" />
                  )}
                  {w.category && (
                    <span className="absolute left-2 top-2 rounded-full bg-navy-900/80 px-2.5 py-1 text-[10px] font-semibold text-cyan backdrop-blur">
                      {w.category}
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-1 font-display text-sm font-semibold text-text-primary line-clamp-2">
                    {w.title}
                  </h3>
                  <p className="mb-3 text-xs text-text-secondary line-clamp-3">
                    {w.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-xs text-text-muted">
                      {w.duration_min ? `${Math.round(w.duration_min / 60)} h` : ""}
                    </span>
                    {w.price_display && (
                      <span className="text-sm font-bold text-lime">{w.price_display}</span>
                    )}
                  </div>
                  <Link
                    href="/auth/registro"
                    className="mt-3 w-full rounded-lg bg-cyan/10 px-3 py-2 text-center text-xs font-semibold text-cyan transition-colors hover:bg-cyan hover:text-navy-900"
                  >
                    Quiero este taller
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer simple */}
      <footer className="border-t border-navy-600 py-8 text-center text-sm text-text-muted">
        Salazar Duke Impact Hub · Inteligencia con alma
      </footer>
    </main>
  );
}
