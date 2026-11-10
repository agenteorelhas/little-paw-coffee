const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));

test('index.html existe', () => {
  assert.ok(fs.existsSync(path.join(root, 'index.html')));
});

test('index.html tem um <title> não vazio', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  assert.ok(m, 'tag <title> não encontrada');
  assert.ok(m[1].trim().length > 0, '<title> está vazio');
});

for (const page of pages) {
  test(`${page}: arquivos CSS/JS referenciados existem`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const refs = [
      ...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/gi),
      ...html.matchAll(/<script[^>]+src="([^"]+)"/gi),
    ].map((m) => m[1]).filter((r) => !/^(https?:)?\/\//.test(r));
    assert.ok(refs.length > 0, 'nenhum CSS/JS referenciado');
    for (const ref of refs) {
      assert.ok(fs.existsSync(path.join(root, ref.split(/[?#]/)[0])), `arquivo ausente: ${ref}`);
    }
  });
}
