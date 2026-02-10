/**
 * SuperuserDashboard - 系統管理中心
 * 系統管理員專屬控制台，可進入 Admin Dashboard、Dashboard、架站精靈
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccessLevel } from "../../utils/multi-tenant";
import { logout } from "../../utils/Accounts";

import Manage from "../../assets/manage.svg";
import Account from "../../assets/data.svg";
import AddIcon from "../../assets/add.svg";
import Logout from "../../assets/logout.svg";

const SuperuserDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isSuperuser } = useAccessLevel();
  const email = localStorage.getItem("email") || "";

  const menuItems = [
    {
      id: "admin-dashboard",
      icon: Manage,
      title: "Admin Dashboard",
      description: "站長管理後台：首頁管理、新聞、帳號管理",
      link: "/backend/admin_dashboard",
      color: "bg-purple-500",
    },
    {
      id: "dashboard",
      icon: Account,
      title: "Dashboard",
      description: "一般使用者後台：個人資料、專案管理、AI 秘書",
      link: "/backend/dashboard",
      color: "bg-blue-500",
    },
    {
      id: "site-wizard",
      icon: AddIcon,
      title: "架站精靈",
      description: "多租戶站台管理：建立、列表、編輯站台",
      link: "/backend/tenant",
      color: "bg-green-500",
    },
    {
      id: "dev-switcher",
      icon: Account,
      title: "切換使用者",
      description: "開發工具：快速切換測試帳號",
      link: "/backend/dev/switch-user",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">系統管理中心</h1>
        <p className="text-gray-600">{email}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          系統管理員
        </span>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
            >
              <div className={`${item.color} p-6 flex justify-center`}>
                <img
                  src={item.icon}
                  alt={item.title}
                  className="w-16 h-16 filter brightness-0 invert"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={logout}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          登出
        </button>
      </div>
    </div>
  );
};

export default SuperuserDashboard;
