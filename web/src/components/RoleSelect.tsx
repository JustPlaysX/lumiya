'use client';

import { useMemo, useState } from 'react';
import type { GuildRole } from '@/lib/discord';

function roleHex(color: number): string {
  if (!color) return '#99aab5';
  return '#' + color.toString(16).padStart(6, '0');
}

/**
 * Mehrfach-Rollenauswahl mit farbigen Chips + Suche.
 * Gibt die gewählten Rollen-IDs als mehrere Hidden-Felder (gleicher name) aus.
 */
export default function RoleSelect({
  name,
  roles,
  initial,
  placeholder = 'Rolle hinzufügen…',
}: {
  name: string;
  roles: GuildRole[];
  initial: string[];
  placeholder?: string;
}) {
  const [selected, setSelected] = useState<string[]>(initial.filter((id) => roles.some((r) => r.id === id)));
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const byId = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const available = roles.filter(
    (r) => !selected.includes(r.id) && r.name.toLowerCase().includes(query.toLowerCase()),
  );

  const add = (id: string) => {
    setSelected((s) => [...s, id]);
    setQuery('');
    setOpen(false);
  };
  const remove = (id: string) => setSelected((s) => s.filter((x) => x !== id));

  return (
    <div className="relative">
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
        {selected.map((id) => {
          const r = byId.get(id);
          if (!r) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-2 pr-1 text-sm"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: roleHex(r.color) }} />
              <span className="text-slate-100">{r.name}</span>
              <button
                type="button"
                onClick={() => remove(id)}
                className="grid h-4 w-4 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Entfernen"
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={selected.length ? '' : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-slate-100 outline-none"
        />
      </div>

      {open && available.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-white/10 bg-ink-800 p-1 shadow-xl">
          {available.slice(0, 50).map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(r.id);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-white/5"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: roleHex(r.color) }} />
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
