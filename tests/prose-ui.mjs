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

const TEXT = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
]);

const hits = [];
for (const dir of DIRS) {
  for (const file of sources(path.join(ROOT, dir))) {
    const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (TEXT.has(node.kind)) {
        for (const c of checks) {
          for (const m of node.text.matchAll(c.re)) {
            const { line } = src.getLineAndCharacterOfPosition(node.getStart());
            const around = node.text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
            hits.push(`${path.relative(ROOT, file)}:${line + 1} [${c.id}] …${around}…\n    ${c.advice}`);
          }
        }
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
