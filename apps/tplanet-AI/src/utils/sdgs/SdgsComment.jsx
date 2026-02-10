import { Form } from "react-bootstrap";
import { sdgData } from "../../utils/Config";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../utils/i18n";

const useSdgImages = () => {
  const [images, setImages] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingErrors, setLoadingErrors] = useState([]);

  useEffect(() => {
    const loadSdgImages = async () => {
      try {
        const imagePromises = sdgData.map(async (item) => {
          try {
            const module = await import(`../../assets/sdgs/${item.id}.png`);
            return {
              key: `sdg_${item.id}`,
              src: module.default,
              success: true,
            };
          } catch (error) {
            console.warn(`無法載入 SDG ${item.id} 圖片:`, error);
            return {
              key: `sdg_${item.id}`,
              src: null,
              success: false,
              error: error.message,
            };
          }
        });

        const loadedImages = await Promise.all(imagePromises);

        // 分離成功和失敗的載入結果
        const successfulImages = {};
        const errors = [];

        loadedImages.forEach((image) => {
          if (image.success) {
            successfulImages[image.key] = image.src;
          } else {
            errors.push({
              id: image.key.replace("sdg_", ""),
              error: image.error,
            });
          }
        });

        setImages(successfulImages);
        setLoadingErrors(errors);
        setIsLoaded(true);
      } catch (error) {
        console.error("載入SDG圖片時發生錯誤:", error);
        setIsLoaded(true);
      }
    };

    loadSdgImages();
  }, []);

  return { images, isLoaded, loadingErrors };
};

// SDG 圖標項目組件
const SdgIconItem = ({
  sdgId,
  imageSrc,
  sdgInfo,
  comment,
  onCommentChange,
}) => {
  const handleDescriptionChange = (e) => {
    const newContent = e.target.value;
    onCommentChange(sdgId, newContent);
  };

  return (
    <div className="flex my-2 items-center justify-center" key={`sdg-${sdgId}`}>
      <div className="w-20 h-20 p-1 flex-shrink-0">
        <div
          className="block w-full h-full"
          title={`${sdgInfo.text}: ${sdgInfo.content}`}
        >
          {imageSrc ? (
            <img
              className="w-full h-full object-contain"
              src={imageSrc}
              alt={`SDG ${sdgId}: ${sdgInfo.text}`}
              loading="lazy"
            />
          ) : (
            // 備用顯示，當圖片載入失敗時
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 rounded">
              {sdgId}
            </div>
          )}
        </div>
      </div>
      <div className="w-full ml-4">
        <Form.Control
          type="text"
          placeholder={i18n.t("cmsImpact.sdgs_comment_placeholder", { sdgInfo: sdgInfo.text })}
          value={comment}
          onChange={handleDescriptionChange}
        />
      </div>
    </div>
  );
};

// 主要的 SDG 圖標生成組件
const SdgIconsGenerator = ({ weight, comment, setComments }) => {
  const { images, isLoaded, loadingErrors } = useSdgImages();
  const [comments, setCommentsState] = useState({});

  useEffect(() => {
    if (!comment || comment === "null" || comment === "") {
      setCommentsState({});
      return;
    }

    try {
      setCommentsState(JSON.parse(comment));
    } catch (error) {
      console.warn("解析註解 JSON 失敗:", error);
      setCommentsState({});
    }
  }, [comment]);

  // 處理註解變更
  const handleCommentChange = (sdgId, newContent) => {
    const updatedComments = { ...comments, [sdgId]: newContent };
    setCommentsState(updatedComments);

    // 更新父組件的註解狀態
    if (setComments) {
      setComments(JSON.stringify(updatedComments));
    }
  };

  // 載入狀態顯示
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-600">載入 SDG 圖標中...</div>
      </div>
    );
  }

  // 顯示載入錯誤（如果需要的話）
  if (loadingErrors.length > 0) {
    console.warn("以下 SDG 圖片載入失敗:", loadingErrors);
  }

  // 如果沒有權重資料，返回空
  if (!weight) {
    console.log("no weight");
    return null;
  }

  // 解析權重並生成對應的圖標
  return (
    <div className="sdg-icons-container">
      {weight
        .split(",")
        .map((w, index) => {
          if (parseInt(w) === 1 && sdgData[index]) {
            const sdgInfo = sdgData[index];
            const imageSrc = images[`sdg_${sdgInfo.id}`];
            const commentContent = comments[sdgInfo.id] || "";

            return (
              <SdgIconItem
                key={`sdg-item-${sdgInfo.id}`}
                sdgId={sdgInfo.id}
                imageSrc={imageSrc}
                sdgInfo={sdgInfo}
                comment={commentContent}
                onCommentChange={handleCommentChange}
              />
            );
          }
          return null;
        })
        .filter(Boolean)}
    </div>
  );
};

// 導出主要組件和 Hook（如果需要在其他地方使用）
//export { useSdgImages, SdgIconItem };
export default SdgIconsGenerator;
