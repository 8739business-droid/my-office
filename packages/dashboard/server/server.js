// ダッシュボードの HTTP サーバー(Express)。127.0.0.1 だけで待ち受ける。
// 組織フォルダは読み取るだけで、書き込みはしない。

import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildActivity,
  buildDepartmentDetail,
  buildOverview,
  buildTree,
  collectFiles,
  findAsset,
  readOrgFile,
  searchFiles,
} from "./scanner.js";
import { watchOrgDir } from "./watcher.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DIST_DIR = path.join(here, "..", "dist");

/**
 * Express アプリを作る(テストからも使えるよう、listen はしない)。
 * @param {string} orgDir 組織フォルダの絶対パス
 * @param {{ watch?: boolean, distDir?: string }} options
 */
export function createApp(orgDir, options = {}) {
  const { watch = true, distDir = DIST_DIR } = options;
  const app = express();
  app.disable("x-powered-by");
  const clients = new Set();

  // 読み取り専用なので GET / HEAD 以外は受け付けない
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).json({ error: "読み取り専用です" });
      return;
    }
    next();
  });

  const wrap = (fn) => (req, res) => {
    try {
      fn(req, res);
    } catch (err) {
      res.status(500).json({ error: "読み取りに失敗しました", detail: String(err?.message || err) });
    }
  };

  app.get("/api/overview", wrap((req, res) => res.json(buildOverview(orgDir, new Date()))));

  app.get(
    "/api/file",
    wrap((req, res) => {
      const rel = typeof req.query.path === "string" ? req.query.path : "";
      const result = readOrgFile(orgDir, rel);
      if (result.error === "forbidden") return res.status(403).json({ error: "組織フォルダの外は読めません" });
      if (result.error) return res.status(404).json({ error: "ファイルが見つかりません" });
      res.json(result);
    }),
  );

  app.get(
    "/api/department/:id",
    wrap((req, res) => {
      const detail = buildDepartmentDetail(orgDir, req.params.id, new Date());
      if (!detail) return res.status(404).json({ error: "部署が見つかりません" });
      res.json(detail);
    }),
  );

  app.get(
    "/api/search",
    wrap((req, res) => {
      const q = typeof req.query.q === "string" ? req.query.q : "";
      res.json({ query: q, results: searchFiles(orgDir, q, 30) });
    }),
  );

  app.get("/api/tree", wrap((req, res) => res.json(buildTree(orgDir))));

  app.get(
    "/api/activity",
    wrap((req, res) => {
      const files = collectFiles(orgDir).filter((f) => f.counted);
      res.json(buildActivity(orgDir, files, 20));
    }),
  );

  app.get(
    "/api/asset/:folder",
    wrap((req, res) => {
      const abs = findAsset(orgDir, req.params.folder);
      if (!abs) return res.status(404).json({ error: "画像がありません" });
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(abs);
    }),
  );

  // SSE: 変更があれば `update` を送る
  app.get("/api/events", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write("retry: 3000\n");
    res.write(`event: hello\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(": ping\n\n"), 25000);
    req.on("close", () => {
      clearInterval(ping);
      clients.delete(res);
    });
  });

  app.use("/api", (req, res) => res.status(404).json({ error: "不明な API です" }));

  // 本番: ビルド済みの画面を配信する
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: "index.html" }));
    app.use((req, res, next) => {
      if (req.method !== "GET") return next();
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    app.get("/", (req, res) => {
      res
        .type("text/plain; charset=utf-8")
        .send("画面がまだビルドされていません。packages/dashboard で npm run build を実行してください。");
    });
  }

  const broadcast = () => {
    const msg = `event: update\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`;
    for (const c of clients) c.write(msg);
  };
  const watcher = watch ? watchOrgDir(orgDir, broadcast, 300) : null;

  const close = async () => {
    for (const c of clients) c.end();
    clients.clear();
    if (watcher) await watcher.close();
  };
  return { app, broadcast, close };
}

/**
 * サーバーを起動する。
 * @returns {Promise<{ server: import('node:http').Server, url: string, close: () => Promise<void> }>}
 */
export function startServer(orgDir, port, host = "127.0.0.1") {
  const { app, close } = createApp(orgDir);
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host);
    server.once("listening", () => {
      const url = `http://${host === "127.0.0.1" ? "localhost" : host}:${port}`;
      resolve({
        server,
        url,
        close: async () => {
          await close();
          server.closeAllConnections?.();
          await new Promise((r) => server.close(() => r()));
        },
      });
    });
    server.once("error", async (err) => {
      await close();
      reject(err);
    });
  });
}
