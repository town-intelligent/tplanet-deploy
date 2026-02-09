import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { list_plans, plan_info } from "../../utils/Plan";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import i18n  from "../../utils/i18n";

/**
 * 小工具
 */
const formatCurrency = (n) => {
  if (n == null || Number.isNaN(Number(n))) return "-";
  try {
    return Number(n).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
  } catch {
    return String(n);
  }
};

const formatPeriod = (period) => {
  if (!period) return "-";
  // 允許 period 是字串 or 物件 {start, end}
  if (typeof period === "string") return period;
  const { start, end } = period || {};
  return [start, end].filter(Boolean).join(" ~ ") || "-";
};

/**
 * 成果上傳結果 Modal
 */
// function UploadModal({ upload, show, onHide, filename = "file.pdf", projectName }) {
//   if (!show) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
//         <div className="text-center">
//           <p className="text-sm text-gray-500 mb-1">{projectName || "—"}</p>
//           {upload === true && (
//             <>
//               <p className="mb-1 text-green-700 font-semibold">上傳成功</p>
//               <p className="text-sm text-gray-700">{filename}</p>
//             </>
//           )}
//           {upload === false && (
//             <>
//               <p className="mb-1 text-red-600 font-semibold">上傳失敗</p>
//               <p className="text-sm text-gray-700">請再重新提供</p>
//             </>
//           )}
//         </div>
//         <button
//           onClick={onHide}
//           className="mt-5 w-full bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
//         >
//           關閉
//         </button>
//       </div>
//     </div>
//   );
// }

