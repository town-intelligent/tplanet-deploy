import React, { useEffect, useState, useRef } from "react";

// 滾動動畫 Hook - 使用 Intersection Observer
export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 只觸發一次動畫
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || "0px 0px -50px 0px",
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
};

// 動畫區塊元件
export const AnimatedSection = ({
  children,
  animation = "fade-up",
  delay = 0,
  className = "",
  style: customStyle = {}
}) => {
  const [ref, isVisible] = useScrollAnimation();

  const animationStyles = {
    "fade-up": {
      initial: { opacity: 0, transform: "translateY(40px)" },
      visible: { opacity: 1, transform: "translateY(0)" },
    },
    "fade-down": {
      initial: { opacity: 0, transform: "translateY(-40px)" },
      visible: { opacity: 1, transform: "translateY(0)" },
    },
    "fade-left": {
      initial: { opacity: 0, transform: "translateX(-40px)" },
      visible: { opacity: 1, transform: "translateX(0)" },
    },
    "fade-right": {
      initial: { opacity: 0, transform: "translateX(40px)" },
      visible: { opacity: 1, transform: "translateX(0)" },
    },
    "zoom-in": {
      initial: { opacity: 0, transform: "scale(0.9)" },
      visible: { opacity: 1, transform: "scale(1)" },
    },
    "fade": {
      initial: { opacity: 0 },
      visible: { opacity: 1 },
    },
  };

  const style = animationStyles[animation] || animationStyles["fade-up"];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style.initial,
        ...(isVisible ? style.visible : {}),
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
        willChange: "opacity, transform",
        ...customStyle,
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
