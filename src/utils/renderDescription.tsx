import React from 'react';

/**
 * Outlook writes a hyperlink into plain text as the words followed by the
 * address in angle brackets:
 *
 *   Make sure you arrive early to catch the live band's
 *   pre-show<https://www.churchofjesuschrist.org/...> as well.
 *
 * Left alone, the address lands in the middle of a sentence. This turns it back
 * into the link it was meant to be.
 */
const OUTLOOK_LINK = /([^\s<]+)<(https?:\/\/[^>]+)>/g;

/** A bare address with no words attached to it. */
const BARE_URL = /(https?:\/\/[^\s<>()]+)/g;

/**
 * Split one line into text and links.
 */
function renderLine(line: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let i = 0;

  OUTLOOK_LINK.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = OUTLOOK_LINK.exec(line))) {
    const [whole, label, href] = match;
    if (match.index > cursor) {
      nodes.push(...renderBareUrls(line.slice(cursor, match.index), `${keyPrefix}-t${i}`));
    }
    nodes.push(
      <a
        key={`${keyPrefix}-a${i}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </a>
    );
    cursor = match.index + whole.length;
    i++;
  }

  if (cursor < line.length) {
    nodes.push(...renderBareUrls(line.slice(cursor), `${keyPrefix}-t${i}`));
  }
  return nodes;
}

function renderBareUrls(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let i = 0;

  BARE_URL.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BARE_URL.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(
      <a
        key={`${keyPrefix}-u${i}`}
        href={match[1]}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {match[1]}
      </a>
    );
    cursor = match.index + match[1].length;
    i++;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/**
 * Render a calendar description as paragraphs, with its links made clickable.
 *
 * Blank lines in the calendar are real paragraph breaks -- the Pageant's
 * description has several -- so they are kept rather than collapsed into one
 * long run of text.
 */
export function renderDescription(description: string): React.ReactNode {
  const paragraphs = description
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => (
    <p key={`p${index}`} className="event-description-paragraph">
      {paragraph.split('\n').flatMap((line, lineIndex, lines) => {
        const rendered = renderLine(line, `p${index}l${lineIndex}`);
        return lineIndex < lines.length - 1
          ? [...rendered, <br key={`p${index}l${lineIndex}br`} />]
          : rendered;
      })}
    </p>
  ));
}

/**
 * A short plain-text preview for the collapsed card. Links are reduced to their
 * words so no address ever appears in the summary line.
 */
export function previewDescription(description: string, limit = 160): string {
  const flat = description
    .replace(/([^\s<]+)<https?:\/\/[^>]+>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > limit ? `${flat.slice(0, limit).trimEnd()}…` : flat;
}
