// src/pages/hooks/usePdfToCmsWorkflow.js

/**
 * PDF 到 CMS 的完整工作流程 Hook
 *
 * 這個 Hook 提供一鍵式的 PDF 處理與發佈功能，會自動完成以下步驟：
 *
 * 工作流程（由後端 LLMTwins API 自動執行）：
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1. OCR 文字辨識                                              │
 * │    - 從上傳的 PDF 中提取文字內容                             │
 * │                                                              │
 * │ 2. LLM 智能欄位抽取                                          │
 * │    - 計劃名稱 (name)                                         │
 * │    - 單位名稱 (org)                                          │
 * │    - 理念簡述 (philosophy)                                   │
 * │    - 永續發展指標 (SDGs)                                     │
 * │    - 其他 CMS 所需的結構化欄位                               │
 * │                                                              │
 * │ 3. 組成 CMS API Payload                                     │
 * │    - 將抽取的欄位轉換為 CMS 可接受的格式                     │
 * │                                                              │
 * │ 4. 自動發佈到 CMS                                            │
 * │    - 呼叫 CMS API 建立新專案                                 │
 * │    - 回傳專案 UUID 和 CMS 連結                               │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @param {Object} params
 * @param {string} params.API_LLMTWINS - LLMTwins API 基礎 URL
 * @returns {Object} { processPdfAndPublishToCms }
 */
export function usePdfToCmsWorkflow({ API_LLMTWINS }) {
  const postJSON = async (url, body, headers = {}) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }
    return res.json();
  };

  /**
   * 處理 PDF 並發佈到 CMS 的主函式
   *
   * 這是一個「一鍵式」的 API，前端只需呼叫一次，後端會自動完成：
   * OCR → LLM 抽取 → 組成 Payload → 發佈 CMS 的完整流程
   *
   * @param {Object} params
   * @param {string} params.sessionId - 當前會話 ID
   * @param {string} params.fileId - 已上傳的 PDF 檔案 ID
   * @param {Function} params.onProgress - 進度回調函式
   * @returns {Promise<{uuid: string, cmsLink: string}>} 專案 UUID 和 CMS 連結
   *
   * @example
   * const { uuid, cmsLink } = await processPdfAndPublishToCms({
   *   sessionId: "session_123",
   *   fileId: "file_456",
   *   onProgress: ({ stage, pct, message }) => {
   *     console.log(`${stage}: ${pct * 100}% - ${message}`);
   *   }
   * });
   */
  const processPdfAndPublishToCms = async ({ sessionId, fileId, onProgress = () => {} }) => {
    const emit = (stage, pct, message) => {
      let p = typeof pct === "number" ? pct : undefined;
      // 100% 只留給「成功拿到 cmsLink」，避免進度條滿了但還在等待
      if (stage !== "done" && typeof p === "number") p = Math.min(p, 0.95);
      onProgress({ stage, pct: p, message });
    };

    // 階段 1: 欄位抽取（視覺上推進到 90%）
    emit("extract", 0.9, "欄位抽取中…");

    // 階段 2: 發佈到 CMS（鎖在 95%，避免滿格卻還在等待）
    emit("post_cms", 0.95, "正在發佈至 CMS…");

    // 呼叫後端 one_click API
    // 這個 API 會在後端自動完成 OCR、LLM 抽取、組成 payload、發佈 CMS 的所有步驟
    const url = `${API_LLMTWINS}/api/sessions/${sessionId}/pipeline/one_click`;
    const resp = await postJSON(url, { file_id: fileId });

    // 階段 3: 完成（成功才補到 100%）
    emit("done", 1.0, "已成功發佈");

    return {
      uuid: resp?.uuid,
      cmsLink: resp?.cms_link || resp?.cmsLink
    };
  };

  return { processPdfAndPublishToCms };
}