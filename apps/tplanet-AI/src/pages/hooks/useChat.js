// src/pages/hooks/useChat.js
import { useRef, useState, useEffect } from "react";

const STORAGE_KEY = "ai_chat_messages";

/**
 * Chat hook for AI Secretary (LLMTwins backend)
 *
 * Usage in input component:
 *   const { send } = useChat(...);
 *   const [draft, setDraft] = useState("");
 *   const onSend = () => send(draft, true, () => setDraft(""));
 */
export function useChat({ API_LLMTWINS, ensureSession }) {
  // 從 sessionStorage 恢復對話紀錄
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 每次 messages 變化時存到 sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save chat messages to sessionStorage:", e);
    }
  }, [messages]);
  const [policyHit, setPolicyHit] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSdgLoading, setIsSdgLoading] = useState(false); // 新增 SDG 載入狀態
  const controllerRef = useRef(null);
  const sdgControllerRef = useRef(null); // 新增 SDG 控制器

  const nowTW = () =>
    new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });

  // ===== 新增 SDG Demo API 調用函數 =====
  async function callSdgDemoAPI(sdgNumbers, userMessage = "", onChunk) {
    try {
      setIsSdgLoading(true);
      
      const sessionId = await ensureSession();
      const url = `${API_LLMTWINS}/api/planning?session_id=${sessionId}`;
      
      const payload = {
        sdgs: sdgNumbers.join(","),
        model: "openai/gpt-4o-mini",
        stream: true,
        userMessage: userMessage // 用戶的聊天內容
      };

      const controller = new AbortController();
      sdgControllerRef.current = controller;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 處理串流回應
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content && typeof onChunk === "function") {
              onChunk(data.message.content);
            }
          } catch (e) {
            // 忽略 JSON 解析錯誤
          }
        }
      }

      return true; // 成功完成
    } catch (error) {
      if (error.name === "AbortError") {
        throw error; // 讓調用者知道是中止操作
      }
      console.error("SDG Demo API 調用失敗:", error);
      throw error;
    } finally {
      setIsSdgLoading(false);
      sdgControllerRef.current = null;
    }
  }

  // ===== 新增 SDG 專用發送函數 =====
  async function sendSdgAnalysis(sdgNumbers, userText, planName = "") {
    const text = String(userText ?? "").trim();
    if (!text || !sdgNumbers || sdgNumbers.length === 0) return;

    // 添加用戶訊息
    const userMsg = { sender: "user", text, time: nowTW() };
    setMessages((prev) => [...prev, userMsg]);

    // 建構上下文訊息（格式需與 LLMTwins planning.py 一致）
    const contextMessage = planName
      ? `計劃名稱：${planName}\n\n用戶詢問：${text}`
      : text;

    // 創建 AI 回應訊息
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage = {
      id: aiMessageId,
      sender: "ai",
      text: "",
      time: nowTW(),
      type: "sdg-analysis"
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsStreaming(true);

    try {
      await callSdgDemoAPI(sdgNumbers, contextMessage, (delta) => {
        setMessages((prev) => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: msg.text + delta }
            : msg
        ));
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        setMessages((prev) => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: `抱歉，SDG 分析調用失敗：${error.message}`, type: "error" }
            : msg
        ));
      }
    } finally {
      setIsStreaming(false);
    }
  }

  async function callLLMNonStreaming(history) {
    const payload = {
      model: "openai/gpt-4o-mini",
      stream: false,
      messages: [
        { role: "system", content: "你是政府專案 AI 秘書，請使用繁體中文跟我對話。" },
        ...history.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
      ],
    };

    const sid = await ensureSession();
    const res = await fetch(
      `${API_LLMTWINS}/api/chat?session_id=${encodeURIComponent(sid)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client": "ai-secretary-web",
        },
        body: JSON.stringify(payload),
      }
    );

    const raw = await res.text();
    let out = "";
    try {
      const obj = JSON.parse(raw);
      out = obj?.message?.content ?? obj?.response ?? "";
    } catch {
      out = raw;
    }
    if (!res.ok)
      throw new Error(
        `HTTP ${res.status} ${(out || "").replace(/\s+/g, " ").slice(0, 160)}`
      );
    return out || "（後端沒有回傳內容）";
  }

  async function callLLMStreaming(history, onChunk) {
    const payload = {
      model: "openai/gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: "你是政府專案 AI 秘書，請使用繁體中文跟我對話。" },
        ...history.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
      ],
    };

    const controller = new AbortController();
    controllerRef.current = controller;
    setPolicyHit(null);

    const sid = await ensureSession();
    const res = await fetch(
      `${API_LLMTWINS}/api/chat?session_id=${encodeURIComponent(sid)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client": "ai-secretary-web",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    const policyHeader = res.headers.get("X-Policy-Blocked");
    if (policyHeader) setPolicyHit(policyHeader);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error("瀏覽器不支援串流或沒有 body");

    const decoder = new TextDecoder("utf-8");
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;

        try {
          const obj = JSON.parse(line);
          if (obj?.done) return;
          if (obj?.message?.content !== undefined) onChunk(obj.message.content);
        } catch {
          // ignore malformed chunk
        }
      }
    }

    if (buf.trim()) {
      try {
        const obj = JSON.parse(buf.trim());
        if (obj?.message?.content !== undefined) onChunk(obj.message.content);
      } catch {
        // ignore tail
      }
    }
  }

  /**
   * Send a message to LLMTwins.
   * @param {string} text - user input
   * @param {boolean} useStream - whether to stream the reply
   * @param {Function} onSent - optional callback executed right after user's message is appended (use to clear input)
   */
  async function send(text, useStream = true, onSent) {
    const t = String(text ?? "").trim();
    if (!t) return; // do not send empty

    const userMsg = { sender: "user", text: t, time: nowTW() };
    const history = [...messages, userMsg];
    setMessages(history);

    // let caller clear the input ASAP for best UX
    if (typeof onSent === "function") onSent();

    if (!useStream) {
      setIsLoading(true);
      try {
        const aiText = await callLLMNonStreaming(history);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: aiText, time: nowTW() },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `⚠️ 發生錯誤：${String(e.message || e)}`,
            time: nowTW(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsStreaming(true);
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "", time: nowTW() },
    ]);

    try {
      await callLLMStreaming(history, (delta) =>
        setMessages((prev) => {
          const copy = [...prev];
          const i = copy.length - 1;
          if (i >= 0 && copy[i].sender === "ai") {
            copy[i] = { ...copy[i], text: copy[i].text + delta };
          }
          return copy;
        })
      );
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `⚠️ 串流錯誤：${String(e.message || e)}`,
            time: nowTW(),
          },
        ]);
      }
    } finally {
      setIsStreaming(false);
      controllerRef.current = null;
    }
  }

  function stop() {
    // 停止一般聊天
    controllerRef.current?.abort();
    setIsStreaming(false);
    controllerRef.current = null;
    
    // 停止 SDG 分析
    sdgControllerRef.current?.abort();
    setIsSdgLoading(false);
    sdgControllerRef.current = null;
  }

  return {
    messages,
    setMessages,
    policyHit,
    isStreaming,
    isLoading,
    isSdgLoading, // 新增返回值
    send,
    sendSdgAnalysis, // 新增返回值
    stop,
  };
}