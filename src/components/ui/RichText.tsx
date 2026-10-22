import { Fragment, type ReactNode } from 'react';
import { cx } from '@/lib/format';

/**
 * O texto do agente: um subconjunto pequeno de Markdown — linha só com **título**, listas com "- " e "1. ",
 * **negrito** e links soltos (https://…), que viram clicáveis. Nada de HTML cru: tudo vira elemento React.
 */
const URL = /https?:\/\/[^\s<>"]+/g;

/** Tira a pontuação colada no fim do link; o parêntese só sai se estiver sobrando (o link do Ipeadata termina em ")"). */
function cleanUrl(u: string): string {
  for (;;) {
    if (/[.,;:]$/.test(u)) u = u.slice(0, -1);
    else if (u.endsWith(')') && u.split('(').length < u.split(')').length) u = u.slice(0, -1);
    else if (u.endsWith(']') && u.split('[').length < u.split(']').length) u = u.slice(0, -1);
    else return u;
  }
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(/(\*\*[^*]+\*\*)/g).forEach((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      out.push(<strong key={`b${i}`} className="font-medium text-texto">{part.slice(2, -2)}</strong>);
      return;
    }
    let last = 0;
    for (const m of part.matchAll(URL)) {
      const url = cleanUrl(m[0]);
      const at = m.index ?? 0;
      if (at > last) out.push(part.slice(last, at));
      out.push(
        <a key={`a${i}-${at}`} href={url} target="_blank" rel="noopener noreferrer" className="break-all text-raio underline decoration-raio/40 underline-offset-2 hover:decoration-raio">
          {url}
        </a>,
      );
      last = at + url.length;
    }
    if (last < part.length) out.push(part.slice(last));
  });
  return out;
}

type Block = { kind: 'h'; text: string } | { kind: 'p'; text: string } | { kind: 'ul'; items: string[] } | { kind: 'ol'; items: string[] };

function blocks(text: string): Block[] {
  const out: Block[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const prev = out[out.length - 1];
    if (!line) continue;
    if (/^\*\*[^*]+\*\*$/.test(line)) out.push({ kind: 'h', text: line.slice(2, -2) });
    else if (line.startsWith('- ')) {
      if (prev?.kind === 'ul') prev.items.push(line.slice(2));
      else out.push({ kind: 'ul', items: [line.slice(2)] });
    } else if (/^\d+\.\s/.test(line)) {
      const item = line.replace(/^\d+\.\s+/, '');
      if (prev?.kind === 'ol') prev.items.push(item);
      else out.push({ kind: 'ol', items: [item] });
    } else out.push({ kind: 'p', text: line });
  }
  return out;
}

export function RichText({ text, className, children }: { text: string; className?: string; children?: ReactNode }) {
  const bs = blocks(text);
  if (!bs.length) return <div className={className}>{children}</div>;
  return (
    <div className={cx('flex flex-col gap-3 leading-relaxed text-texto', className)}>
      {bs.map((b, i) => {
        const tail = i === bs.length - 1 ? children : null;
        if (b.kind === 'h')
          return (
            <h4 key={i} className="label mt-2 text-nevoa">
              {inline(b.text)}
              {tail}
            </h4>
          );
        if (b.kind === 'p')
          return (
            <p key={i}>
              {inline(b.text)}
              {tail}
            </p>
          );
        const List = b.kind === 'ul' ? 'ul' : 'ol';
        return (
          <List key={i} className={cx('flex flex-col gap-2 pl-5', b.kind === 'ul' ? 'list-disc' : 'list-decimal', 'marker:text-meta')}>
            {b.items.map((it, k) => (
              <li key={k}>
                {inline(it)}
                {k === b.items.length - 1 && <Fragment>{tail}</Fragment>}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
