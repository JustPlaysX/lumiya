'use client';

import { useState } from 'react';
import type { EmbedConfig, EmbedField } from '@/lib/embed';
import { EMPTY_EMBED } from '@/lib/embed';

function toArray(initial?: EmbedConfig[] | EmbedConfig | null): EmbedConfig[] {
  if (!initial) return [{ ...EMPTY_EMBED }];
  if (Array.isArray(initial)) return initial.length ? initial : [{ ...EMPTY_EMBED }];
  return [initial];
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Discord-ähnliche Live-Vorschau eines einzelnen Embeds. */
function Preview({ e }: { e: EmbedConfig }) {
  const color = e.color && /^#[0-9a-fA-F]{6}$/.test(e.color) ? e.color : '#22d3ee';
  const fields = (e.fields ?? []).filter((f) => f.name?.trim() && f.value?.trim());
  return (
    <div className="overflow-hidden rounded" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="rounded-r bg-[#232428] p-3">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            {e.author?.name && (
              <div className="mb-1 flex items-center gap-2">
                {e.author.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.author.iconUrl} alt="" className="h-6 w-6 rounded-full" />
                )}
                <span className="text-sm font-semibold text-white">{e.author.name}</span>
              </div>
            )}
            {e.title && (
              <div className="mb-1 font-semibold" style={{ color: e.url ? '#00a8fc' : '#fff' }}>
                {e.title}
              </div>
            )}
            {e.description && <div className="whitespace-pre-wrap text-sm text-[#dbdee1]">{e.description}</div>}
            {fields.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {fields.map((f, i) => (
                  <div key={i} className={f.inline ? 'col-span-1' : 'col-span-3'}>
                    <div className="text-xs font-semibold text-white">{f.name}</div>
                    <div className="whitespace-pre-wrap text-xs text-[#dbdee1]">{f.value}</div>
                  </div>
                ))}
              </div>
            )}
            {e.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.image} alt="" className="mt-3 max-h-52 rounded" />
            )}
            {(e.footer?.text || e.timestamp) && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#949ba4]">
                {e.footer?.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.footer.iconUrl} alt="" className="h-4 w-4 rounded-full" />
                )}
                <span>
                  {e.footer?.text}
                  {e.footer?.text && e.timestamp ? ' • ' : ''}
                  {e.timestamp ? 'heute' : ''}
                </span>
              </div>
            )}
          </div>
          {e.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.thumbnail} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}