function UploadModal({ show, onHide, projectUUID, projectName }) {
  const [file, setFile] = useState(null);
  const [upload, setUpload] = useState(null); // null=未上傳, true=已上傳, false=失敗
  const [isUploading, setIsUploading] = useState(false);
  const [existingFile, setExistingFile] = useState(null); // 有檔案時儲存檔案名稱

  // 🔍 檢查是否已有上傳過檔案
  const checkHasFile = async (uuid) => {
    try {
      const response = await fetch(
        "https://beta-tplanet-backend.ntsdgs.tw/projects/download_attachment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid }),
        }
      );

      const contentType = response.headers.get("Content-Type") || "";

      if (response.ok && contentType.includes("application/pdf")) {
        // 嘗試從 Content-Disposition 取得檔名
        const disp = response.headers.get("Content-Disposition"); 
        // header 可能長這樣: attachment; filename="example.pdf"
        const filename = disp?.match(/filename="?([^"]+)"?/)?.[1] || `${projectName}.pdf`;
        
        setExistingFile(filename);
        setUpload(true);
      } else {
        setExistingFile(null);
        setUpload(null);
      }
    } catch (err) {
      console.error("Check file failed:", err);
      setExistingFile(null);
      setUpload(null);
    }
  };


  useEffect(() => {
    if (show && projectUUID) checkHasFile(projectUUID);
  }, [show, projectUUID]);

  // 🧾 Dropzone 設定
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUpload(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    multiple: false,
  });

  // ⬆️ 上傳檔案
  const handleUpload = async () => {
    if (!file) return alert(i18n.t("userpage.no_file_selected"));

    setIsUploading(true);
    setUpload(null);

    const url =
      "https://beta-tplanet-backend.ntsdgs.tw/projects/upload_attachment";
    const formData = new FormData();
    formData.append("uuid", projectUUID);
    formData.append("attachment", file, file.name);

    try {
      const response = await fetch(url, { method: "POST", body: formData });
      const result = await response.json().catch(() => null);

      if (response.ok && result?.success !== false) {
        setUpload(true);
        setExistingFile(file.name);
      } else {
        console.error("Upload failed:", result);
        setUpload(false);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUpload(false);
    } finally {
      setIsUploading(false);
    }
  };

  // ⬇️ 下載檔案
  const handleDownload = async () => {
  try {
    const response = await fetch(
      "https://beta-tplanet-backend.ntsdgs.tw/projects/download_attachment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: projectUUID }),
      }
    );

    if (!response.ok) throw new Error("下載失敗");

    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType.includes("application/pdf")) {
      const text = await response.text();
      console.error("非PDF回應：", text.slice(0, 200));
      throw new Error("回傳格式錯誤");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    // 優先使用 Content-Disposition 的 filename，否則 fallback 為 `${projectName}.pdf`
    const disp = response.headers.get("Content-Disposition");
    const filename =
      disp?.match(/filename="?([^"]+)"?/)?.[1] || `${projectName}.pdf`;

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    alert(i18n.t("userpage.download_fail_retry"));
  }
};


  if (!show || !projectUUID) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">{projectName || "—"}</p>

          {upload === true && existingFile ? (
            <>
              <p className="mb-1 text-green-700 font-semibold">{i18n.t("userpage.upload_success")} ✅</p>
              <p className="text-sm text-gray-700">{existingFile}</p>
                <button
                  onClick={() => {
                    setFile(null);
                    setUpload(null);
                    setExistingFile(null);
                  }}
                  className="w-1/2 px-4 py-2 bg-green-600 text-white"
                >
                  {i18n.t("userpage.reupload")}
                </button>
              <div className="flex mt-4 gap-2">
                <button
                  onClick={onHide}
                  className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
                >
                  {i18n.t("common.close")}
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {i18n.t("userpage.download")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                {...getRootProps()}
                className={`mt-3 border-2 border-dashed rounded-lg p-6 text-gray-500 cursor-pointer transition ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <p className="text-gray-700">📄 {file.name}</p>
                ) : isDragActive ? (
                  <p>{i18n.t("userpage.drop_active")}</p>
                ) : (
                  <p>{i18n.t("userpage.drop_idle")}</p>
                )}
              </div>

              <div className="flex mt-4 gap-2">
                <button
                  onClick={onHide}
                  className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
                >
                  {i18n.t("common.close")}
                </button>
                <button
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                  className={`w-full px-4 py-2 rounded-lg text-white transition cursor-pointer ${
                    isUploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isUploading ? i18n.t("userpage.uploading") : i18n.t("userpage.confirm_upload")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * 主頁：
 * - 使用 utils/Plan.jsx 的 list_plans(email) 取得計畫 UUID 陣列
 * - 逐一呼叫 plan_info(uuid) 取得詳細資訊
 * - 顯示在表格中
 */
export default function UserPage() {
  // 使用者資料（Email 從 localStorage 或預設）
  const getEmail = () => {
    try {
      return localStorage.getItem("email") || "";
    } catch {
      return "";
    }
  };

  const [user] = useState({
    name: "Second Home",
    department: "", // 地方團隊留空
    phone: "04 9222 2106",
    email: getEmail(),
    role: "使用者",
    password: ""
  });

  // UI 狀態
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const { t } = useTranslation();

  // 取消請求用（避免快速切頁造成 setState on unmounted）
  const abortRef = useRef(null);

  const emailForQuery = useMemo(() => user.email?.trim(), [user.email]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchAll() {
      setLoading(true);
      setError("");
      setProjects([]);

      try {
        // 1) 取計畫列表（UUID 陣列）
        const list = await list_plans(emailForQuery);
        // 預期格式：{ result: "true", projects: [uuid1, uuid2, ...] }
        const uuids = Array.isArray(list?.projects) ? list.projects : [];

        if (!uuids.length) {
          setProjects([]);
          setLoading(false);
          return;
        }

        // 2) 逐一抓取詳情
        const details = await Promise.all(
          uuids.map(async (uuid) => {
            try {
              const info = await plan_info(uuid);
              // 預期 info 結構：{ uuid, name, period, budget, status, hoster, project_type, ... }
              const res = await fetch(
                `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/attachment_exist`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uuid }),
                }
              );
              const json = await res.json();
              const hasAttachment = json.result ?? false;

              return {
                id: info?.uuid || uuid,
                name: info?.name || "—",
                period: formatPeriod(info?.period),
                cost: formatCurrency(info?.budget),
                upload: hasAttachment, // 1=已上傳（依你的假設）
                hoster: info?.hoster ?? "—",
                projectType: info?.project_type ?? "—",
              };
            } catch (e) {
              console.error("plan_info error", uuid, e);
              return {
                id: uuid,
                name: "載入失敗",
                period: "-",
                cost: "-",
                upload: false,
                hoster: "-",
                projectType: "-",
              };
            }
          })
        );

        if (!controller.signal.aborted) {
          setProjects(details);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("list_plans error", e);
          setError(t("userpage.load_error"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (emailForQuery) fetchAll();

    return () => controller.abort();
  }, [emailForQuery]);

  const navigate = useNavigate();

  return (
    <div className="w-full max-w-5xl mx-auto py-4 space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[#317EE0] block mb-1 text-sm font-medium">{t("userpage.handler")}</label>
          <p className="text-xl leading-tight mb-4">{user.name}</p>

          <label className="text-[#317EE0] block mb-1 text-sm font-medium">{t("userpage.department")}</label>
          <p className="text-xl mb-4">{user.department || "－"}</p>

          <label className="text-[#317EE0] block mb-1 text-sm font-medium">{t("userpage.phone")}</label>
          <p className="text-xl">{user.phone}</p>
        </div>
        <div>
          <label className="text-[#317EE0] block mb-1 text-sm font-medium">{t("userpage.email")}</label>
          <p className="text-xl mb-4">{user.email}</p>

          <label className="text-[#317EE0] block mb-1 text-sm font-medium">{t("userpage.role")}</label>
          <p className="text-xl mb-4">{user.role}</p>

          <label className="text-[#317EE0] block mb-1 text-sm font-medium">{t("userpage.password")}</label>
          <div className="flex items-center">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              onClick={() => navigate("/backend/reset_pw")}
            >
              {t("userpage.change_password")}
            </button>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse table-auto min-w-full">
            <thead className="bg-[#4472C4] text-white">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap font-medium">{t("userpage.project_id")}</th>
                <th className="px-4 py-3 whitespace-nowrap font-medium">{t("userpage.project_name")}</th>
                <th className="px-4 py-3 whitespace-nowrap font-medium">{t("userpage.project_period")}</th>
                <th className="px-4 py-3 whitespace-nowrap font-medium">{t("userpage.budget")}</th>
                <th className="px-4 py-3 whitespace-nowrap font-medium">{t("userpage.report")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2">{t("common.loading")}</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-red-500">
                    <div className="flex flex-col items-center">
                      <span>{error}</span>
                      <button
                        onClick={() => {
                          // 重新觸發 effect
                          const now = Date.now();
                          // 小技巧：變更 email 查詢字串以觸發 effect；或直接呼叫 list_plans 再 set
                          // 這裡選擇直接呼叫 setLoading + 再跑一次 useEffect 邏輯較簡潔
                          setLoading(true);
                          setError("");
                          // 強制重新跑：改 local state 以便 dependency 變動
                          // 也可以改成另外包 fetch function 後直接呼叫
                        }}
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        {t("common.reload")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    {t("userpage.no_projects")}
                  </td>
                </tr>
              ) : (
                projects.map((proj, idx) => (
                  <tr key={proj.id} className={`text-[#575757] ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="px-4 py-3 border-b border-gray-100">{proj.id}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-left">{proj.name}</td>
                    <td className="px-4 py-3 border-b border-gray-100">{proj.period}</td>
                    <td className="px-4 py-3 border-b border-gray-100">{proj.cost}</td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <button
                        className="inline-flex justify-center items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-blue-50 transition"
                        onClick={() => {
                          setSelectedProject(proj);
                          setModalShow(true);
                        }}
                        title={proj.upload ? t("userpage.download") : t("userpage.upload")}
                      >
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                        {proj.upload ? (
                          // ✅ 已上傳 → 雲端下載（整個箭頭往下移一點）
                          <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 16l3 3m0 0l3-3m-3 3V8"
                              />
                            ) : (
                              // ⬆️ 未上傳 → 雲端上傳（原樣）
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9
                                  M15 13l-3-3m0 0l-3 3m3-3v10"
                          />
                        )}
                        </svg>
                        <span className="text-sm">{proj.upload ? t("userpage.download") : t("userpage.upload")}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {selectedProject && (
        <UploadModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          upload={selectedProject.upload}
          projectName={selectedProject.name}
          projectUUID={selectedProject.id}
        />
      )}
    </div>
  );
}