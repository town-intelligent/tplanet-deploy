/**
 * DevUserSwitcher - 開發用使用者切換頁面
 * 方便在不同使用者間切換測試
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessLevel } from "../../utils/multi-tenant";

const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

// 測試帳號列表
const TEST_ACCOUNTS = [
  { email: "yillkid@gmail.com", role: "Superuser" },
  { email: "philaeld@gmail.com", role: "Superuser" },
  { email: "forus999ai@gmail.com", role: "Admin (站長)" },
  { email: "forus999@gmail.com", role: "Member" },
];

const DevUserSwitcher = () => {
  const navigate = useNavigate();
  const { accessLevel, isAdmin, isMember, isSuperuser } = useAccessLevel();
  const currentEmail = localStorage.getItem("email") || "(未登入)";
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleImpersonate = async (account) => {
    setLoading(account.email);
    setError(null);

    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        setError("請先登入 Superuser 帳號");
        return;
      }

      const formData = new FormData();
      formData.append("target_email", account.email);

      const response = await fetch(`${API_BASE}/api/accounts/impersonate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.data?.token) {
        localStorage.setItem("jwt", data.data.token);
        localStorage.setItem("email", account.email);
        window.location.reload();
      } else {
        setError(`切換失敗: ${data.error || "未知錯誤"}`);
      }
    } catch (e) {
      setError(`切換失敗: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="font-bold">開發測試專用</p>
        <p className="text-sm">此頁面僅供開發測試使用，正式環境請移除</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">目前使用者</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-mono">{currentEmail}</p>
            <p className="text-sm text-gray-600">
              權限: {accessLevel}
              {isSuperuser && " (Superuser)"}
              {isAdmin && !isSuperuser && " (Admin)"}
              {isMember && !isAdmin && " (Member)"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            登出
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">切換使用者</h2>
        {!isSuperuser && (
          <div className="bg-gray-100 border-l-4 border-gray-400 p-3 mb-4 text-sm text-gray-600">
            只有 Superuser 可以切換使用者。請先登入 Superuser 帳號。
          </div>
        )}
        <div className="space-y-3">
          {TEST_ACCOUNTS.map((account) => (
            <div
              key={account.email}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                currentEmail === account.email
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div>
                <p className="font-mono">{account.email}</p>
                <p className="text-sm text-gray-600">{account.role}</p>
              </div>
              {currentEmail === account.email ? (
                <span className="text-blue-600 font-bold">目前使用者</span>
              ) : (
                <button
                  onClick={() => handleImpersonate(account)}
                  disabled={loading === account.email || !isSuperuser}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  title={!isSuperuser ? "只有 Superuser 可以切換使用者" : ""}
                >
                  {loading === account.email ? "切換中..." : "切換"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => navigate("/backend/admin_dashboard")}
          className="text-gray-500 hover:text-gray-700 underline mr-4"
        >
          返回 Admin Dashboard
        </button>
        <button
          onClick={() => navigate("/backend/dashboard")}
          className="text-gray-500 hover:text-gray-700 underline"
        >
          返回 Dashboard
        </button>
      </div>
    </div>
  );
};

export default DevUserSwitcher;
