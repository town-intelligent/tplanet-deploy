import { useState } from "react";
import { Button } from "react-bootstrap";
import { deleteAccount } from "../../utils/Accounts";
import { useTranslation } from "react-i18next";

export default function DeleteConfirmationDialog() {
  const [isCheck, setIsCheck] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleCancel = () => {
    window.location.replace("/backend/dashboard");
  };

  const handleDelete = async () => {
    if (!isCheck) {
      alert(t("adminDeleteAccount.ischeck"));
      return;
    }

    const email = localStorage.getItem("email");
    if (!email) {
      alert(t("adminDeleteAccount.noEmail"));
      return;
    }

    if (!window.confirm(t("adminDeleteAccount.checkDelete", { email }))) return;
    setLoading(true);
    const result = await deleteAccount(email);
    setLoading(false);

    if (result.success) {
      // 成功 → 顯示成功訊息並清空 localStorage
      localStorage.clear();
      setShowSuccessModal(true);
    } else {
      alert(`${t("adminDeleteAccount.delete_fail")}: ${result.message}`);
    }
  };

  return (
    <div className="h-full bg-gray-100 flex flex-col items-center justify-center pt-20">
      <div className="relative bg-[#317EE0] rounded-lg shadow-xl w-1/2 p-6">
        <p className="text-white text-2xl font-bold mb-6 text-center">
          {t("adminDeleteAccount.delete_message")}
        </p>

        <div className="bg-white rounded-md p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300"
                checked={isCheck}
                onChange={(e) => setIsCheck(e.target.checked)}
                aria-label="確認欄位"
              />
            </div>

            {/* 文字內容 */}
            <div className="text-gray-800 text-sm leading-relaxed">
              <p className="font-medium mb-1">
                {t("adminDeleteAccount.delete_message_2")}
                <br />
                {t("adminDeleteAccount.delete_massage_3")}
              </p>
            </div>
          </div>
        </div>

        {/* 按鈕區域 */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleCancel}
            className="px-8 py-2 bg-[#828282] hover:bg-gray-600 text-white rounded-full transition-colors font-medium"
            disabled={loading}
          >
            {t("edit.cancel")}
          </button>

          <button
            onClick={handleDelete}
            className="px-8 py-2 bg-[#BE0000] hover:bg-red-700 text-white rounded-full transition-colors font-medium"
            disabled={loading}
          >
            {loading ? t("adminDeleteAccount.deleting") : t("adminDeleteAccount.delete")}
          </button>
        </div>
      </div>

      {/* 成功 Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-4">
              ✅ {t("adminDeleteAccount.delete_success")}
            </p>
            <Button
              href="/backend/dashboard"
              className="bg-black text-white px-4 py-2 rounded-md"
              variant="dark"
            >
              {t("adminDeleteAccount.back_to_home")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}