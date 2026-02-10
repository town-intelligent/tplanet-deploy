import React, { useEffect, useState } from "react";
import { sdgData } from "../../utils/Config";

// 動態載入圖片的函數
const loadImages = async (names, setState) => {
  try {
    const imagePromises = names.map((name) =>
      import(`../../assets/sdgs/${name}.png`).then((module) => ({
        key: `sdg_${name}`,
        src: module.default,
      }))
    );

    const loadedImages = await Promise.all(imagePromises);
    const imagesObject = loadedImages.reduce((acc, image) => {
      acc[image.key] = image.src;
      return acc;
    }, {});

    setState(imagesObject);
  } catch (error) {
    console.error("載入SDG圖片時發生錯誤:", error);
  }
};

// Hook組件用於載入圖片
const useSdgImages = () => {
  const [images, setImages] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSdgImages = async () => {
      await loadImages(
        sdgData.map((item) => item.id),
        setImages
      );
      setIsLoaded(true);
    };

    loadSdgImages();
  }, []);

  return { images, isLoaded };
};

// 主要的圖示生成函數組件
const SdgIconsGenerator = ({ weight = "" } = {}) => {
  const { images, isLoaded } = useSdgImages();

  const generateSdgsIcons = (weight) => {
    if (!weight || !isLoaded || typeof weight !== "string") return null;

    return weight.split(",").map((w, index) => {
      const weightValue = parseInt(w?.trim());
      if (weightValue === 1) {
        const sdgId = (index + 1).toString(); // 轉換索引為SDG ID
        const imageKey = `sdg_${sdgId}`;
        const thumbnail = images[imageKey];

        if (thumbnail) {
          return (
            <div key={index} className="w-12 h-12 p-1 flex-shrink-0">
              <a
                href={`/kpi_filter/${index + 1}`}
                className="block w-full h-full no-underline"
              >
                <img
                  className="w-full h-full object-contain"
                  src={thumbnail}
                  alt={`SDG ${sdgId}`}
                />
              </a>
            </div>
          );
        }
      }
      return null;
    });
  };

  return <>{generateSdgsIcons(weight)}</>;
};

export default SdgIconsGenerator;
