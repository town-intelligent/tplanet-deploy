import ImageBg from "../assets/captcha.png";
import Reload from "../assets/Restart.png";
import React, { useState, useRef, useEffect } from "react";
import puzzle_piece from "../assets/puzzle_piece.png";
import puzzle_hole from "../assets/puzzle_hole.png";
import { useTranslation } from "react-i18next";

const SliderCaptcha = ({
  onVerify,
  width = 300,
  height = 150,
  isVerified,
  setIsVerified,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [puzzlePosition, setPuzzlePosition] = useState(0);
  const [isError, setIsError] = useState(false);
  const { t } = useTranslation();

  const containerRef = useRef(null);
  const puzzleSize = 42;
  const tolerance = 10;
  const sliderWidth = 48; // 滑塊寬度

  // 生成隨機拼圖位置
  const generatePuzzlePosition = () => {
    const minPos = puzzleSize;
    const maxPos = width - puzzleSize - 10;
    return Math.random() * (maxPos - minPos) + minPos;
  };

  // ===== E2E 測試繞過 =====
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('e2e_key') === 'tplanet-e2e-secret-2024') {
      console.log('[E2E] CAPTCHA bypassed');
      setIsVerified(true);
    }
  }, [setIsVerified]);

  useEffect(() => {
    setPuzzlePosition(generatePuzzlePosition());
  }, [width]);

  // 計算新位置
  const calculateNewPosition = (clientX) => {
    if (!containerRef.current) return 0;
    
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left - (sliderWidth / 2);
    return Math.max(0, Math.min(relativeX, width - sliderWidth));
  };

  // 處理開始事件（統一滑鼠和觸控）
  const handleStart = (e) => {
    if (isVerified) return;
    
    // 阻止默認行為和事件冒泡
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setIsError(false);
    
    // 立即更新位置
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const newPos = calculateNewPosition(clientX);
    setSliderPosition(newPos);
  };

  // 處理移動事件
  const handleMove = (e) => {
    if (!isDragging || isVerified) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const newPos = calculateNewPosition(clientX);
    setSliderPosition(newPos);
  };

  // 處理結束事件
  const handleEnd = (e) => {
    if (!isDragging || isVerified) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);

    // 檢查驗證結果
    const isSuccess = Math.abs(sliderPosition - puzzlePosition) < tolerance;

    if (isSuccess) {
      setIsVerified(true);
      setSliderPosition(puzzlePosition);
      onVerify && onVerify(true);
    } else {
      setIsError(true);
      setTimeout(() => {
        setSliderPosition(0);
        setIsError(false);
        setPuzzlePosition(generatePuzzlePosition());
      }, 1000);
      onVerify && onVerify(false);
    }
  };

  // 重置函數
  const reset = () => {
    setSliderPosition(0);
    setIsVerified(false);
    setIsError(false);
    setIsDragging(false);
    setPuzzlePosition(generatePuzzlePosition());
  };

  // 全域事件監聽
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMove = (e) => handleMove(e);
    const handleGlobalEnd = (e) => handleEnd(e);

    // 添加事件監聽器
    document.addEventListener('mousemove', handleGlobalMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalEnd, { passive: false });
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, sliderPosition]);

  return (
    <div style={{ 
      width: '100%', 
      padding: '16px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center' 
    }}>
      {/* 標題和重試按鈕 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        width: `${width}px`,
        maxWidth: '100%'
      }}>
        <p style={{ 
          color: '#374151', 
          fontWeight: '600', 
          margin: '0',
          fontSize: '16px'
        }}>
          {t("captcha.title")}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            color: '#6B7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <img src={Reload} alt="重新整理" width={20} />
        </button>
      </div>

      {/* 拼圖區域 */}
      <div
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          background: 'linear-gradient(to right, #DBEAFE, #EFF6FF)',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px',
          margin: '0 auto 16px auto'
        }}
      >
        {/* 背景圖案 */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <img src={ImageBg} alt="" style={{ height: '100%', width: 'auto' }} />
        </div>

        {/* 拼圖缺口 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${puzzlePosition}px`,
            width: `${puzzleSize}px`,
            height: `${puzzleSize}px`,
            transform: 'translateY(-50%)',
            backgroundImage: `url(${puzzle_hole})`,
            backgroundSize: 'cover'
          }}
        />

        {/* 移動的拼圖塊 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${sliderPosition}px`,
            width: `${puzzleSize}px`,
            height: `${puzzleSize}px`,
            transform: 'translateY(-50%)',
            backgroundImage: `url(${puzzle_piece})`,
            backgroundSize: 'cover',
            transition: isDragging ? 'none' : 'left 0.3s ease-out'
          }}
        />
      </div>

      {/* 滑動條 */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: `${width}px`,
          height: '48px',
          maxWidth: '100%',
          backgroundColor: isVerified ? '#DCFCE7' : isError ? '#FEE2E2' : '#D1D5DB',
          borderRadius: '8px',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: 'pointer',
          margin: '0 auto'
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* 提示文字 */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{
            fontSize: '14px',
            color: isVerified ? '#16A34A' : isError ? '#DC2626' : '#6B7280'
          }}>
            {isVerified ? t("captcha.success") : isError ? t("captcha.fail") : t("captcha.hint")}
          </span>
        </div>

        {/* 滑塊 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${sliderPosition}px`,
            width: `${sliderWidth}px`,
            height: '40px',
            transform: `translateY(-50%) ${isDragging ? 'scale(1.05)' : 'scale(1)'}`,
            backgroundColor: isVerified ? '#16A34A' : isError ? '#DC2626' : '#FFFFFF',
            color: isVerified || isError ? '#FFFFFF' : '#6B7280',
            border: isVerified || isError ? 'none' : '2px solid #D1D5DB',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {isVerified ? (
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : isError ? (
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default SliderCaptcha;