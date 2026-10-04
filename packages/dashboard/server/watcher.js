// 組織フォルダを chokidar で監視し、変更をまとめて(既定 300ms)知らせる。
// 監視するだけで、ファイルには触れない。

import chokidar from "chokidar";

/**
 * @param {string} orgDir 組織フォルダ
 * @param {() => void} onChange 変更があったときに呼ぶ(まとめたあと1回)
 * @param {number} delay まとめる時間(ミリ秒)
 * @returns {{ close: () => Promise<void> }}
 */
export function watchOrgDir(orgDir, onChange, delay = 300) {
  let timer = null;
  const watcher = chokidar.watch(orgDir, {
    ignoreInitial: true,
    // ドットで始まるもの(.DS_Store など)は無視する
    ignored: (p) => /(^|[/\\])\.[^/\\]/.test(p.slice(orgDir.length)),
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });
  const fire = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onChange();
    }, delay);
  };
  watcher.on("all", fire);
  watcher.on("error", () => {
    /* 監視のエラーは表示に影響させない */
  });
  return {
    close: async () => {
      if (timer) clearTimeout(timer);
      await watcher.close();
    },
  };
}
