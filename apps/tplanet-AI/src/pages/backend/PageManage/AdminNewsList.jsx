// File: src/pages/backend/AdminNewsList.jsx

import React, { useState, useEffect, useCallback } from "react";
import { news_list, news_get, news_delete, news_add } from "../../../utils/New";
import { mockup_get, mockup_upload } from "../../../utils/Mockup";
import { Button } from "react-bootstrap";
import Delete from "../../../assets/delete_icon.svg";
import Image from "../../../assets/image_icon.svg";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import i18n from "../../../utils/i18n";

const getLocalStorage = (key) => localStorage.getItem(key);

// ------------------------------
// 小工具：檔案驗證 & 檔案→預覽URL
// ------------------------------
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// 附件允許的檔案類型和大小
const ATTACHMENT_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
  "image/jpeg", 
  "image/png", 
  "image/gif"
];
const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateImageFile(file) {
  if (!file) return { ok: false, msg: i18n.t("adminNewsList.news_no_file")};
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, msg: i18n.t("adminNewsList.news_image_type_error")};
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, msg: i18n.t("adminNewsList.news_image_size_error") };
  }
  return { ok: true };
}

function validateAttachmentFile(file) {
  if (!file) return { ok: false, msg: i18n.t("adminNewsList.news_no_file")};
  if (!ATTACHMENT_ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, msg: i18n.t("adminNewsList.news_attachment_type_error") };
  }
  if (file.size > ATTACHMENT_MAX_SIZE) {
    return { ok: false, msg: i18n.t("adminNewsList.news_attachment_size_error") };
  }
  return { ok: true };
}

