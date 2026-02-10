const API_LLMTWINS = import.meta.env.VITE_API_LLMTWINS;

function getInitialSessionId() {
  const fromUrl = new URL(location.href).searchParams.get("session_id");
  const fromLS = localStorage.getItem("session_id");
  return fromUrl || fromLS || null;
}

async function createSession() {
  const r = await fetch(`${API_LLMTWINS}/api/sessions`, { method: "POST" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.session_id) throw new Error("建立 session 失敗");
  return data.session_id;
}

function persistSessionId(sid) {
  localStorage.setItem("session_id", sid);
  const url = new URL(location.href);
  url.searchParams.set("session_id", sid);
  history.replaceState(null, "", url.toString());
}

function clearSessionId() {
  localStorage.removeItem("session_id");
  const url = new URL(location.href);
  url.searchParams.delete("session_id");
  history.replaceState(null, "", url.toString());
}

import { useEffect, useRef, useState } from "react";
export function useSession() {
  const [sessionId, setSessionId] = useState(getInitialSessionId());
  const [useSessionFlag, setUseSessionFlag] = useState(!!sessionId);
  const initRef = useRef(false);
  const sessionPromiseRef = useRef(null);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    ensureSession().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureSession() {
    if (sessionId) return sessionId;
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    sessionPromiseRef.current = (async () => {
      let sid = getInitialSessionId();
      if (!sid) sid = await createSession();
      persistSessionId(sid);
      setSessionId(sid);
      return sid;
    })();

    try { return await sessionPromiseRef.current; }
    finally { sessionPromiseRef.current = null; }
  }

  function dropSession() {
    setUseSessionFlag(false);
    setSessionId(null);
    clearSessionId();
  }

  return { API_LLMTWINS, sessionId, ensureSession, dropSession, useSessionFlag, setUseSessionFlag };
}
