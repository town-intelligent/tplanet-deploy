import { useTranslation } from "react-i18next";

export default function SidebarNav({ currentPage, onNav }) {
  const { t } = useTranslation();
  const menu = [
    // { id: "history", label: "歷史訊息紀錄" },
    // { id: "upload",  label: "上傳檔案" },
    { id: "planning",label: t("aiSecretary.planning") },
    { id: "data",    label: t("aiSecretary.data") },
  ];
  return (
    <div className="w-[200px] bg-[#317EE0] flex flex-col items-start py-6 px-4 flex-shrink-0">
      <a href="/backend/user-page" className="!no-underline"><p className="text-white mb-8">專案管理</p></a>
      <div className="flex flex-col gap-4 w-full">
        {menu.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            className={`w-full text-left text-white text-sm transition-all duration-200 hover:bg-blue-600 hover:bg-opacity-50 px-2 py-1 rounded ${currentPage === item.id ? "underline bg-blue-600 bg-opacity-30" : ""}`}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
