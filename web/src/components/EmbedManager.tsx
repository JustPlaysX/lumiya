'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import EmbedBuilder from '@/components/EmbedBuilder';
import type { EmbedConfig } from '@/lib/embed';
import type { GuildChannel } from '@/lib/discord';
import type { EmbedState } from '@/app/dashboard/[guildId]/embeds/actions';

export interface SavedEmbedRow {
  id: string;
  name: string;
  channelId: string | null;
  content: string | null;
  data: unknown;
  messageId: string | null;
}

type HandleAction = (prev: EmbedState, fd: FormData) => Promise<EmbedState>;
type DeleteAction = (fd: FormData) => Promise<void>;

function channelName(channels: GuildChannel[], id: string | null): string {
  if (!id) return 'kein Kanal';
  const c = channels.find((x) => x.id === id);
  return c ? `#${c.name}` : 'unbekannt';
}

function Editor({
  embed,
  channels,
  handleAction,
  deleteAction,
  onClose,
}: {
  embed: SavedEmbedRow | null;
  channels: GuildChannel[];
  handleAction: HandleAction;
  deleteAction: DeleteAction;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<EmbedState, FormData>(handleAction, { ok: false });
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.closed) onClose();
  }, [state, onClose]);

  const id = embed?.id ?? '';
  const initial = (embed?.data as EmbedConfig | undefined) ?? null;

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{embed ? 'Embed bearbeiten' : 'Neues Embed'}</h2>
        <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
          ← Zur Liste
        </button>
      </div>

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="id" value={id} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="label">Name (nur intern)</label>
            <input name="name" className="input" defaultValue={embed?.name ?? ''} placeholder="z.B. Regeln" />
          </div>
          <div className="sm:col-span-1">
            <label className="label">Zielkanal</label>
            <select name="channelId" className="input" defaultValue={embed?.channelId ?? ''}>
              <option value="">— kein Kanal —</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="label">Text über dem Embed</label>
            <input name="content" className="input" defaultValue={embed?.content ?? ''} placeholder="optional" />
          </div>
        </div>

        <EmbedBuilder name="embedJson" initial={initial} />

        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ink-850/90 p-3 backdrop-blur">
          <button type="submit" name="intent" value="save" disabled={pending || isDeleting} className="btn-primary">
            {pending ? 'Speichern…' : 'Speichern'}
          </button>
          <button
            type="submit"
            name="intent"
            value="send"
            disabled={pending || isDeleting}
            className="btn-ghost"
          >
            Speichern & senden
          </button>
          {id && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                if (!confirm('Dieses Embed wirklich löschen?')) return;
                const fd = new FormData();
                fd.set('id', id);
                startDelete(async () => {
                  await deleteAction(fd);
                  onClose();
                });
              }}
              className="ml-auto rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              {isDeleting ? 'Löschen…' : 'Löschen'}
            </button>
          )}
          {state.message && (
            <span className={`text-sm font-medium ${state.ok ? 'text-lumiya-300' : 'text-red-400'}`}>
              {state.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default function EmbedManager({
  embeds,
  channels,
  handleAction,
  deleteAction,
}: {
  embeds: SavedEmbedRow[];
  channels: GuildChannel[];
  handleAction: HandleAction;
  deleteAction: DeleteAction;
}) {
  // null = nichts ausgewählt; 'new' = neues Embed; sonst das gewählte Embed
  const [selected, setSelected] = useState<SavedEmbedRow | 'new' | null>(null);
  const selKey = selected === 'new' ? 'new' : (selected?.id ?? 'none');

  // Auswahl beim Neuladen aus dem URL-Anker wiederherstellen
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (h === 'new') setSelected('new');
    else if (h) {
      const e = embeds.find((x) => x.id === h);
      if (e) setSelected(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const select = (v: SavedEmbedRow | 'new' | null) => {
    setSelected(v);
    const h = v === 'new' ? 'new' : v ? v.id : '';
    if (h) window.history.replaceState(null, '', `#${h}`);
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Seitenleiste am Rand: Liste + Creator */}
      <aside className="lg:w-72 lg:shrink-0">
        <div className="card p-3 lg:sticky lg:top-20">
          <button
            type="button"
            onClick={() => select('new')}
            className={`mb-3 w-full text-sm ${selected === 'new' ? 'btn-primary' : 'btn-ghost'}`}
          >
            + Embed hinzufügen
          </button>
          <div className="grid max-h-[62vh] gap-1 overflow-y-auto">
            {embeds.length === 0 && (
              <p className="px-2 py-3 text-xs text-slate-500">Noch keine Embeds gespeichert.</p>
            )}
            {embeds.map((e) => {
              const active = selected !== 'new' && selected?.id === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => select(e)}
                  className={`nav-link text-left ${active ? 'nav-link-active' : ''}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-100">{e.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {channelName(channels, e.channelId)}
                      {e.messageId ? ' · gesendet' : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Detail: Editor oder Platzhalter */}
      <div className="min-w-0 flex-1">
        {selected ? (
          <Editor
            key={selKey}
            embed={selected === 'new' ? null : selected}
            channels={channels}
            handleAction={handleAction}
            deleteAction={deleteAction}
            onClose={() => select(null)}
          />
        ) : (
          <div className="card grid place-items-center p-12 text-center text-slate-400">
            <div>
              <div className="mb-3 text-4xl">✨</div>
              Wähle links ein Embed aus oder klicke auf{' '}
              <b className="text-slate-200">„+ Embed hinzufügen"</b>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
