import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { translateBatch } from "../utils/translateApi";
import { I18N_TO_TARGET } from "../utils/lang";

const Ctx = React.createContext(null);
export const useScopeTr = () => React.useContext(Ctx);

export default function TranslateScope({ children }) {
  const { i18n } = useTranslation();
  const lang = useMemo(() => (i18n.language || "zh").split("-")[0], [i18n.language]);
  const target = I18N_TO_TARGET[lang] || null;

  const [version, setVersion] = useState(0);

  // 翻譯結果：`${lang}|t|${src}` / `${lang}|h|${src}`
  const mapRef = useRef(new Map());

  // 本輪需要翻譯的 queue（用 Set 去重）
  const qTextRef = useRef(new Set());
  const qHtmlRef = useRef(new Set());

  const timerRef = useRef(null);
  const runningRef = useRef(false);

  // Store target in ref to avoid dependency issues
  const targetRef = useRef(target);
  const langRef = useRef(lang);
  targetRef.current = target;
  langRef.current = lang;

  const schedule = useCallback(() => {
    // If no translation needed, don't trigger re-render
    if (!targetRef.current) {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (runningRef.current) return;
      runningRef.current = true;

      try {
        const map = mapRef.current;
        const currentLang = langRef.current;
        const currentTarget = targetRef.current;

        const texts = Array.from(qTextRef.current);
        const htmls = Array.from(qHtmlRef.current);
        qTextRef.current.clear();
        qHtmlRef.current.clear();

        const uniqText = texts.filter((t) => !map.has(`${currentLang}|t|${t}`));
        const uniqHtml = htmls.filter((h) => !map.has(`${currentLang}|h|${h}`));

        if (!uniqText.length && !uniqHtml.length) return;

        if (uniqText.length) {
          const out = await translateBatch(uniqText, currentTarget, { isHtml: false });
          uniqText.forEach((src, idx) => map.set(`${currentLang}|t|${src}`, out[idx] || src));
        }

        if (uniqHtml.length) {
          const out = await translateBatch(uniqHtml, currentTarget, { isHtml: true });
          uniqHtml.forEach((src, idx) => map.set(`${currentLang}|h|${src}`, out[idx] || src));
        }

        setVersion((v) => v + 1);
      } finally {
        runningRef.current = false;
      }
    }, 120);
  }, []);

  // 語言切換：不用清 map（key 有 lang），但要刷新一次讓顯示更新
  useEffect(() => {
    setVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const tr = useCallback((src) => {
    if (!targetRef.current) return src;
    return mapRef.current.get(`${langRef.current}|t|${src}`) || src;
  }, []);

  const trHtml = useCallback((src) => {
    if (!targetRef.current) return src;
    return mapRef.current.get(`${langRef.current}|h|${src}`) || src;
  }, []);

  const registerText = useCallback((src) => {
    if (!src) return;
    qTextRef.current.add(src);
    schedule();
  }, [schedule]);

  const registerHtml = useCallback((src) => {
    if (!src) return;
    qHtmlRef.current.add(src);
    schedule();
  }, [schedule]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    tr, trHtml, registerText, registerHtml, version
  }), [tr, trHtml, registerText, registerHtml, version]);

  return (
    <Ctx.Provider value={contextValue}>
      {children}
    </Ctx.Provider>
  );
}
