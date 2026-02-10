// src/pages/backend/modules/ChatModule.jsx
import ChatMessages from "../../components/ChatMessages";
import InputBar from "../../components/InputBar";
import OcrTaskList from "../../components/OcrTaskList";
import { useAISecretary } from "../contexts/AISecretaryContext";

export default function ChatModule({ onConfirm, onSend, prefillText }) {
  const {
    messages,
    messagesEndRef,
    policyHit,
    isStreaming,
    isLoading,
    isSdgLoading,
    stop,
    tasks,
    cancel,
    listRef,
    isActiveTask,
  } = useAISecretary();

  const activeTasks = (tasks || []).filter(isActiveTask);
  const hasActiveOcrTasks = activeTasks.length > 0;

  return (
    <div className="flex flex-col h-full">
      <ChatMessages
        messages={messages}
        policyHit={policyHit}
        isStreaming={isStreaming || isSdgLoading}
        onConfirm={onConfirm}
      />
      <OcrTaskList
        tasks={tasks}
        onStartPrefill={() => {}}
        onCancel={cancel}
        listRef={listRef}
      />
      <div ref={messagesEndRef} />
      <InputBar
        onSend={onSend}
        onStop={stop}
        isLoading={isLoading || isSdgLoading}
        isStreaming={isStreaming || isSdgLoading}
        disabled={hasActiveOcrTasks}
        disabledMessage={hasActiveOcrTasks ? "文件處理中，請稍候..." : undefined}
        prefillText={prefillText}
      />
    </div>
  );
}
