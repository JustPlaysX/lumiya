'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import type { GuildSettings } from '@prisma/client';
import type { GuildChannel, GuildRole } from '@/lib/discord';
import type { EmbedConfig } from '@/lib/embed';
import EmbedBuilder from '@/components/EmbedBuilder';
import RoleSelect from '@/components/RoleSelect';
import type { SaveState } from '@/app/dashboard/[guildId]/actions';

type Action = (prev: SaveState, fd: FormData) => Promise<SaveState>;

const TABS = [
  { key: 'welcome', label: 'Willkommen', icon: '👋' },
  { key: 'leveling', label: 'Leveling', icon: '⭐' },
  { key: 'moderation', label: 'Moderation', icon: '🛡️' },
  { key: 'security', label: 'Sicherheit', icon: '🍯' },
  { key: 'permissions', label: 'Rechte', icon: '🔑' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function Switch({
  name,
  label,
  desc,
  defaultChecked,
}: {
  name: string;
  label: string;
  desc?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-white/10">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-100">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>}
      </span>
      <span className="relative shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="switch-track" />
        <span className="switch-knob" />
      </span>
    </label>
  );
}

function ChannelSelect({
  name,
  label,
  channels,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  channels: GuildChannel[];
  defaultValue: string | null;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={defaultValue ?? ''} className="input">
        <option value="">— kein Kanal —</option>
        {channels.map((c) => (
          <option key={c.id} value={c.id}>#{c.name}</option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function CheckboxList({
  name,
  label,
  options,
  selected,
  prefix,
  hint,
}: {
  name: string;
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  prefix: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2 sm:grid-cols-2">
        {options.length === 0 && <p className="p-2 text-xs text-slate-500">Keine verfügbar.</p>}
        {options.map((o) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/5"
          >
            <input
              type="checkbox"
              name={name}
              value={o.id}
              defaultChecked={selected.includes(o.id)}
              className="h-4 w-4 rounded border-white/20 bg-black/40 accent-lumiya-500"
            />
            <span className="truncate text-slate-200">{prefix}{o.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  hint,
  defaultValue,
  type = 'text',
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | number | null;
  type?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} className="input" />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function TextArea({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} defaultValue={defaultValue ?? ''} rows={2} className="input" />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SectionTitle({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lumiya-500/15 text-xl ring-1 ring-inset ring-lumiya-400/20">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

export default function SettingsForm({
  action,
  settings,
  channels,
  roles,
  guildId,
}: {
  action: Action;
  settings: GuildSettings;
  channels: GuildChannel[];
  roles: GuildRole[];
  guildId: string;
}) {
  const perms = (settings.permissions ?? {}) as Record<string, string[]>;
  const [state, formAction, pending] = useActionState<SaveState, FormData>(action, { ok: false });
  const [tab, setTab] = useState<TabKey>('welcome');

  // Aktiven Reiter beim Neuladen aus dem URL-Anker wiederherstellen
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (TABS.some((t) => t.key === h)) setTab(h as TabKey);
  }, []);
  const selectTab = (k: TabKey) => {
    setTab(k);
    window.history.replaceState(null, '', `#${k}`);
  };
  const [welcomeMode, setWelcomeMode] = useState<'text' | 'embed'>(
    settings.welcomeMode === 'embed' ? 'embed' : 'text',
  );

  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
  const roleOptions = roles.map((r) => ({ id: r.id, name: r.name }));
  const channelOptions = textChannels.map((c) => ({ id: c.id, name: c.name }));

  return (
    <form action={formAction} className="flex flex-col gap-6 lg:flex-row">
      {/* Seitenleiste */}
      <aside className="lg:w-56 lg:shrink-0">
        <nav className="card flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-20 lg:flex-col">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              className={`nav-link shrink-0 ${tab === t.key ? 'nav-link-active' : ''}`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="my-1 hidden h-px bg-white/10 lg:block" />
          <Link href={`/dashboard/${guildId}/embeds`} className="nav-link shrink-0">
            <span className="text-lg">✨</span>
            Embeds
          </Link>
        </nav>
      </aside>

      {/* Inhalt */}
      <div className="min-w-0 flex-1">
        {/* Willkommen */}
        <div className={tab === 'welcome' ? 'card p-6' : 'hidden'}>
          <SectionTitle icon="👋" title="Willkommen & Abschied" desc="Begrüße neue Mitglieder und vergib Auto-Rollen." />
          <div className="grid gap-4">
            <Switch name="welcomeEnabled" label="Willkommensnachricht" desc="Nachricht senden, wenn jemand beitritt" defaultChecked={settings.welcomeEnabled} />
            <ChannelSelect name="welcomeChannelId" label="Willkommens-Kanal" channels={textChannels} defaultValue={settings.welcomeChannelId} />

            {/* Modus: Text oder Embed */}
            <input type="hidden" name="welcomeMode" value={welcomeMode} />
            <div>
              <label className="label">Nachrichtentyp</label>
              <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
                {(['text', 'embed'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setWelcomeMode(m)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                      welcomeMode === m ? 'bg-lumiya-500 text-ink-900' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {m === 'text' ? 'Text' : 'Embed'}
                  </button>
                ))}
              </div>
            </div>

            <div className={welcomeMode === 'text' ? '' : 'hidden'}>
              <TextArea name="welcomeMessage" label="Willkommenstext" hint="Platzhalter: {user} {username} {server} {membercount}" defaultValue={settings.welcomeMessage} />
            </div>
            <div className={welcomeMode === 'embed' ? '' : 'hidden'}>
              <EmbedBuilder name="welcomeEmbedJson" initial={settings.welcomeEmbed as EmbedConfig | null} />
            </div>
            <hr className="border-white/10" />
            <Switch name="leaveEnabled" label="Abschiedsnachricht" desc="Nachricht senden, wenn jemand geht" defaultChecked={settings.leaveEnabled} />
            <ChannelSelect name="leaveChannelId" label="Abschieds-Kanal" channels={textChannels} defaultValue={settings.leaveChannelId} />
            <TextArea name="leaveMessage" label="Abschiedstext" defaultValue={settings.leaveMessage} />
            <hr className="border-white/10" />
            <div>
              <label className="label">Auto-Rollen bei Beitritt</label>
              <p className="mb-2 text-xs text-slate-500">Diese Rollen bekommt jedes neue Mitglied automatisch.</p>
              <RoleSelect name="autoRoleIds" roles={roles} initial={settings.autoRoleIds} />
            </div>
          </div>
        </div>

        {/* Leveling */}
        <div className={tab === 'leveling' ? 'card p-6' : 'hidden'}>
          <SectionTitle icon="⭐" title="Leveling & XP" desc="Belohne aktive Mitglieder mit XP und Level-Rollen." />
          <div className="grid gap-4">
            <Switch name="levelingEnabled" label="Leveling aktiv" desc="XP für Nachrichten vergeben" defaultChecked={settings.levelingEnabled} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field name="xpPerMessageMin" label="XP min." type="number" defaultValue={settings.xpPerMessageMin} />
              <Field name="xpPerMessageMax" label="XP max." type="number" defaultValue={settings.xpPerMessageMax} />
              <Field name="xpCooldownSeconds" label="Cooldown (s)" type="number" defaultValue={settings.xpCooldownSeconds} />
            </div>
            <ChannelSelect name="levelUpChannelId" label="Level-Up-Kanal" hint="Leer = Nachricht im selben Kanal." channels={textChannels} defaultValue={settings.levelUpChannelId} />
            <TextArea name="levelUpMessage" label="Level-Up-Text" hint="Platzhalter: {user} {level}" defaultValue={settings.levelUpMessage} />
          </div>
        </div>

        {/* Moderation */}
        <div className={tab === 'moderation' ? 'card p-6' : 'hidden'}>
          <SectionTitle icon="🛡️" title="Moderation & AutoMod" desc="Wortfilter, Anti-Spam und Protokollierung." />
          <div className="grid gap-4">
            <ChannelSelect name="modLogChannelId" label="Mod-Log-Kanal" channels={textChannels} defaultValue={settings.modLogChannelId} />
            <Switch name="autoModEnabled" label="AutoMod" desc="Wortfilter aktiv" defaultChecked={settings.autoModEnabled} />
            <Switch name="antiSpamEnabled" label="Anti-Spam" desc="Zu schnelle Nachrichten automatisch stummschalten" defaultChecked={settings.antiSpamEnabled} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="antiSpamMaxMsgs" label="Max. Nachrichten" type="number" defaultValue={settings.antiSpamMaxMsgs} />
              <Field name="antiSpamPerSeconds" label="im Zeitfenster (s)" type="number" defaultValue={settings.antiSpamPerSeconds} />
            </div>
            <TextArea name="bannedWords" label="Verbotene Wörter" hint="Mit Komma oder Zeilenumbruch trennen." defaultValue={settings.bannedWords.join(', ')} />
          </div>
        </div>

        {/* Sicherheit */}
        <div className={tab === 'security' ? 'card p-6' : 'hidden'}>
          <SectionTitle icon="🍯" title="Honeypot & Anti-Raid" desc="Automatischer Schutz gegen Raid- und Spam-Bots." />
          <div className="grid gap-4">
            <Switch name="honeypotEnabled" label="Honeypot" desc="Falle-Kanäle gegen Bots" defaultChecked={settings.honeypotEnabled} />
            <div>
              <label className="label" htmlFor="honeypotAction">Aktion bei Treffer</label>
              <select id="honeypotAction" name="honeypotAction" defaultValue={settings.honeypotAction} className="input">
                <option value="ban">Bann</option>
                <option value="kick">Kick</option>
                <option value="timeout">Timeout (24h)</option>
              </select>
            </div>
            <CheckboxList name="honeypotChannelIds" label="Honeypot-Kanäle" hint="Kanäle, in denen kein echter Nutzer posten sollte." options={channelOptions} selected={settings.honeypotChannelIds} prefix="#" />
            <hr className="border-white/10" />
            <Switch name="antiRaidEnabled" label="Anti-Raid" desc="Bei vielen schnellen Beitritten eingreifen" defaultChecked={settings.antiRaidEnabled} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field name="antiRaidJoinThreshold" label="Join-Schwelle" type="number" defaultValue={settings.antiRaidJoinThreshold} />
              <Field name="antiRaidJoinSeconds" label="Zeitfenster (s)" type="number" defaultValue={settings.antiRaidJoinSeconds} />
              <Field name="minAccountAgeMinutes" label="Min. Account-Alter (Min.)" type="number" defaultValue={settings.minAccountAgeMinutes} />
            </div>
            <ChannelSelect name="raidLogChannelId" label="Sicherheits-Log-Kanal" channels={textChannels} defaultValue={settings.raidLogChannelId} />
          </div>
        </div>

        {/* Rechte */}
        <div className={tab === 'permissions' ? 'card p-6' : 'hidden'}>
          <SectionTitle
            icon="🔑"
            title="Rechte"
            desc="Lege fest, welche Ränge welche Bereiche nutzen dürfen. Discord-eigene Rechte (z.B. Server verwalten) und Administratoren gelten zusätzlich immer."
          />
          <div className="grid gap-6">
            <div>
              <label className="label">🛡️ Moderation</label>
              <p className="mb-2 text-xs text-slate-500">Dürfen /ban, /kick, /timeout, /warn, /clear nutzen.</p>
              <RoleSelect name="perm_moderation" roles={roles} initial={perms.moderation ?? []} />
            </div>
            <div>
              <label className="label">⚙️ Konfiguration</label>
              <p className="mb-2 text-xs text-slate-500">
                Dürfen Bot-Einstellungen, AutoMod, Honeypot, Tickets &amp; Rollen konfigurieren — und das <b>Web-Dashboard bearbeiten</b>.
              </p>
              <RoleSelect name="perm_config" roles={roles} initial={perms.config ?? []} />
            </div>
            <div>
              <label className="label">✨ Embeds</label>
              <p className="mb-2 text-xs text-slate-500">Dürfen den Embed-Manager nutzen und Embeds senden.</p>
              <RoleSelect name="perm_embeds" roles={roles} initial={perms.embeds ?? []} />
            </div>
          </div>
        </div>

        {/* Speichern */}
        <div className="sticky bottom-4 mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-850/90 p-3 backdrop-blur">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? 'Speichern…' : 'Einstellungen speichern'}
          </button>
          {state.message && (
            <span className={`text-sm font-medium ${state.ok ? 'text-lumiya-300' : 'text-red-400'}`}>
              {state.message}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