/** Felder-Editor für ein einzelnes Embed. */
function SingleEmbedFields({ value: e, onChange }: { value: EmbedConfig; onChange: (patch: Partial<EmbedConfig>) => void }) {
  const setAuthor = (patch: Partial<NonNullable<EmbedConfig['author']>>) => onChange({ author: { ...e.author, ...patch } });
  const setFooter = (patch: Partial<NonNullable<EmbedConfig['footer']>>) => onChange({ footer: { ...e.footer, ...patch } });
  const fields = e.fields ?? [];
  const setField = (i: number, patch: Partial<EmbedField>) => onChange({ fields: fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  const addField = () => onChange({ fields: [...fields, { name: '', value: '', inline: false }] });
  const removeField = (i: number) => onChange({ fields: fields.filter((_, j) => j !== i) });
  const color = e.color && /^#[0-9a-fA-F]{6}$/.test(e.color) ? e.color : '#22d3ee';

  return (
    <div className="grid gap-4">
      <TextInput label="Titel" value={e.title ?? ''} maxLength={256} onChange={(v) => onChange({ title: v })} />
      <div>
        <label className="label">Beschreibung</label>
        <textarea
          className="input"
          rows={4}
          maxLength={4096}
          value={e.description ?? ''}
          placeholder="Unterstützt Platzhalter wie {user}, {server} …"
          onChange={(ev) => onChange({ description: ev.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Farbe</label>
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(ev) => onChange({ color: ev.target.value })} className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-black/30" />
            <input className="input" value={e.color ?? ''} onChange={(ev) => onChange({ color: ev.target.value })} placeholder="#22d3ee" />
          </div>
        </div>
        <TextInput label="Titel-Link (optional)" value={e.url ?? ''} onChange={(v) => onChange({ url: v })} placeholder="https://…" />
      </div>

      <details className="rounded-xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-300">Autor</summary>
        <div className="mt-3 grid gap-3">
          <TextInput label="Autor-Name" value={e.author?.name ?? ''} onChange={(v) => setAuthor({ name: v })} />
          <TextInput label="Autor-Icon-URL" value={e.author?.iconUrl ?? ''} onChange={(v) => setAuthor({ iconUrl: v })} placeholder="https://…" />
        </div>
      </details>

      <details className="rounded-xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-300">Bilder</summary>
        <div className="mt-3 grid gap-3">
          <TextInput label="Großes Bild (URL)" value={e.image ?? ''} onChange={(v) => onChange({ image: v })} placeholder="https://…" />
          <TextInput label="Thumbnail (URL)" value={e.thumbnail ?? ''} onChange={(v) => onChange({ thumbnail: v })} placeholder="https://…" />
        </div>
      </details>

      <details className="rounded-xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-300">Footer</summary>
        <div className="mt-3 grid gap-3">
          <TextInput label="Footer-Text" value={e.footer?.text ?? ''} onChange={(v) => setFooter({ text: v })} />
          <TextInput label="Footer-Icon-URL" value={e.footer?.iconUrl ?? ''} onChange={(v) => setFooter({ iconUrl: v })} placeholder="https://…" />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={!!e.timestamp} onChange={(ev) => onChange({ timestamp: ev.target.checked })} className="h-4 w-4 accent-lumiya-500" />
            Zeitstempel anzeigen
          </label>
        </div>
      </details>

      <details className="rounded-xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-300">Felder ({fields.length})</summary>
        <div className="mt-3 grid gap-3">
          {fields.map((f, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Feld {i + 1}</span>
                <button type="button" onClick={() => removeField(i)} className="text-xs text-red-400 hover:text-red-300">Entfernen</button>
              </div>
              <div className="grid gap-2">
                <input className="input" placeholder="Name" value={f.name} onChange={(ev) => setField(i, { name: ev.target.value })} />
                <textarea className="input" rows={2} placeholder="Wert" value={f.value} onChange={(ev) => setField(i, { value: ev.target.value })} />
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" checked={!!f.inline} onChange={(ev) => setField(i, { inline: ev.target.checked })} className="h-4 w-4 accent-lumiya-500" />
                  In einer Zeile (inline)
                </label>
              </div>
            </div>
          ))}
          {fields.length < 25 && (
            <button type="button" onClick={addField} className="btn-ghost text-sm">+ Feld hinzufügen</button>
          )}
        </div>
      </details>
    </div>
  );
}

/**
 * Baukasten für eine Nachricht mit einem oder mehreren Embeds (untereinander).
 * Alle Embeds werden als EINE Nachricht gesendet. Ausgabe als JSON-Array im Hidden-Feld.
 */
export default function EmbedBuilder({
  name,
  initial,
}: {
  name: string;
  initial?: EmbedConfig[] | EmbedConfig | null;
}) {
  const [embeds, setEmbeds] = useState<EmbedConfig[]>(() => toArray(initial));

  const update = (i: number, patch: Partial<EmbedConfig>) =>
    setEmbeds((es) => es.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => setEmbeds((es) => es.filter((_, j) => j !== i));
  const add = () => setEmbeds((es) => [...es, { ...EMPTY_EMBED }]);

  return (
    <div className="grid gap-4">
      <input type="hidden" name={name} value={JSON.stringify(embeds)} />

      {embeds.map((e, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-lumiya-200">Embed {i + 1}</span>
            {embeds.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-xs text-red-400 hover:text-red-300">
                Embed entfernen
              </button>
            )}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <SingleEmbedFields value={e} onChange={(patch) => update(i, patch)} />
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="mb-2 text-sm font-medium text-slate-400">Vorschau</div>
              <div className="rounded-lg bg-[#2b2d31] p-3">
                <Preview e={e} />
              </div>
            </div>
          </div>
        </div>
      ))}

      {embeds.length < 10 && (
        <button type="button" onClick={add} className="btn-ghost w-fit text-sm">
          + Weiteres Embed hinzufügen
        </button>
      )}
    </div>
  );
}
