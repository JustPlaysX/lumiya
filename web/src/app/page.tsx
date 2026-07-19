import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { inviteUrl, FEATURES } from '@/lib/constants';

export default function HomePage() {
  const invite = inviteUrl();

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
        <span className="inline-block rounded-full border border-lumiya-400/30 bg-lumiya-500/10 px-4 py-1 text-sm text-lumiya-200">
          Moderation · Leveling · Anti-Raid — alles in einem
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          Verwalte deinen Discord-Server mit{' '}
          <span className="bg-gradient-to-r from-lumiya-300 to-lumiya-500 bg-clip-text text-transparent">
            Lumiya
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Der moderne Verwaltungsbot mit allem, was MEE6 kann — plus starkem Honeypot- und
          Anti-Raid-Schutz. Einfach einrichten über ein übersichtliches Web-Dashboard.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a href={invite} className="btn-primary text-base" target="_blank" rel="noreferrer">
            Zu deinem Server hinzufügen
          </a>
          <Link href="/dashboard" className="btn-ghost text-base">
            Zum Dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass p-6 transition hover:border-lumiya-400/30">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="glass flex flex-col items-center gap-6 bg-gradient-to-br from-lumiya-600/20 to-transparent p-10 text-center">
          <h2 className="text-3xl font-bold text-white">Bereit loszulegen?</h2>
          <p className="max-w-xl text-slate-400">
            Füge Lumiya hinzu, melde dich mit Discord an und konfiguriere alle Module bequem im
            Browser.
          </p>
          <a href={invite} className="btn-primary text-base" target="_blank" rel="noreferrer">
            Jetzt einladen
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Lumiya · Ein Discord-Verwaltungsbot
      </footer>
    </>
  );
}
