// src/pages/hooks/useOneClickPipeline.js
import { useCallback } from "react";

export function useOneClickPipeline({
  API_LLMTWINS,
  cmsContentBase = import.meta.env.VITE_HOST_URL_TPLANET + "/content/",
} = {}) {
  const runOneClickPipeline = useCallback(
    async ({ sessionId, fileId, onProgress }) => {
      const progress = (p) => {
        try { typeof onProgress === "function" && onProgress(p); } catch {}
      };

      const postJSON = async (url, body) => {
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body || {}),
        });
        const text = await resp.text();
        let data = null;
        try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
        return { ok: resp.ok, status: resp.status, data };
      };

      // --- 1) 先試 one_click（若你還沒做會 404/501） ---
      progress({ stage: "extract", pct: 0.75, message: "準備欄位抽取與 CMS 上傳…" });
      try {
        const url = `${API_LLMTWINS}/api/sessions/${encodeURIComponent(sessionId)}/pipeline/one_click`;
        const r = await postJSON(url, { email: localStorage.getItem("email") });
        if (r.ok) {
          const uuid = r.data?.uuid || r.data?.data?.uuid;
          const cmsLink = r.data?.cmsLink || (uuid ? `${cmsContentBase}${uuid}` : undefined);
          if (!uuid || !cmsLink) throw new Error(`one_click 回傳格式不完整：${JSON.stringify(r.data)}`);
          progress({ stage: "done", pct: 1.0, message: "完成" });

          return { uuid, cmsLink };
        }
        if (r.status !== 404 && r.status !== 501) {
          throw new Error(`one_click 失敗（${r.status}）：${JSON.stringify(r.data)}`);
        }
      } catch (_) {
      }      
      progress({ stage: "extract", pct: 0.78, message: "欄位抽取中…" });
      progress({ stage: "cms_upload", pct: 0.9, message: "上傳 CMS 中…" });
    },
  );

  return { runOneClickPipeline };
}