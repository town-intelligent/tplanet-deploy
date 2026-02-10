import React, { useEffect } from "react";
import { useScopeTr } from "./TranslateScope";

export default function TrHtml({ html, ...props }) {
  const { trHtml, registerHtml, version } = useScopeTr();
  const src = (html ?? "").toString();

  useEffect(() => {
    registerHtml(src);
  }, [src, registerHtml]);

  void version;
  return <div {...props} dangerouslySetInnerHTML={{ __html: trHtml(src) }} />;
}