function fileToPreviewURL(file) {
  return URL.createObjectURL(file);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ------------------------------
// 新聞卡片
// ------------------------------
const NewsCard = ({ news, isMainNews, onDelete, onEdit }) => {
  const handleDelete = async () => {
    if (window.confirm(`${i18n.t("adminNewsList.news_confirm_delete")} : ${news.content.title}`)) {
      try {
        const deleteResult = await news_delete(news.content.uuid);
        if (deleteResult?.result && onDelete) {
          onDelete();
        }
        window.location.reload();
      } catch (err) {
        console.error("刪除失敗：", err);
      }
    }
  };

  // 檢查是否有附件
  const hasAttachment = news.content.attachments_data;

  return (
    <div
      className={isMainNews ? "col-md-12 d-none d-md-block mb-4" : "col-md-4 mb-4"}
      id={`id_${news.content.uuid}`}
    >
      <div
        className="relative img-fluid bg-cover"
        style={{
          backgroundImage: `url(${import.meta.env.VITE_HOST_URL_TPLANET}${news.content.static.banner})`,
          width: "100%",
          height: isMainNews ? "400px" : "288px",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        {/* 附件標示 */}
        {hasAttachment && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
            📎 {i18n.t("adminNewsList.news_has_attachment")}
          </div>
        )}

        {/* 刪除按鈕 */}
        <button className="absolute top-2 right-2 p-1 rounded-full" onClick={handleDelete}>
          <img src={Delete} alt="刪除" />
        </button>

        {/* 文字區 */}
        <div className="flex flex-col w-full h-full justify-end text-white">
          <div className="pt-2 pl-3 bg-black bg-opacity-50 flex justify-between items-center">
            <div>
              <p className="mb-0 opacity-100">{news.content.period || ""}</p>
              <p className="opacity-100">{news.content.title}</p>
            </div>
            <div className="mr-4">
              <button
                className="bg-[#317EE0] py-1 rounded-pill text-white"
                style={{ width: "100px" }}
                onClick={() => onEdit(news)}
              >
                {i18n.t("edit.edit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// 附件上傳區塊
// ------------------------------
const AttachmentUpload = ({ attachment, setAttachment }) => {
  const inputId = "attachment-upload";

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAttachmentFile(file);
    if (!validation.ok) {
      alert(validation.msg);
      return;
    }

    setAttachment(file);
    // 清空 input 避免同檔案無法再次選擇
    e.target.value = "";
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-2">{i18n.t("adminNewsList.news_attachment_optional")}</label>
      
      {!attachment ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              📎 {i18n.t("adminNewsList.news_select_attachment")}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {i18n.t("adminNewsList.news_attachment_support")}<br/>
              {i18n.t("adminNewsList.news_attachment_size")}
            </p>
            <button
              type="button"
              onClick={() => document.getElementById(inputId)?.click()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {i18n.t("adminNewsList.news_select_attachment")}
            </button>
          </div>
          <input
            id={inputId}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
          />
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📎</div>
              <div>
                <p className="font-medium text-gray-900">{attachment.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="text-red-500 hover:text-red-700 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------
// 新增/編輯表單（送出時才一起上傳 banner/img_0/img_1/img_2/attachment）
// ------------------------------
const AddEditNewsForm = ({ newsData, onCancel }) => {
  const [title, setTitle] = useState(newsData?.title || "");
  const [description, setDescription] = useState(newsData?.description || "");
  
  // 新增缺少的狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // 日期處理
  let start = "", end = "";
  if (newsData?.period) {
    const parts = newsData.period.split(" - ");
    start = parts[0] || "";
    end = parts[1] || "";
  }
  const [periodStart, setPeriodStart] = useState(start);
  const [periodEnd, setPeriodEnd] = useState(end);

  // 圖片狀態（URL + File）
  const [images, setImages] = useState({
    banner: newsData?.static?.banner ? import.meta.env.VITE_HOST_URL_TPLANET + newsData.static.banner : null,
    img_0: newsData?.static?.img_0 ? import.meta.env.VITE_HOST_URL_TPLANET + newsData.static.img_0 : null,
    img_1: newsData?.static?.img_1 ? import.meta.env.VITE_HOST_URL_TPLANET + newsData.static.img_1 : null,
    img_2: newsData?.static?.img_2 ? import.meta.env.VITE_HOST_URL_TPLANET + newsData.static.img_2 : null,
  });

  const [files, setFiles] = useState({}); // 送出用
  const [attachment, setAttachment] = useState(null); // 新增附件狀態

  // dropzone handler
  const onDrop = useCallback((acceptedFiles, key) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) {
      alert(v.msg);
      return;
    }
    const previewUrl = fileToPreviewURL(file);
    setImages((prev) => ({ ...prev, [key]: previewUrl }));
    setFiles((prev) => ({ ...prev, [key]: file }));
  }, []);

  // DropZone 元件
  const DropZone = ({ label, keyName }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: { "image/*": [] },
      maxFiles: 1,
      onDrop: (files) => onDrop(files, keyName),
    });

    return (
      <div
        {...getRootProps()}
        className="border w-full h-[200px] flex flex-col justify-center items-center cursor-pointer bg-gray-50"
      >
        <input {...getInputProps()} />
        {images[keyName] ? (
          <img src={images[keyName]} alt={`${keyName} 預覽`} className="w-full h-full object-cover" />
        ) : isDragActive ? (
          <p className="text-blue-500">{i18n.t("adminNewsList.news_drag_upload")}</p>
        ) : (
          <div className="text-gray-400">
            <img src={Image} alt="image" />
            {label}
          </div>
        )}
      </div>
    );
  };

  // 送出（延後上傳）- 加上載入特效
  const handleSubmit = async () => {
    if (isSubmitting) return; // 防止重複提交
    
    setIsSubmitting(true);
    setUploadProgress(i18n.t("adminNewsList.news_prepare_upload"));

    const formData = new FormData();
    formData.append("email", localStorage.getItem("email") || "");
    formData.append("title", title);
    formData.append("description", description);
    formData.append("period", `${periodStart} - ${periodEnd}`);

    // 計算上傳檔案數量
    let fileCount = 0;
    Object.keys(files).forEach((key) => {
      formData.append(key, files[key]);
      fileCount++;
    });

    // 加入附件檔案
    if (attachment) {
      formData.append("attachment", attachment);
      fileCount++;
    }

    try {
      if (fileCount > 0) {
        setUploadProgress(i18n.t("adminNewsList.news_uploading_count_files", { count: fileCount }));
      } else {
        setUploadProgress(i18n.t("adminNewsList.news_submitting"));
      }

      const result = await news_add(formData);
      
      if (result?.result === true) {
        setUploadProgress(i18n.t("adminNewsList.news_upload_success"));
        setTimeout(() => {
          alert(i18n.t("adminNewsList.news_add_success"));
          onCancel();
        }, 500);
      } else {
        throw new Error(result?.message || "新增失敗");
      }
    } catch (e) {
      console.error(e);
      setUploadProgress(i18n.t("adminNewsList.news_upload_fail"));
      setTimeout(() => {
        alert(i18n.t("adminNewsList.news_add_fail"));
        setIsSubmitting(false);
        setUploadProgress("");
      }, 1000);
    }
  };

  return (
    <div className="w-4/6 mx-auto py-4">
      <p className="bg-[#317EE0] text-white py-2 pl-4 text-3xl">{newsData ? i18n.t("adminNewsList.news_edit_project") : i18n.t("adminNewsList.news_add_project")}</p>

      <div className="p-4 bg-white shadow rounded">
        <div className="flex gap-4">
          {/* Banner DropZone */}
          <div className="w-1/3">
            <DropZone label={i18n.t("adminNewsList.news_upload_image")} keyName="banner" />
          </div>

          <div className="flex-1">
            <div className="mb-3">
              <label>{i18n.t("adminNewsList.news_title")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={i18n.t("adminNewsList.news_title_placeholder")}
                className="w-full border p-2"
              />
            </div>

            <div className="mb-3 flex items-center gap-2">
              <label>{i18n.t("adminNewsList.news_period")}</label>
              <input
                type="date"
                value={periodStart ? new Date(periodStart).toISOString().split("T")[0] : ""}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="border p-2"
              />
              <span>—</span>
              <input
                type="date"
                value={periodEnd ? new Date(periodEnd).toISOString().split("T")[0] : ""}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="border p-2"
              />
            </div>

            <div className="mb-3">
              <label>{i18n.t("adminNewsList.news_description")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={i18n.t("adminNewsList.news_title_placeholder")}
                className="w-full border p-2"
              />
            </div>
          </div>
        </div>

        {/* 其他圖片 */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <DropZone label={i18n.t("adminNewsList.news_upload_image")} keyName="img_0" />
          <DropZone label={i18n.t("adminNewsList.news_upload_image")} keyName="img_1" />
          <DropZone label={i18n.t("adminNewsList.news_upload_image")} keyName="img_2" />
        </div>

        {/* 新增附件上傳區塊 */}
        <div className="mt-4">
          <AttachmentUpload attachment={attachment} setAttachment={setAttachment} />
        </div>
      </div>

      {/* 底部按鈕 */}
      <div className="mt-6 flex gap-2 justify-center">
        <button 
          className="bg-gray-400 text-white px-6 py-2 rounded" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {i18n.t("edit.cancel")}
        </button>
        <button 
          className="bg-black text-white px-6 py-2 rounded mr-2 disabled:bg-gray-500 disabled:cursor-not-allowed relative" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {i18n.t("adminNewsList.news_uploading")}
            </div>
          ) : (
            i18n.t("adminNewsList.news_submit")
          )}
        </button>
      </div>

      {/* 上傳進度提示 */}
      {isSubmitting && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <p className="text-blue-800 font-medium">{uploadProgress}</p>
              <p className="text-blue-600 text-sm">{i18n.t("adminNewsList.news_handle_file")}</p>
            </div>
          </div>
          
          {/* 進度條動畫 */}
          <div className="mt-3 bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
        </div>
      )}

      {/* 上傳遮罩 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">{i18n.t("adminNewsList.news_uploading_files")}</h3>
            <p className="text-gray-600 mb-4">{uploadProgress}</p>
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
            </div>
            <p className="text-sm text-gray-500 mt-4">{i18n.t("adminNewsList.news_do_not_close")}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------
// Banner 即時上傳元件（等價 changeNewsListBanner）
// ------------------------------
const BannerEditor = ({ bannerImage, setBannerImage, afterUpload }) => {
  const inputId = "upload-banner-editor";

  const onPick = () => {
    document.getElementById(inputId)?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const v = validateImageFile(file);
    if (!v.ok) {
      alert(v.msg);
      return;
    }

    // 先本地預覽
    const preview = fileToPreviewURL(file);
    setBannerImage(preview);

    // 立刻上傳到 /mockup/new
    try {
      const form = new FormData();
      form.append("email", getLocalStorage("email") || "");
      form.append("news-banner-img", file, file.name || "banner.jpg");

      const resp = await mockup_upload(form);
      if (resp?.result === false) {
        throw new Error(resp?.message || "mockup 上傳失敗");
      }

      // 上傳成功後，保險起見可重抓一次 mockup（避免 CDN/快取）
      if (typeof afterUpload === "function") afterUpload();
      alert(i18n.t("adminNewsList.news_banner_updated"));
    } catch (err) {
      console.error(err);
      alert(i18n.t("adminNewsList.news_banner_upload_fail"));
    } finally {
      // 清空 input，避免同檔案無法再次觸發 change
      e.target.value = "";
    }
  };

  const getImageSrc = (img) => {
    if (!img) return "/api/placeholder/1200/400";
    if (typeof img === "string" && img.startsWith("data:")) return img; // base64
    return `${img}`; // URL
  };

  return (
    <div className="relative group">
      <img
        className="w-full"
        src={getImageSrc(bannerImage)}
        alt="Project Banner"
        onError={(e) => {
          e.currentTarget.src = "/api/placeholder/1200/400";
        }}
        style={{ height: "300px", objectFit: "cover", backgroundPosition: "center" }}
      />

      <div className="absolute bottom-0 right-0 p-2">
        <button onClick={onPick} className="bg-[#317EE0] text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center">
          {i18n.t("edit.cms_edit_image")}
        </button>
        <input id={inputId} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>
    </div>
  );
};

// ------------------------------
// 主列表頁（載入 mockup banner；可即時上傳 banner）
// ------------------------------
const NewsListComponent = () => {
  const { t } = useTranslation(); 
  const [newsList, setNewsList] = useState([]);
  const [bannerImage, setBannerImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingNews, setEditingNews] = useState(undefined);

  const sortNewsByDate = async (newsItems) => {
  try {
    // Add validation to ensure newsItems is an array
    if (!Array.isArray(newsItems)) {
      console.error("sortNewsByDate: newsItems is not an array:", newsItems);
      return [];
    }

    const results = await Promise.all(
      newsItems.map(async (uuid) => {
        try {
          const objNews = await news_get(uuid);
          if (!objNews || objNews.result === false) return null;

          const startDateStr = objNews.content?.period ?? null;
          const regex = /\b\d{2}\/\d{2}\/\d{4}\b/g;
          const matches = startDateStr ? startDateStr.match(regex) : null;
          const parsedStartDate = matches && matches.length > 0 ? new Date(matches[0]) : null;

          return { uuid, start_date: parsedStartDate, content: objNews.content };
        } catch (err) {
          console.error(`Error fetching news for UUID ${uuid}:`, err);
          return null;
        }
      })
    );

    return results
      .filter((n) => n !== null)
      .sort((a, b) => {
        if (a.start_date == null) return 1;
        if (b.start_date == null) return -1;
        return b.start_date - a.start_date;
      });
  } catch (err) {
    console.error("Error sorting news:", err);
    return [];
  }
};

  const refreshBanner = async () => {
    const form = new FormData();
    form.append("email", getLocalStorage("email") || "");
    const objMockup = await mockup_get(form);
    if (objMockup?.description && objMockup.description["news-banner-img"]) {
      setBannerImage(`${import.meta.env.VITE_HOST_URL_TPLANET}${objMockup.description["news-banner-img"]}`);
    }
  };

  const loadNewsData = async () => {
  try {
    // 取 banner
    await refreshBanner();

    // 取新聞列表
    const email = getLocalStorage("email") || "";
    const objNewsList = await news_list(email);    
    // Add validation to ensure content is an array
    if (!objNewsList || !objNewsList.content || !Array.isArray(objNewsList.content)) {
      console.log("No news content or content is not an array:", objNewsList);
      setNewsList([]);
      return;
    }
    
    if (objNewsList.content.length === 0) {
      setNewsList([]);
      return;
    }
    
    const sortedNews = await sortNewsByDate(objNewsList.content);
    setNewsList(sortedNews);
  } catch (error) {
    console.error("載入新聞資料時發生錯誤:", error);
    setNewsList([]); // Set empty array on error
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadNewsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-center">{t("common.loading")}`</div>;

  return (
    <div>
      <section className="flex-grow mt-5">
        {/* Banner 區域（支援即時上傳到 /mockup/new） */}
        <div className="container w-full">
          <div className="text-center w-full">
            <BannerEditor bannerImage={bannerImage} setBannerImage={setBannerImage} afterUpload={refreshBanner} />
          </div>
        </div>

        {editingNews !== undefined ? (
          <AddEditNewsForm newsData={editingNews?.content || null} onCancel={() => setEditingNews(undefined)} />
        ) : (
          <>
            <div className="flex gap-4 w-4/6 mx-auto my-4">
              <Button variant="dark" href="/backend/admin_dashboard">
                {t("adminNewsList.news_back_to_dashboard")}
              </Button>
              <Button className="!bg-[#F4693A] !text-white !border-0" onClick={() => setEditingNews(null)}>
                {t("edit.add")}
              </Button>
            </div>

            {/* 主要新聞區域 */}
            <div id="main_news" className="row w-4/6 mx-auto mb-4">
              {newsList.length > 0 && (
                <NewsCard
                  news={newsList[0]}
                  isMainNews={true}
                  onDelete={loadNewsData}
                  onEdit={(news) => setEditingNews(news)}
                />
              )}
            </div>

            {/* 新聞列表區域 */}
            <div id="news_container" className="row w-4/6 mx-auto mb-4">
              {newsList.slice(1).map((news) => (
                <NewsCard key={news.uuid} news={news} isMainNews={false} onDelete={loadNewsData} onEdit={(n) => setEditingNews(n)} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default NewsListComponent;