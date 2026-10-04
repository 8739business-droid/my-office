#!/usr/bin/env node
// my-office-dashboard のコマンド。組織フォルダ(my-office/)を探して、ダッシュボードを起動する。

import fs from "node:fs";
import path from "node:path";
import { findOrgDir } from "../server/scanner.js";
import { startServer } from "../server/server.js";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
const DEFAULT_PORT = 8739;

const HELP = `
  my-office-dashboard ${pkg.version}
  my-office の組織フォルダを、ブラウザで見える化します(読み取り専用)。

  使い方:
    npx my-office-dashboard [オプション]

  オプション:
    -p, --port <番号>   待ち受けるポート(既定: ${DEFAULT_PORT})
    -d, --dir <パス>    my-office/ を探し始める場所(既定: カレントディレクトリ)
                        ここから親へ向かって、my-office/CLAUDE.md を持つフォルダを探します
    --no-open           ブラウザを自動で開かない
    -h, --help          このヘルプを表示
    -v, --version       バージョンを表示
`;

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/** 引数を読む(--port=8000 の形にも対応) */
function parseArgs(argv) {
  const opts = { port: DEFAULT_PORT, dir: process.cwd(), open: true, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i];
    let inline = null;
    const eq = a.indexOf("=");
    if (a.startsWith("--") && eq !== -1) {
      inline = a.slice(eq + 1);
      a = a.slice(0, eq);
    }
    const value = () => {
      if (inline != null) return inline;
      const v = argv[++i];
      if (v == null || v.startsWith("-")) fail(`${a} には値が必要です。`);
      return v;
    };
    switch (a) {
      case "-p":
      case "--port": {
        const v = value();
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 65535) fail(`ポート番号が正しくありません: ${v}`);
        opts.port = n;
        break;
      }
      case "-d":
      case "--dir":
        opts.dir = value();
        break;
      case "--no-open":
        opts.open = false;
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      case "-v":
      case "--version":
        opts.version = true;
        break;
      default:
        fail(`知らないオプションです: ${argv[i]}\n  -h でヘルプを表示できます。`);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));

if (opts.help) {
  console.log(HELP);
  process.exit(0);
}
if (opts.version) {
  console.log(pkg.version);
  process.exit(0);
}

const startDir = path.resolve(opts.dir);
const orgDir = findOrgDir(startDir);
if (!orgDir) {
  console.error("\n  my-office/ フォルダが見つかりません。Claude Code で /sho を実行して、初回セットアップをしてください。");
  console.error(`  (探し始めた場所: ${startDir})\n`);
  process.exit(1);
}

let running;
try {
  running = await startServer(orgDir, opts.port);
} catch (err) {
  if (err?.code === "EADDRINUSE") {
    fail(`ポート ${opts.port} はほかのプログラムが使っています。-p で別の番号を指定してください。`);
  }
  fail(`起動できませんでした: ${err?.message || err}`);
}

console.log(`\n  my-office ダッシュボード`);
console.log(`  組織フォルダ: ${orgDir}`);
console.log(`  URL:          ${running.url}`);
console.log(`  止めるときは Ctrl+C\n`);

if (opts.open) {
  import("open")
    .then((mod) => mod.default(running.url))
    .catch(() => console.log("  ブラウザを開けませんでした。上の URL を開いてください。\n"));
}

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  console.log("\n  ダッシュボードを止めます。");
  await running.close().catch(() => {});
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
