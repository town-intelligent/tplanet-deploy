import React, { useEffect } from "react";
import { useScopeTr } from "./TranslateScope";

export default function Tr({ children, className }) {
  const { tr, registerText, version } = useScopeTr();
  const src = typeof children === "string" ? children : "";

  useEffect(() => {
    if (src) {
      registerText(src);
    }
  }, [src, registerText]);

  // version 只要被「讀取」，React 就會在 version 變時 rerender
  return <p className={className}>{tr(src)}</p>;
}

