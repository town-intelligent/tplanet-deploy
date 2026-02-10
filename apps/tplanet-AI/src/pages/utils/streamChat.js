// utils/streamChat.js
export async function streamChat({ url, body, onMessage, onDone, onError, signal }) {
  const controller = new AbortController();
  const combinedSignal = signal
    ? new AbortController()
    : controller;

  if (signal) {
    // 把外部 signal 接到內部 controller
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/x-ndjson" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });

      let idx;
      // 逐行（\n）解析 NDJSON
      while ((idx = buf.indexOf("\n")) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 1);

        const line = raw.trim();
        if (!line) continue;

        let obj;
        try {
          obj = JSON.parse(line);
        } catch (e) {
          console.debug("[stream] JSON parse fail:", line);
          continue;
        }

        const msg = obj.message || {};
        // === 關鍵：同時支援 card 與純文字 ===
        if (msg.type === "card" && msg.card) {
          onMessage?.({
            sender: "ai",
            type: "card",
            card: msg.card,
            time: new Date().toLocaleTimeString(),
          });
        } else if (typeof msg.content === "string" && msg.content.trim()) {
          onMessage?.({
            sender: "ai",
            type: "text",
            text: msg.content,
            time: new Date().toLocaleTimeString(),
          });
        }

        if (obj.done === true) {
          onDone?.();       // 告知結束（讓等待泡泡消失）
        }
      }
    }

    // 收尾：有些伺服器最後一段不帶 \n，這裡再補一次處理
    const tail = buf.trim();
    if (tail) {
      try {
        const obj = JSON.parse(tail);
        const msg = obj.message || {};
        if (msg.type === "card" && msg.card) {
          onMessage?.({ sender: "ai", type: "card", card: msg.card, time: new Date().toLocaleTimeString() });
        } else if (typeof msg.content === "string" && msg.content.trim()) {
          onMessage?.({ sender: "ai", type: "text", text: msg.content, time: new Date().toLocaleTimeString() });
        }
        if (obj.done === true) onDone?.();
      } catch {}
    }

    onDone?.(); // 雙保險：即使伺服器沒送 done 也能結束 loading

  } catch (err) {
    console.error("[stream] error:", err);
    onError?.(err);
    onDone?.(); // 失敗也要收尾
  } finally {
    try { controller.abort(); } catch {}
  }
}
