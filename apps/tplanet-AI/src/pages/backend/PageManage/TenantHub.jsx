/**
 * TenantHub - 架站精靈入口頁
 * 顯示功能卡片讓使用者選擇：建立新站台、站台列表
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AddIcon from "../../../assets/add.svg";
import ListIcon from "../../../assets/new_list.svg";

const TenantHub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuItems = [
    {
      id: "create",
      icon: AddIcon,
      title: "建立新站台",
      description: "建立新的多租戶站台，設定域名與基本資訊",
      link: "/backend/tenant/create",
      color: "bg-blue-500",
    },
    {
      id: "list",
      icon: ListIcon,
      title: "站台列表",
      description: "查看與管理所有站台，編輯或刪除現有站台",
      link: "/backend/tenant/list",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">架站精靈</h1>
        <p className="text-gray-600">多租戶站台管理中心</p>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
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
          onClick={() => navigate("/backend/admin_dashboard")}
          className="text-gray-500 hover:text-gray-700 underline"
        >
          返回管理後台
        </button>
      </div>
    </div>
  );
};

export default TenantHub;
