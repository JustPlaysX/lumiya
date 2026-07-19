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
  // null = Liste; sonst das bearbeitete Embed (oder ein leeres neues)
  const [editing, setEditing] = useState<SavedEmbedRow | 'new' | null>(null);

  if (editing) {
    return (
      <Editor
        embed={editing === 'new' ? null : editing}
        channels={channels}
        handleAction={handleAction}
        deleteAction={deleteAction}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {embeds.length} gespeicherte{embeds.length === 1 ? 's' : ''} Embed{embeds.length === 1 ? '' : 's'}
        </p>
        <button type="button" onClick={() => setEditing('new')} className="btn-primary text-sm">
          + Embed hinzufügen
        </button>
      </div>

      {embeds.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">
          Noch keine Embeds. Klick auf <b>„+ Embed hinzufügen"</b>, um dein erstes zu erstellen.
        </div>
      ) : (
        <div className="grid gap-3">
          {embeds.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEditing(e)}
              className="card flex items-center justify-between gap-4 p-4 text-left transition hover:border-lumiya-400/40"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-white">{e.name}</div>
                <div className="text-xs text-slate-400">
                  {channelName(channels, e.channelId)}
                  {e.messageId ? ' · bereits gesendet' : ''}
                </div>
              </div>
              <span className="shrink-0 text-sm text-lumiya-300">Bearbeiten →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
