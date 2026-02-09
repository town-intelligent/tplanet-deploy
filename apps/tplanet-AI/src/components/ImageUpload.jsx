import React, { useState, useRef } from "react";

const ImageUpload = ({
  value,
  onChange,
  type = "logo",
  tenantId = "default",
  accept = "image/png,image/jpeg,image/gif,image/svg+xml,image/webp",
  maxSize = 5 * 1024 * 1024, // 5MB
  placeholder = "點擊或拖放圖片上傳",
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = accept.split(",");
    if (!allowedTypes.includes(file.type)) {
      setError("不支援的檔案格式");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`檔案過大，最大 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("tenant_id", tenantId);

      const response = await fetch(
        `${import.meta.env.VITE_HOST_URL_TPLANET}/api/tenant/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        onChange(result.url);
      } else {
        setError(result.error || "上傳失敗");
      }
    } catch (e) {
      setError("網路錯誤: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-4 cursor-pointer
          transition-colors duration-200
          ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {value ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">{value}</p>
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-red-600 hover:text-red-700 mt-1"
              >
                移除
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500">上傳中...</span>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">{placeholder}</p>
                <p className="mt-1 text-xs text-gray-400">
                  PNG, JPG, GIF, SVG, WebP（最大 5MB）
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* URL 輸入備用 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">或輸入網址：</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 text-sm p-2 border border-gray-300 rounded"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
