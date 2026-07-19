'use client';

import { useActionState, useState } from 'react';
import type { GuildSettings } from '@prisma/client';
import type { GuildChannel, GuildRole } from '@/lib/discord';
import type { SaveState } from '@/app/dashboard/[guildId]/actions';

type Action = (prev: SaveState, fd: FormData) => Promise<SaveState>;

const TABS = [
  { key: 'welcome', label: '👋 Willkommen' },
  { key: 'leveling', label: '⭐ Leveling' },
  { key: 'moderation', label: '🛡️ Moderation' },
  { key: 'security', label: '🍯 Sicherheit' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded border-white/20 bg-black/40 accent-lumiya-500"
      />
      <span className="text-sm text-slate-200">{label}</span>
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
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue ?? ''} className="input">
        <option value="">— kein Kanal —</option>
        {channels.map((c) => (
          <option key={c.id} value={c.id}>
            # {c.name}
          </option>
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
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3">
        {options.length === 0 && <p className="text-xs text-slate-500">Keine verfügbar.</p>}
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={o.id}
              defaultChecked={selected.includes(o.id)}
              className="h-4 w-4 rounded border-white/20 bg-black/40 accent-lumiya-500"
            />
            <span className="text-slate-200">
              {prefix}
              {o.name}
            </span>
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
      <label className="label" htmlFor={name}>
        {label}
      </label>
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
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} defaultValue={defaultValue ?? ''} rows={2} className="input" />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function SettingsForm({
  action,
  settings,
  channels,
  roles,
}: {
  action: Action;
  settings: GuildSettings;
  channels: GuildChannel[];
  roles: GuildRole[];
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(action, { ok: false });
  const [tab, setTab] = useState<TabKey>('welcome');

  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
  const roleOptions = roles.map((r) => ({ id: r.id, name: r.name }));
  const channelOptions = textChannels.map((c) => ({ id: c.id, name: c.name }));

  return (
    <form action={formAction}>
      {/* Reiter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-lumiya-600 text-white'
                : 'border border-white/10 text-slate-300 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Willkommen */}
      <div className={tab === 'welcome' ? 'glass p-6' : 'hidden'}>
        <div className="grid gap-4">
          <Toggle name="welcomeEnabled" label="Willkommensnachricht aktiv" defaultChecked={settings.welcomeEnabled} />
          <ChannelSelect name="welcomeChannelId" label="Willkommens-Kanal" channels={textChannels} defaultValue={settings.welcomeChannelId} />
          <TextArea
            name="welcomeMessage"
            label="Willkommenstext"
            hint="Platzhalter: {user} {username} {server} {membercount}"
            defaultValue={settings.welcomeMessage}
          />
          <hr className="border-white/10" />
          <Toggle name="leaveEnabled" label="Abschiedsnachricht aktiv" defaultChecked={settings.leaveEnabled} />
          <ChannelSelect name="leaveChannelId" label="Abschieds-Kanal" channels={textChannels} defaultValue={settings.leaveChannelId} />
          <TextArea name="leaveMessage" label="Abschiedstext" defaultValue={settings.leaveMessage} />
          <hr className="border-white/10" />
          <CheckboxList
            name="autoRoleIds"
            label="Auto-Rollen (bei Beitritt)"
            hint="Diese Rollen bekommt jedes neue Mitglied automatisch."
            options={roleOptions}
            selected={settings.autoRoleIds}
            prefix="@"
          />
        </div>
      </div>

      {/* Leveling */}
      <div className={tab === 'leveling' ? 'glass p-6' : 'hidden'}>
        <div className="grid gap-4">
          <Toggle name="levelingEnabled" label="Leveling aktiv" defaultChecked={settings.levelingEnabled} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="xpPerMessageMin" label="XP min." type="number" defaultValue={settings.xpPerMessageMin} />
            <Field name="xpPerMessageMax" label="XP max." type="number" defaultValue={settings.xpPerMessageMax} />
            <Field name="xpCooldownSeconds" label="Cooldown (s)" type="number" defaultValue={settings.xpCooldownSeconds} />
          </div>
          <ChannelSelect
            name="levelUpChannelId"
            label="Level-Up-Kanal"
            hint="Leer = Nachricht im selben Kanal, in dem das Level erreicht wurde."
            channels={textChannels}
            defaultValue={settings.levelUpChannelId}
          />
          <TextArea name="levelUpMessage" label="Level-Up-Text" hint="Platzhalter: {user} {level}" defaultValue={settings.levelUpMessage} />
        </div>
      </div>

      {/* Moderation */}
      <div className={tab === 'moderation' ? 'glass p-6' : 'hidden'}>
        <div className="grid gap-4">
          <ChannelSelect name="modLogChannelId" label="Mod-Log-Kanal" channels={textChannels} defaultValue={settings.modLogChannelId} />
          <Toggle name="autoModEnabled" label="AutoMod aktiv" defaultChecked={settings.autoModEnabled} />
          <Toggle name="antiSpamEnabled" label="Anti-Spam aktiv" defaultChecked={settings.antiSpamEnabled} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="antiSpamMaxMsgs" label="Max. Nachrichten" type="number" defaultValue={settings.antiSpamMaxMsgs} />
            <Field name="antiSpamPerSeconds" label="im Zeitfenster (s)" type="number" defaultValue={settings.antiSpamPerSeconds} />
          </div>
          <TextArea
            name="bannedWords"
            label="Verbotene Wörter"
            hint="Mit Komma oder Zeilenumbruch trennen."
            defaultValue={settings.bannedWords.join(', ')}
          />
        </div>
      </div>

      {/* Sicherheit */}
      <div className={tab === 'security' ? 'glass p-6' : 'hidden'}>
        <div className="grid gap-4">
          <p className="text-sm text-slate-400">Automatischer Schutz gegen Raid- und Spam-Bots.</p>
          <Toggle name="honeypotEnabled" label="Honeypot aktiv" defaultChecked={settings.honeypotEnabled} />
          <div>
            <label className="label" htmlFor="honeypotAction">
              Aktion bei Treffer
            </label>
            <select id="honeypotAction" name="honeypotAction" defaultValue={settings.honeypotAction} className="input">
              <option value="ban">Bann</option>
              <option value="kick">Kick</option>
              <option value="timeout">Timeout (24h)</option>
            </select>
          </div>
          <CheckboxList
            name="honeypotChannelIds"
            label="Honeypot-Kanäle"
            hint="Kanäle, in denen kein echter Nutzer posten sollte. Wer hier schreibt, wird automatisch bestraft."
            options={channelOptions}
            selected={settings.honeypotChannelIds}
            prefix="# "
          />
          <hr className="border-white/10" />
          <Toggle name="antiRaidEnabled" label="Anti-Raid (Join-Rate) aktiv" defaultChecked={settings.antiRaidEnabled} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="antiRaidJoinThreshold" label="Join-Schwelle" type="number" defaultValue={settings.antiRaidJoinThreshold} />
            <Field name="antiRaidJoinSeconds" label="Zeitfenster (s)" type="number" defaultValue={settings.antiRaidJoinSeconds} />
            <Field name="minAccountAgeMinutes" label="Min. Account-Alter (Min., 0=aus)" type="number" defaultValue={settings.minAccountAgeMinutes} />
          </div>
          <ChannelSelect name="raidLogChannelId" label="Sicherheits-Log-Kanal" channels={textChannels} defaultValue={settings.raidLogChannelId} />
        </div>
      </div>

      {/* Speichern */}
      <div className="sticky bottom-4 mt-6 flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          {pending ? 'Speichern…' : 'Einstellungen speichern'}
        </button>
        {state.message && (
          <span className={state.ok ? 'text-green-400' : 'text-red-400'}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
