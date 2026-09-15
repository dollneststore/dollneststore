import Link from "next/link";
import type { ReactNode } from "react";

// A small, safe Markdown subset for guides and collection intros:
// ## / ### headings, paragraphs, - lists, 1. lists, > quotes, **bold**, *italic*, [links](/path).
// Output is React elements only (never raw HTML), so admin content can't inject markup or scripts.

function safeHref(href: string) {
  // Relative links must not start with "//" or "/\" (browsers treat both as another host).
  return /^(https:\/\/|\/(?![/\\])|mailto:)/.test(href) ? href : null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      nodes.push(<strong key={key}>{match[1]}</strong>);
    } else if (match[2]) {
      nodes.push(<em key={key}>{match[2]}</em>);
    } else {
      const href = safeHref(match[4]);
      if (!href) nodes.push(match[3]);
      else if (href.startsWith("/")) nodes.push(<Link key={key} href={href}>{match[3]}</Link>);
      else nodes.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer">{match[3]}</a>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const state: { paragraph: string[]; list: { ordered: boolean; items: string[] } | null } = { paragraph: [], list: null };

  const flushParagraph = () => {
    if (!state.paragraph.length) return;
    const key = `p${blocks.length}`;
    blocks.push(<p key={key}>{renderInline(state.paragraph.join(" "), key)}</p>);
    state.paragraph = [];
  };
  const flushList = () => {
    if (!state.list) return;
    const key = `l${blocks.length}`;
    const items = state.list.items.map((item, i) => <li key={i}>{renderInline(item, `${key}-${i}`)}</li>);
    blocks.push(state.list.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>);
    state.list = null;
  };

  for (const rawLine of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^(#{2,3})\s+(.+)/);
    const bullet = line.match(/^[-*]\s+(.+)/);
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    const quote = line.match(/^>\s?(.+)/);

    if (!line) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const key = `h${blocks.length}`;
      blocks.push(
        heading[1] === "##" ? <h2 key={key}>{renderInline(heading[2], key)}</h2> : <h3 key={key}>{renderInline(heading[2], key)}</h3>,
      );
    } else if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (state.list && state.list.ordered !== ordered) flushList();
      if (!state.list) state.list = { ordered, items: [] };
      state.list.items.push((bullet ?? numbered)![1]);
    } else if (quote) {
      flushParagraph();
      flushList();
      const key = `q${blocks.length}`;
      blocks.push(<blockquote key={key}>{renderInline(quote[1], key)}</blockquote>);
    } else {
      flushList();
      state.paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return <div className={`legal-prose ${className}`}>{blocks}</div>;
}
