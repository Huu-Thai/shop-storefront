import { describe, expect, it } from 'vitest';
import { cleanContent, cleanHtml, plainText } from './html';

describe('description HTML', () => {
  it('keeps formatting and drops anything executable', () => {
    const out = cleanHtml(
      '<h1>Fit</h1><p onclick="x()">Soft <strong>cotton</strong><script>alert(1)</script></p>' +
        '<img src="https://cdn/x.jpg" onerror="x()"><iframe src="https://evil"></iframe>' +
        '<a href="javascript:alert(1)">bad</a><p style="color:red">styled</p>',
    );
    expect(out).toContain('<h2>Fit</h2>');
    expect(out).toContain('<strong>cotton</strong>');
    expect(out).toContain('<img src="https://cdn/x.jpg" loading="lazy" />');
    expect(out).not.toMatch(/script|onclick|onerror|iframe|javascript:|style=/);
  });

  it('opens links to other sites safely', () => {
    expect(cleanHtml('<a href="https://other.example">x</a>')).toBe(
      '<a href="https://other.example" rel="noopener nofollow" target="_blank">x</a>',
    );
    expect(cleanHtml('<a href="/men">men</a>')).toBe('<a href="/men">men</a>');
  });

  it('makes one-line plain text for metadata', () => {
    expect(plainText('<p>Soft\n\n <b>cotton</b></p><p>tee</p>')).toBe('Soft cotton tee');
    expect(plainText('a'.repeat(400), 10)).toHaveLength(10);
    expect(plainText(null)).toBe('');
  });

  it('keeps video embeds from known players only in content', () => {
    const out = cleanContent(
      '<iframe src="https://www.youtube-nocookie.com/embed/x"></iframe><iframe src="https://evil.example/x"></iframe><h1>Big</h1>',
    );
    expect(out).toContain('youtube-nocookie.com/embed/x');
    expect(out).not.toContain('evil.example');
    expect(out).toContain('<h2>Big</h2>');
  });
});
