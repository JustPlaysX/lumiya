import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { inviteUrl, FEATURES } from '@/lib/constants';

export default function HomePage() {
  const invite = inviteUrl();

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-lumiya-400/30 bg-lumiya-500/10 px-4 py-1.5 text-sm text-lumiya-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-lumiya-400" />
          Moderation · Leveling · Anti-Raid — alles in einem
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Verwalte deinen Server mit{' '}
          <span className="bg-gradient-to-r from-lumiya-300 via-lumiya-400 to-sky-400 bg-clip-text text-transparent">
            Lumiya
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Der moderne Discord-Verwaltungsbot mit allem, was MEE6 kann — plus starkem Honeypot- und
          Anti-Raid-Schutz. Alles bequem über ein übersichtliches Web-Dashboard konfigurierbar.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a href={invite} className="btn-primary text-base" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/></svg>
            Zu deinem Server hinzufügen
          </a>
          <Link href="/dashboard" className="btn-ghost text-base">
            Zum Dashboard →
          </Link>
        </div>

        {/* Stat-Reihe */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4">
          {[
            { value: '20+', label: 'Befehle' },
            { value: '6', label: 'Module' },
            { value: '24/7', label: 'Schutz' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="text-3xl font-extrabold text-lumiya-300">{s.value}</div>
              <div className="mt-1 text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-3 text-center text-3xl font-bold text-white">Alles, was dein Server braucht</h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-slate-400">
          Ein Bot, sechs mächtige Module — konfigurierbar in Sekunden.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group p-6 transition hover:border-lumiya-400/40 hover:shadow-glow">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-lumiya-500/15 text-2xl ring-1 ring-inset ring-lumiya-400/20">
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="card relative overflow-hidden p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-lumiya-500/15 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">Bereit loszulegen?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Füge Lumiya hinzu, melde dich mit Discord an und konfiguriere alle Module bequem im Browser.
            </p>
            <a href={invite} className="btn-primary mt-7 text-base" target="_blank" rel="noreferrer">
              Jetzt einladen
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Lumiya · Ein Discord-Verwaltungsbot
      </footer>
    </>
  );
}
