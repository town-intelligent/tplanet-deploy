// src/pages/backend/modules/UploadModule.jsx
import DropzonePane from "../../components/DropzonePane";
import ChatModule from "./ChatModule";
import { useAISecretary } from "../contexts/AISecretaryContext";
import { plan_info } from "../../../utils/Plan";

// 將 HTML 轉成純文字
const stripHtml = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

// SDGs 欄位可能是字串(JSON)或物件：{ "8": "<p>…</p>", "11": "<p>…</p>" }
const formatSdgs = (sdgs) => {
  let obj = sdgs;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return stripHtml(obj) || "（未提供）";
    }
  }
  if (!obj || typeof obj !== "object") return "（未提供）";
  const lines = Object.entries(obj)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([k, v]) => `• SDG ${k}：${stripHtml(v)}`);
  return lines.length ? lines.join("\n") : "（未提供）";
};

export default function UploadModule({ onConfirm, onSend }) {
  const {
    API_LLMTWINS,
    ensureSession,
    start,
    updateById,
    completeById,
    processPdfAndPublishToCms,
    setMessages,
    nowStr,
  } = useAISecretary();

  return (
    <div className="flex h-full">
      <div className="w-[340px] bg-gray-50 border-r">
        <div className="p-6 space-y-3">
          <DropzonePane
            API_LLMTWINS={API_LLMTWINS}
            ensureSession={ensureSession}
            onUploadStart={(row) => {
              start({
                ...row,
                stage: "ocr",
                progress: 0.2,
              });
              setMessages((prev) => [
                ...prev,
                {
                  sender: "ai",
                  text: `🔄 已收到「${row?.name || "檔案"}」，開始 OCR 與解析，完成後會自動上傳 CMS。`,
                  time: nowStr(),
                },
              ]);
            }}
            onUploaded={async (row) => {
              // === 第二階段開始：處理已上傳的 PDF ===
              // 此時 PDF 已經在 LLMTwins 服務器上（由 DropzonePane 完成上傳）
              // 現在要進行：OCR → LLM 抽取 → CMS 發佈

              updateById(row.id, { stage: "index", progress: 0.6 });

              try {
                const sid = await ensureSession();
                console.log("[oneClick] sessionId =", sid);

                updateById(row.id, { stage: "extract", progress: 0.78 });

                // 呼叫一鍵處理流程
                // 這個函式會告訴後端：「請處理已上傳的檔案（fileId: row.id）」
                // 後端會自動執行：
                // 1. OCR 文字辨識
                // 2. LLM 智能欄位抽取（計劃名稱、單位、理念、SDGs 等）
                // 3. 組成 CMS API payload
                // 4. 發佈到 CMS 系統
                // 5. 回傳專案 UUID 和 CMS 連結
                const { uuid, cmsLink } = await processPdfAndPublishToCms({
                  sessionId: sid,
                  fileId: row.id,  // 這是 DropzonePane 上傳後的檔案 ID
                  onProgress: ({ stage, pct, message }) => {
                    const label =
                      message ||
                      (stage === "post_cms"
                        ? "正在發佈至 CMS…"
                        : stage === "extract"
                        ? "欄位抽取中…"
                        : undefined);

                    const updates = {
                      stage: stage || "extract",
                      message: label,
                    };

                    if (typeof pct === "number" && pct >= 0.78) {
                      updates.progress = Math.min(pct, 0.99);
                    }

                    updateById(row.id, updates);
                  },
                });

                updateById(row.id, { stage: "done", progress: 1, cmsLink, done: true });

                // 延遲 0.8 秒後移除任務，讓使用者看到「完成」狀態（UX 優化）
                setTimeout(() => completeById(row.id), 800);

                // 取得專案摘要資訊（計劃名稱、單位、理念、SDG 指標）
                try {
                  const project = await plan_info(uuid);
                  const sdgText = formatSdgs(project?.weight_description);

                  console.log("專案摘要:", project);
                  const summary = [
                    `計劃名稱：${project?.name || "（未提供）"}`,
                    `單位名稱：${project?.org || "（未提供）"}`,
                    `理念簡述：${project?.philosophy || "（未提供）"}`,
                    `永續指標：`,
                    sdgText,
                  ].join("\n");
                  setMessages((prev) => [
                    ...prev,
                    {
                      sender: "ai",
                      text: `✅ 已完成上傳，專案連結：${cmsLink}\n\n📄 專案摘要：${summary}`,
                      time: nowStr(),
                    },
                  ]);
                } catch (e) {
                  console.error("取得專案摘要失敗:", e);
                  setMessages((prev) => [
                    ...prev,
                    {
                      sender: "ai",
                      text: `✅ 已完成上傳，專案連結：${cmsLink}`,
                      time: nowStr(),
                    },
                  ]);
                }
              } catch (e) {
                console.error(e);

                // 解析錯誤訊息，將 API 回應轉成友善格式
                let userFriendlyError = String(e?.message || e);
                let taskError = userFriendlyError;

                // 嘗試從 HTTP 400 回應中提取結構化錯誤
                const jsonMatch = userFriendlyError.match(/\{.*\}/s);
                if (jsonMatch) {
                  try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    const detail = parsed?.detail || parsed;
                    if (detail?.message) {
                      // 格式化為友善訊息
                      userFriendlyError = detail.message;
                      taskError = detail.error || detail.message;
                      if (detail?.required_fields?.length) {
                        userFriendlyError += `\n\n必填欄位：${detail.required_fields.join("、")}`;
                      }
                    }
                  } catch {
                    // JSON 解析失敗，使用原始訊息
                  }
                }

                updateById(row.id, {
                  stage: "error",
                  progress: 1,
                  error: taskError,
                });
                setMessages((prev) => [
                  ...prev,
                  {
                    sender: "ai",
                    text: `❌ 上傳失敗：${userFriendlyError}`,
                    time: nowStr(),
                  },
                ]);
              }
            }}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto h-full">
        <ChatModule onConfirm={onConfirm} onSend={onSend} />
      </div>
    </div>
  );
}
