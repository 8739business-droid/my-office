// プラグインの定義ファイルの形を検査するテスト
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PLUGIN_NAME = 'my-office';
const SKILL_NAME = 'sho';
const PLUGIN_DIR = join(ROOT, 'plugins', PLUGIN_NAME);
const SKILL_DIR = join(PLUGIN_DIR, 'skills', SKILL_NAME);

const read = (path) => readFileSync(path, 'utf8');
const readJson = (path) => JSON.parse(read(path));

// 先頭の設定欄(frontmatter)から、トップレベルの項目名と値を取り出す簡易パーサー
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const data = {};
  let current = null;
  for (const line of match[1].split('\n')) {
    const key = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (key) {
      current = key[1];
      data[current] = key[2] === '>' || key[2] === '|' ? '' : key[2];
    } else if (current && line.startsWith('  ')) {
      data[current] = `${data[current]} ${line.trim()}`.trim();
    }
  }
  return data;
}

// ```markdown で始まるコードブロックの中身を見出しごとに取り出す
function markdownBlocksAfter(text, heading) {
  const start = text.indexOf(heading);
  if (start === -1) return null;
  const rest = text.slice(start);
  const block = rest.match(/```markdown\n([\s\S]*?)\n```/);
  return block ? block[1] : null;
}

describe('plugin.json', () => {
  const path = join(PLUGIN_DIR, '.claude-plugin', 'plugin.json');

  it('存在する', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('正しい JSON である', () => {
    expect(() => readJson(path)).not.toThrow();
  });

  it('name・description・version がある', () => {
    const json = readJson(path);
    for (const field of ['name', 'description', 'version']) {
      expect(typeof json[field], field).toBe('string');
      expect(json[field].length, field).toBeGreaterThan(0);
    }
  });

  it('name が my-office である', () => {
    expect(readJson(path).name).toBe(PLUGIN_NAME);
  });

  it('version が x.y.z の形である', () => {
    expect(readJson(path).version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('marketplace.json', () => {
  const path = join(ROOT, '.claude-plugin', 'marketplace.json');

  it('正しい JSON で、name・owner・plugins がある', () => {
    const json = readJson(path);
    expect(json.name).toBe('my-office-marketplace');
    expect(json.owner?.name).toBeTruthy();
    expect(Array.isArray(json.plugins)).toBe(true);
  });

  it('プラグインの項目がそろっている', () => {
    const entry = readJson(path).plugins.find((p) => p.name === PLUGIN_NAME);
    expect(entry).toBeTruthy();
    for (const field of ['source', 'description', 'author', 'repository', 'license', 'category', 'tags']) {
      expect(entry[field], field).toBeTruthy();
    }
    expect(Array.isArray(entry.tags)).toBe(true);
    expect(entry.license).toBe('MIT');
  });

  it('version は plugin.json だけに書く(validate の警告を避ける決定)', () => {
    const entry = readJson(path).plugins.find((p) => p.name === PLUGIN_NAME);
    expect(entry.version).toBeUndefined();
  });

  it('source がプラグインのフォルダを指している', () => {
    const entry = readJson(path).plugins.find((p) => p.name === PLUGIN_NAME);
    expect(resolve(ROOT, entry.source)).toBe(PLUGIN_DIR);
  });
});

describe('SKILL.md', () => {
  const path = join(SKILL_DIR, 'SKILL.md');
  const text = () => read(path);

  it('存在する', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('先頭に設定欄があり、name と description がある', () => {
    const fm = parseFrontmatter(text());
    expect(fm).not.toBeNull();
    expect(fm.name).toBe(SKILL_NAME);
    expect(fm.description.length).toBeGreaterThan(0);
  });

  it('設定欄には公式ドキュメントに載っている項目だけを使っている', () => {
    const allowed = [
      'name', 'description', 'when_to_use', 'argument-hint', 'arguments',
      'disable-model-invocation', 'user-invocable', 'allowed-tools', 'disallowed-tools',
      'model', 'effort', 'context', 'agent', 'background', 'hooks', 'paths', 'shell',
      'metadata', 'license', 'compatibility',
    ];
    for (const key of Object.keys(parseFrontmatter(text()))) {
      expect(allowed, key).toContain(key);
    }
  });

  it('description と when_to_use の合計が 1,536 文字以内', () => {
    const fm = parseFrontmatter(text());
    expect((fm.description + (fm.when_to_use ?? '')).length).toBeLessThanOrEqual(1536);
  });

  it.each([
    '## いつ使うか',
    '## 手順1: 検出とモード判定',
    '## 手順2: 初回セットアップ',
    '## 手順3: 秘書室の自動生成',
    '## 運営モード',
    '## 部署の追加',
    '## 外部サービス連携(MCP)の提案',
    '## 運用ルール',
  ])('主要な章がある: %s', (heading) => {
    expect(text()).toContain(heading);
  });

  it('2つの参照ファイルに言及している', () => {
    expect(text()).toContain('${CLAUDE_SKILL_DIR}/references/departments.md');
    expect(text()).toContain('${CLAUDE_SKILL_DIR}/references/claude-md-template.md');
  });

  it('組織フォルダ my-office/ と、コマンド /sho を使っている', () => {
    expect(text()).toContain('my-office/CLAUDE.md');
    expect(text()).toContain('/sho');
  });

  it('お手本の名前(.company、/company)が残っていない', () => {
    expect(text()).not.toMatch(/\.company|\/company\b/);
  });
});

describe('references/departments.md', () => {
  const path = join(SKILL_DIR, 'references', 'departments.md');
  const text = () => read(path);
  const departments = [
    ['秘書室', 'secretary'],
    ['PM', 'pm'],
    ['リサーチ', 'research'],
    ['マーケティング', 'marketing'],
    ['開発', 'engineering'],
    ['経理', 'finance'],
    ['営業', 'sales'],
    ['クリエイティブ', 'creative'],
    ['人事', 'hr'],
  ];

  it('存在する', () => {
    expect(existsSync(path)).toBe(true);
  });

  it.each(departments)('ファイルのひな形がある: %s', (name, folder) => {
    expect(text()).toMatch(new RegExp(`## \\d+\\. ${name}\\(${folder}\\)`));
    expect(text()).toContain(`### 部署トップ(${folder}/_template.md)`);
  });

  it.each(departments)('CLAUDE.md のひな形がある: %s', (name, folder) => {
    const block = markdownBlocksAfter(text(), `## ${folder}/CLAUDE.md`);
    expect(block, folder).not.toBeNull();
    const lines = block.split('\n');
    // 1行目が「# 部署名」
    expect(lines[0]).toMatch(/^# \S/);
    // 「## 役割」の次の行に役割の説明、「## 担当」の次の行に名前
    for (const heading of ['## 役割', '## 担当']) {
      const i = lines.indexOf(heading);
      expect(i, `${folder} ${heading}`).toBeGreaterThan(-1);
      expect(lines[i + 1]?.trim(), `${folder} ${heading}`).toBeTruthy();
    }
  });

  it('汎用のひな形(部署トップ・ファイル・CLAUDE.md)がある', () => {
    expect(text()).toContain('## 10. 汎用');
    expect(text()).toContain('## 汎用部署の CLAUDE.md');
    expect(markdownBlocksAfter(text(), '## 汎用部署の CLAUDE.md')).toContain('{{DEPARTMENT_NAME}}');
  });

  it('日付の書き方が {{YYYY-MM-DD}} に統一されている', () => {
    expect(text()).toContain('{{YYYY-MM-DD}}');
    const placeholders = [...text().matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]);
    const allowed = ['YYYY-MM-DD', 'DAY_OF_WEEK', 'HH:MM', 'STAFF_NAME', 'DEPARTMENT_NAME', 'DEPARTMENT_ROLE'];
    for (const p of placeholders) {
      expect(allowed, p).toContain(p);
    }
    // 設定欄の日付は必ず "{{YYYY-MM-DD}}"
    for (const m of text().matchAll(/^(date|created): (.*)$/gm)) {
      expect(m[2], m[0]).toBe('"{{YYYY-MM-DD}}"');
    }
  });

  it('日次 TODO の見出しが固定の書式どおり', () => {
    const block = markdownBlocksAfter(text(), '### 日次 TODO');
    for (const h of ['## 最優先', '## 通常', '## 余裕があれば', '## 完了', '## メモ・振り返り']) {
      expect(block).toContain(h);
    }
  });

  it('TODO と Inbox の行の書式が載っている', () => {
    expect(text()).toContain('- [ ] タスク内容 | 優先度: 高/通常/低 | 期限: YYYY-MM-DD');
    expect(text()).toContain('- [x] 完了タスク | 完了: YYYY-MM-DD');
    expect(text()).toContain('- **{{HH:MM}}** | 内容');
  });

  it('ひな形の status の値は英語', () => {
    const blocks = [...text().matchAll(/```markdown\n([\s\S]*?)\n```/g)].map((b) => b[1]).join('\n');
    expect(blocks).toMatch(/^status: /m);
    for (const m of blocks.matchAll(/^status: (.*)$/gm)) {
      expect(m[1], m[0]).toMatch(/^[a-z-]+$/);
    }
  });
});

describe('references/claude-md-template.md', () => {
  const path = join(SKILL_DIR, 'references', 'claude-md-template.md');
  const text = () => read(path);
  const template = () => text().match(/````markdown\n([\s\S]*?)\n````/)[1];
  const variableTable = () => text().slice(text().indexOf('## 変数の一覧'));
  const variables = [
    '{{BUSINESS_TYPE}}',
    '{{GOALS_AND_CHALLENGES}}',
    '{{CREATED_DATE}}',
    '{{ADDITIONAL_DEPARTMENTS}}',
    '{{DEPARTMENT_TABLE_ROWS}}',
    '{{PERSONALIZATION_NOTES}}',
  ];

  it('存在する', () => {
    expect(existsSync(path)).toBe(true);
  });

  it.each(variables)('変数がひな形と一覧表の両方にある: %s', (variable) => {
    expect(template()).toContain(variable);
    expect(variableTable()).toContain(variable);
  });

  it('オーナープロフィールの3行が決まった書式', () => {
    expect(template()).toContain('- **事業・活動**: {{BUSINESS_TYPE}}');
    expect(template()).toContain('- **目標・課題**: {{GOALS_AND_CHALLENGES}}');
    expect(template()).toContain('- **作成日**: {{CREATED_DATE}}');
  });

  it.each(['## オーナープロフィール', '## 組織構成', '## 部署一覧', '## 運営ルール', '## パーソナライズメモ'])(
    '章がある: %s',
    (heading) => {
      expect(template()).toContain(heading);
    },
  );

  it('部署を追加するときに表へ足す行が8部署分ある', () => {
    const section = text().slice(text().indexOf('## 部署を追加するときに表へ足す行'));
    for (const folder of ['pm', 'research', 'marketing', 'engineering', 'finance', 'sales', 'creative', 'hr']) {
      expect(section).toMatch(new RegExp(`\\| ${folder} \\|`));
    }
  });
});

describe('ファイル構成', () => {
  it.each([
    '.claude-plugin/marketplace.json',
    `plugins/${PLUGIN_NAME}/.claude-plugin/plugin.json`,
    `plugins/${PLUGIN_NAME}/skills/${SKILL_NAME}/SKILL.md`,
    `plugins/${PLUGIN_NAME}/skills/${SKILL_NAME}/references/departments.md`,
    `plugins/${PLUGIN_NAME}/skills/${SKILL_NAME}/references/claude-md-template.md`,
    'README.md',
    'LICENSE',
    '.gitignore',
    'CLAUDE.md',
  ])('必要なファイルがある: %s', (file) => {
    expect(existsSync(join(ROOT, file))).toBe(true);
  });

  it('スキルのフォルダ名と SKILL.md の name が一致している', () => {
    const fm = parseFrontmatter(read(join(SKILL_DIR, 'SKILL.md')));
    expect(fm.name).toBe(SKILL_NAME);
    expect(readdirSync(join(PLUGIN_DIR, 'skills'))).toEqual([SKILL_NAME]);
  });

  it('plugin.json と marketplace.json のプラグイン名が一致している', () => {
    const plugin = readJson(join(PLUGIN_DIR, '.claude-plugin', 'plugin.json'));
    const market = readJson(join(ROOT, '.claude-plugin', 'marketplace.json'));
    expect(market.plugins.map((p) => p.name)).toContain(plugin.name);
  });

  it('.gitignore に必要な項目がある', () => {
    const lines = read(join(ROOT, '.gitignore')).split('\n');
    for (const entry of ['.reference/', '.claude/', '/my-office/', 'node_modules/', 'docs/.vitepress/dist/']) {
      expect(lines, entry).toContain(entry);
    }
  });
});
