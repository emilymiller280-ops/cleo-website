// Convert a .docx legal document (Terms of Service, Privacy Policy) into the
// body HTML for a Cleo legal page. Re-run this whenever counsel sends a new
// version — it is the only step between their .docx and the live page.
//
//   node docx-to-legal-html.mjs <input.docx> > body.html
//
// Word stores these documents as direct formatting rather than semantic styles,
// so headings are detected by shape: short paragraphs that are fully bold or
// fully uppercase. Long ALL-CAPS disclaimers stay paragraphs (they are body
// text that happens to be shouted, and they matter legally).
import { execFileSync } from 'node:child_process';

export function convertDocx(file) {

const xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const relsXml = (() => {
  try { return execFileSync('unzip', ['-p', file, 'word/_rels/document.xml.rels'], { maxBuffer: 8 * 1024 * 1024 }).toString(); }
  catch { return ''; }
})();

// rId -> external URL, for <w:hyperlink r:id="...">
const rels = new Map();
for (const m of relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>/g)) {
  if (/hyperlink/i.test(m[0])) rels.set(m[1], m[2]);
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// One <w:r> -> { text, bold, italic, underline }
function parseRun(runXml) {
  const props = (runXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) || [, ''])[1];
  const on = tag => {
    const m = props.match(new RegExp(`<w:${tag}(\\s[^>]*)?/>|<w:${tag}(\\s[^>]*)?>`));
    if (!m) return false;
    return !/w:val="(0|false|none)"/.test(m[0]);
  };
  let text = '';
  for (const t of runXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)) text += unesc(t[1]);
  if (/<w:tab\/>/.test(runXml)) text += ' ';
  if (/<w:br\/>/.test(runXml)) text += ' ';
  return { text, bold: on('b'), italic: on('i'), underline: on('u') };
}

// One <w:p> -> { html, plain, allBold, style }
function parseParagraph(pXml) {
  const style = (pXml.match(/<w:pStyle\s+w:val="([^"]+)"/) || [, ''])[1];
  const chunks = [];

  // Walk hyperlinks and bare runs in document order.
  const parts = pXml.split(/(<w:hyperlink[\s\S]*?<\/w:hyperlink>)/);
  for (const part of parts) {
    if (part.startsWith('<w:hyperlink')) {
      const id = (part.match(/r:id="([^"]+)"/) || [, ''])[1];
      const href = rels.get(id);
      let text = '';
      for (const r of part.matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)) text += parseRun(r[1]).text;
      if (!text.trim()) continue;
      chunks.push(href
        ? { text, html: `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`, bold: false }
        : { text, html: esc(text), bold: false });
    } else {
      for (const r of part.matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)) {
        const run = parseRun(r[1]);
        if (!run.text) continue;
        let html = esc(run.text);
        if (run.bold) html = `<strong>${html}</strong>`;
        if (run.italic) html = `<em>${html}</em>`;
        if (run.underline) html = `<u>${html}</u>`;
        chunks.push({ text: run.text, html, bold: run.bold });
      }
    }
  }

  const plain = chunks.map(c => c.text).join('').trim();
  const visible = chunks.filter(c => c.text.trim());
  const allBold = visible.length > 0 && visible.every(c => c.bold);
  return { html: chunks.map(c => c.html).join(''), plain, allBold, style };
}

// Body text is everything between <w:body> and the final sectPr.
const body = (xml.match(/<w:body>([\s\S]*)<\/w:body>/) || [, xml])[1];

const out = [];
let listOpen = false;
const closeList = () => { if (listOpen) { out.push('</ul>'); listOpen = false; } };

// Paragraphs and tables, in document order.
for (const node of body.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>|<w:tbl>[\s\S]*?<\/w:tbl>/g)) {
  const chunk = node[0];

  if (chunk.startsWith('<w:tbl')) {
    closeList();
    const rows = [];
    for (const tr of chunk.matchAll(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g)) {
      const cells = [];
      for (const tc of tr[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)) {
        const cellParas = [...tc[0].matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)]
          .map(p => parseParagraph(p[0]).html).filter(Boolean);
        cells.push(cellParas.join('<br>'));
      }
      if (cells.some(c => c.trim())) rows.push(cells);
    }
    if (rows.length) {
      out.push('<div class="legal-table-wrap"><table class="legal-table">');
      rows.forEach((cells, i) => {
        const tag = i === 0 ? 'th' : 'td';
        out.push('<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>');
      });
      out.push('</table></div>');
    }
    continue;
  }

  const { html, plain, allBold, style } = parseParagraph(chunk);
  if (!plain) continue;

  const isListItem = /<w:numPr>/.test(chunk) || /ListParagraph/i.test(style);
  const upper = plain === plain.toUpperCase() && /[A-Z]/.test(plain);
  const isHeading = /NGLTitle|Title|Heading/i.test(style)
    || (!isListItem && plain.length <= 120 && (allBold || upper));

  if (isHeading) {
    closeList();
    const level = /NGLTitle|Title/i.test(style) ? 2 : 3;
    // Word underlines its own headings. We re-typeset headings anyway (size,
    // weight, colour), so the underline is redundant clutter — drop it here
    // only. Underlines inside body text are left alone, where they may carry
    // meaning.
    out.push(`<h${level} class="legal-h${level}">${html.replace(/<\/?u>/g, '')}</h${level}>`);
    continue;
  }

  if (isListItem) {
    if (!listOpen) { out.push('<ul class="legal-list">'); listOpen = true; }
    out.push(`<li>${html}</li>`);
    continue;
  }

  closeList();
  out.push(`<p class="legal-p">${html}</p>`);
}
closeList();

// The "Last Updated" line is lifted into the page header rather than the body.
let lastUpdated = '';
const filtered = out.filter(line => {
  if (!/^<h[23]/.test(line)) return true;
  // Word splits a date across several runs, so match against the tag-stripped text.
  const text = line.replace(/<[^>]*>/g, '').trim();
  const m = text.match(/^Last Updated:\s*(.+)$/i);
  if (m) { lastUpdated = m[1].trim(); return false; }
  return true;
});

return { html: filtered.join('\n'), lastUpdated };
}

// CLI: print the body HTML for one document.
if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node docx-to-legal-html.mjs <input.docx>'); process.exit(1); }
  console.log(convertDocx(file).html);
}
