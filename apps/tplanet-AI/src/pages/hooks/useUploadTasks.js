import { useEffect, useRef, useState, useCallback } from "react";
import { computeFakeProgress } from "../utils/progress";

export function useUploadTasks() {
  const [tasks, setTasks] = useState([]); // {id,name,startAt,progress,stage,done,timerId}
  const listRef = useRef(null);

  function start(row) {
    const id = row?.id ?? `ocr_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const startAt = Date.now();
    const task = { id, name: row?.name || "未命名.pdf", startAt, progress: 0, stage: "ocr", done: false, timerId: null };

    const timerId = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.id !== id) return t;
        const elapsed = Date.now() - startAt;
        let p = computeFakeProgress(elapsed);
        if (elapsed >= 150000) return { ...t, progress: 1, stage: "ready", done: true };
        const stage = p < 0.72 ? "ocr" : (p < 0.98 ? "index" : "ready");
        return { ...t, progress: p, stage };
      }));
    }, 500);

    setTasks(prev => [...prev, { ...task, timerId }]);
  }

  function completeById(id) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.timerId) clearInterval(t.timerId);
      return { ...t, progress: 1, stage: "ready", done: true, timerId: null };
    }));
  }

  function cancel(id) {
    setTasks(prev => {
      const t = prev.find(x => x.id === id);
      if (t?.timerId) clearInterval(t.timerId);
      return prev.filter(x => x.id !== id);
    });
  }

  const updateById = useCallback((id, patch) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        // 若有 stage，順便推導 done 狀態
        if (patch.stage) {
          next.done = patch.stage === "done" ? true : (patch.done ?? t.done);
        }
        // 若 stage 為終止狀態（error/done），清除計時器
        if (patch.stage === "error" || patch.stage === "done") {
          if (t.timerId) {
            clearInterval(t.timerId);
            next.timerId = null;
          }
        }
        // 進度護欄
        if (typeof patch.progress === "number") {
          next.progress = Math.min(1, Math.max(0, patch.progress));
        }
        return next;
      })
    );
  }, []);

  useEffect(() => { if (tasks.length > 0) listRef.current?.scrollIntoView({ behavior: "smooth" }); }, [tasks.length]);
  useEffect(() => () => tasks.forEach(t => t.timerId && clearInterval(t.timerId)), []); // cleanup

  return { tasks, start, completeById, cancel, updateById, listRef };
}
