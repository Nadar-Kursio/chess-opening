// The UI half of the prose check (test_prose.py covers the course text): every string literal and
// piece of JSX text in web/ and trainer/src/ against the rules in prose.json. Comments are code,
// not copy, and aren't checked. Needs web's node_modules for the TypeScript parser.
//
// Run from the repo root:  node tests/prose-ui.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const ts = createRequire(path.join(ROOT, 'web', 'package.json'))('typescript');
const { rules } = JSON.parse(readFileSync(path.join(import.meta.dirname, 'prose.json'), 'utf8'));
const checks = rules.map((r) => ({ ...r, re: new RegExp(r.pattern, 'giu') }));
const DIRS = ['web/app', 'web/components', 'web/lib', 'trainer/src'];

function* sources(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* sources(p);
    else if (/\.tsx?$/.test(e.name)) yield p;
  }
}

// Text built from parts (a template literal, or a JSX element's children) is checked whole, with
// each interpolated part standing in as a word, so `${a} — ${b}` is caught like 'a — b'. A piece
// that starts or ends with a space is joined to words there, so ' — ' counts too, and a bare '—'
// placeholder doesn't.
const PART = 'x';
const joined = (text) => (/^\s/.test(text) ? PART : '') + text + (/\s$/.test(text) ? PART : '');
const { SyntaxKind: K } = ts;

const hits = [];
for (const dir of DIRS) {
  for (const file of sources(path.join(ROOT, dir))) {
    const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const check = (node, piece) => {
      const text = joined(piece);
      for (const c of checks) {
        for (const m of text.matchAll(c.re)) {
          const { line } = src.getLineAndCharacterOfPosition(node.getStart());
          const around = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
          hits.push(`${path.relative(ROOT, file)}:${line + 1} [${c.id}] …${around}…\n    ${c.advice}`);
        }
      }
    };
    const visit = (node) => {
      switch (node.kind) {
        case K.StringLiteral:
        case K.NoSubstitutionTemplateLiteral:
          return check(node, node.text);
        case K.TemplateExpression:
          check(node, node.head.text + node.templateSpans.map((s) => PART + s.literal.text).join(''));
          return node.templateSpans.forEach((s) => visit(s.expression));
        case K.JsxElement:
        case K.JsxFragment:
          check(node, node.children.map((c) => (c.kind === K.JsxText ? c.text : PART)).join(''));
          if (node.kind === K.JsxElement) visit(node.openingElement);
          return node.children.forEach((c) => c.kind !== K.JsxText && visit(c));
      }
      ts.forEachChild(node, visit);
    };
    visit(src);
  }
}

if (hits.length) {
  console.error(`${hits.length} phrase(s) that read as machine-written:\n${hits.join('\n')}`);
  process.exit(1);
}
console.log('UI copy reads naturally.');
