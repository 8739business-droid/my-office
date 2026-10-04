import { useState } from "react";
import { avatarColor, initialOf } from "../departments.js";

/**
 * 担当のアイコン。`_assets/<id>` の画像があればそれを、なければイニシャルの丸を出す。
 */
export default function Avatar({ id, name, hasAsset, size = 34, bg, color = "#0a0f17", version = 0, style }) {
  const [broken, setBroken] = useState(false);
  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    border: "2px solid var(--ring)",
    background: bg || avatarColor(id),
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: Math.round(size * 0.42),
    overflow: "hidden",
    flex: "none",
    ...style,
  };
  if (hasAsset && !broken) {
    return (
      <span style={base} aria-hidden="true">
        <img
          src={`/api/asset/${encodeURIComponent(id)}?v=${version}`}
          alt=""
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setBroken(true)}
        />
      </span>
    );
  }
  return (
    <span style={base} aria-hidden="true">
      {initialOf(name)}
    </span>
  );
}
