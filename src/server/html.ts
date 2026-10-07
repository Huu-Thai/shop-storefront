import 'server-only';
import sanitizeHtml from 'sanitize-html';

/**
 * Product and category descriptions are written in Shop Admin's editor but not sanitised by the
 * shop, so they are cleaned here — on the server, inside cached rendering — with a strict
 * allow-list: text formatting, lists, links, images and tables. No scripts, styles, iframes or event
 * handlers; links to other sites open safely.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'ins',
    'sup',
    'sub',
    'small',
    'mark',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'figure',
    'figcaption',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'caption',
    'code',
    'pre',
    'span',
  ],
  allowedAttributes: {
    // rel / target / loading are only ever set by transformTags below.
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    ol: ['start'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  // Headings inside a description sit below the page's h1 and the section's h2.
  transformTags: {
    h1: 'h2',
    a: (tag, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? '');
      return {
        tagName: 'a',
        attribs: external ? { ...attribs, rel: 'noopener nofollow', target: '_blank' } : attribs,
      };
    },
    img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } }),
  },
  allowedSchemesByTag: { img: ['https', 'http', 'data'] },
};

export function cleanHtml(html: string | null | undefined): string {
  return html ? sanitizeHtml(html, OPTIONS).trim() : '';
}

/** Plain text (metadata descriptions, JSON-LD), collapsed to one line and clipped. */
export function plainText(html: string | null | undefined, max = 300): string {
  // Block boundaries become spaces so "<p>a</p><p>b</p>" reads "a b".
  const spaced = (html ?? '').replace(
    /<\/(p|li|h[1-6]|div|tr|td|th|blockquote)>|<br\s*\/?>/gi,
    ' ',
  );
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Video players the shop allows in content (and the CSP's frame-src allows). */
export const EMBED_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'];

/**
 * CMS pages, posts and blocks. The shop already sanitises them when saved; this is defence in
 * depth with the same allowances: figures, tables, and video embeds from the hosts above.
 */
const CONTENT: sanitizeHtml.IOptions = {
  ...OPTIONS,
  allowedTags: [
    ...(OPTIONS.allowedTags as string[]),
    'h5',
    'h6',
    'picture',
    'source',
    'video',
    'iframe',
    'section',
    'article',
    'div',
  ],
  allowedAttributes: {
    ...OPTIONS.allowedAttributes,
    img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading'],
    source: ['src', 'srcset', 'type', 'media', 'sizes'],
    video: ['src', 'poster', 'controls', 'muted', 'loop', 'playsinline', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'loading', 'title'],
  },
  allowedIframeHostnames: EMBED_HOSTS,
  transformTags: {
    ...OPTIONS.transformTags,
    // Content may have its own h1 (the page title is the h1): keep the outline sane.
    h1: 'h2',
    iframe: (tag, attribs) => ({ tagName: 'iframe', attribs: { ...attribs, loading: 'lazy' } }),
  },
};

export function cleanContent(html: string | null | undefined): string {
  return html ? sanitizeHtml(html, CONTENT).trim() : '';
}
