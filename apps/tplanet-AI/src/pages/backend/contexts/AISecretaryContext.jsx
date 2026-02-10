// src/pages/backend/contexts/AISecretaryContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "../../hooks/useSession";
import { useChat } from "../../hooks/useChat";
import { useUploadTasks } from "../../hooks/useUploadTasks";
import { usePdfToCmsWorkflow } from "../hooks/usePdfToCmsWorkflow";

const AISecretaryContext = createContext(null);

export const useAISecretary = () => {
  const context = useContext(AISecretaryContext);
  if (!context) {
    throw new Error("useAISecretary must be used within AISecretaryProvider");
  }
  return context;
};

export const AISecretaryProvider = ({ children }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const { API_LLMTWINS, ensureSession } = useSession();
  const { messages, setMessages, policyHit, isStreaming, isLoading, isSdgLoading, send, sendSdgAnalysis, stop } =
    useChat({ API_LLMTWINS, ensureSession });

  const { tasks, start, completeById, cancel, listRef, updateById } = useUploadTasks();
  const { processPdfAndPublishToCms } = usePdfToCmsWorkflow({ API_LLMTWINS });

  const nowStr = () =>
    new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });

  // 清除對話紀錄（同時清除 sessionStorage）
  const clearMessages = () => {
    sessionStorage.removeItem("ai_chat_messages");
    setMessages([
      {
        sender: "ai",
        text: "你好！我是你的 AI 秘書。你可以上傳文件並與我討論內容，或直接開始對話。",
        time: nowStr(),
      },
    ]);
  };

  // 初始訊息（僅在沒有紀錄時顯示）
  useEffect(() => {
    if (messages.length) return; // 已從 sessionStorage 恢復，不覆蓋
    setMessages([
      {
        sender: "ai",
        text: "你好！我是你的 AI 秘書。你可以上傳文件並與我討論內容，或直接開始對話。",
        time: nowStr(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 滾動到底
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 任務完成後自動從列表移除（保底機制）
  useEffect(() => {
    (tasks || []).forEach((t) => {
      if ((t?.cmsLink || t?.stage === "done") && !t?._cleanupScheduled) {
        updateById(t.id, { _cleanupScheduled: true });
        setTimeout(() => completeById(t.id), 1500);
      }
    });
  }, [tasks, updateById, completeById]);

  const isActiveTask = (t) =>
    !t?.cmsLink && t?.stage !== "error";

  const value = {
    // State
    input,
    setInput,
    messages,
    setMessages,
    clearMessages,
    messagesEndRef,

    // Chat related
    policyHit,
    isStreaming,
    isLoading,
    isSdgLoading,
    send,
    sendSdgAnalysis,
    stop,

    // Upload tasks related
    tasks,
    start,
    completeById,
    cancel,
    listRef,
    updateById,
    isActiveTask,

    // API & Session
    API_LLMTWINS,
    ensureSession,
    processPdfAndPublishToCms,

    // Utilities
    nowStr,
  };

  return (
    <AISecretaryContext.Provider value={value}>
      {children}
    </AISecretaryContext.Provider>
  );
};
