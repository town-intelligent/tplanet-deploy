// src/pages/backend/modules/PlanningModule.jsx
import { useState, useEffect, useRef } from "react";
import SdgSelect from "../components/SdgSelect";
import ChatModule from "./ChatModule";
import { list_plans, plan_info } from "../../../utils/Plan";
import { useAISecretary } from "../contexts/AISecretaryContext";
import { FAQ_ITEMS } from "../../../utils/Config";
import { useHosters } from "../../../utils/multi-tenant";
import { useTranslation } from "react-i18next";

export default function PlanningModule({ onConfirm, onSend }) {
  const [selectedPlan, setSelectedPlan] = useState(null); // { uuid, name }
  const [planList, setPlanList] = useState([]);
  const [displayedCount, setDisplayedCount] = useState(10); // 顯示的計劃數量
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState([]);
  const [prefillText, setPrefillText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const dropdownRef = useRef(null);
  const planDropdownRef = useRef(null);
  const { t } = useTranslation();
  const siteHosters = useHosters();

  // 載入計劃列表 - 從 hosters[1:] 所有 email 載入
  useEffect(() => {
    if (siteHosters.length === 0) return;

    async function loadPlans() {
      setLoadingPlans(true);
      try {
        const emails = siteHosters.slice(1); // 取得從索引 1 開始的所有 email
        const allPlans = [];

        for (const email of emails) {
          try {
            const response = await list_plans(email);
            const uuids = response?.projects || [];

            if (uuids.length > 0) {
              // 對每個 UUID 呼叫 plan_info 獲取完整資訊
              for (const uuid of uuids) {
                try {
                  const planDetails = await plan_info(uuid);
                  if (planDetails && planDetails.name) {
                    allPlans.push(planDetails);
                  }
                } catch (error) {
                  console.error(`獲取計劃 ${uuid} 的詳細資訊失敗:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`載入 ${email} 的計劃列表失敗:`, error);
          }
        }

        setPlanList(allPlans);
      } catch (error) {
        console.error("載入計劃列表失敗:", error);
        setPlanList([]);
      } finally {
        setLoadingPlans(false);
      }
    }

    loadPlans();
  }, [siteHosters]); // 當 hosters 載入後再載入計劃

  const handleFaqClick = async (faqItem) => {
    // 如果是專案媒合，隨機選擇兩個專案
    if (faqItem.isProjectMatch && planList.length >= 2) {
      // 隨機選擇兩個不同的專案
      const shuffled = [...planList].sort(() => 0.5 - Math.random());
      const project1 = shuffled[0];
      const project2 = shuffled[1];

      // 獲取兩個專案的詳細資訊
      try {
        const [details1, details2] = await Promise.all([
          plan_info(project1.uuid),
          plan_info(project2.uuid)
        ]);

        // 構建媒合提示
        const matchPrompt = `請根據以下兩個專案進行媒合分析，並提出一個創新的合作提案：

【專案一：${details1.name}】
執行期間：${details1.period || "未提供"}
預算：${details1.budget ? `NT$ ${details1.budget.toLocaleString()}` : "未揭露"}
主辦單位：${details1.hoster || "未提供"}
計劃理念：${details1.philosophy ? details1.philosophy.replace(/<[^>]*>/g, '') : "未提供"}

【專案二：${details2.name}】
執行期間：${details2.period || "未提供"}
預算：${details2.budget ? `NT$ ${details2.budget.toLocaleString()}` : "未揭露"}
主辦單位：${details2.hoster || "未提供"}
計劃理念：${details2.philosophy ? details2.philosophy.replace(/<[^>]*>/g, '') : "未提供"}

請分析這兩個專案的互補性，並提出具體的合作方案，包括：
1. 兩個專案的共同目標和互補優勢
2. 具體的合作模式和執行方式
3. 預期的綜效和社會影響力
4. 可能面臨的挑戰及解決方案`;

        setPrefillText(matchPrompt);
        setSelectedFaq(faqItem);
      } catch (error) {
        console.error("獲取專案資訊失敗:", error);
        alert(t("aiSecretary.fetch_plan_error"));
        return;
      }
    } else if (faqItem.isProjectMatch) {
      alert(t("aiSecretary.need_two_projects"));
      return;
    } else {
      setPrefillText(faqItem.prompt);
      setSelectedFaq(faqItem);
    }

    setIsDropdownOpen(false);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan({ uuid: plan.uuid, name: plan.name });
    setIsPlanDropdownOpen(false);
  };

  // 點擊外部關閉 FAQ dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 點擊外部關閉計劃 dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target)) {
        setIsPlanDropdownOpen(false);
      }
    };

    if (isPlanDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPlanDropdownOpen]);

  return (
    <div className="flex h-full">
      <div className="w-[400px] bg-gray-50 flex flex-col">
        <div className="flex-1 pt-4 overflow-auto">
          <div className="text-left w-5/6 mx-auto space-y-3">
            <p className="text-lg font-semibold text-[#317EE0] mb-2">{t("aiSecretary.planning")}</p>

            <div className="relative" ref={planDropdownRef}>
              <label className="text-md font-bold">{t("aiSecretary.planName")}</label>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => !loadingPlans && setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                  disabled={loadingPlans}
                  className={`flex-1 text-left border rounded-lg px-3 py-2 flex justify-between items-center ${
                    loadingPlans
                      ? "bg-gray-100 cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }`}
                >
                  {loadingPlans ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-4 bg-gray-300 rounded animate-pulse flex-1"></div>
                      <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-700">
                        {selectedPlan ? selectedPlan.name : t("aiSecretary.selectPlan")}
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${isPlanDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                {selectedPlan && !loadingPlans && (
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    title={t("aiSecretary.clearSelection")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {isPlanDropdownOpen && !loadingPlans && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {planList.length > 0 ? (
                    <>
                      {planList.slice(0, displayedCount).map((plan, index) => (
                        <button
                          key={`${plan.uuid}-${index}`}
                          onClick={() => handlePlanSelect(plan)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 first:rounded-t-lg transition-colors"
                        >
                          <span className="text-sm text-gray-800">{plan.name}</span>
                        </button>
                      ))}
                      {planList.length > displayedCount && (
                        <button
                          onClick={() => setDisplayedCount(prev => prev + 10)}
                          className="w-full text-center px-3 py-2 text-blue-600 hover:bg-blue-50 border-t last:rounded-b-lg transition-colors"
                        >
                          {t("aiSecretary.load_more")}... ({planList.length - displayedCount} {t("aiSecretary.remaining")})
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">{t("aiSecretary.no_plans")}</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-md font-bold">{t("aiSecretary.sdg")}</p>
              {selectedFaq ? (
                <div className="border rounded-lg px-3 py-2 bg-gray-100 text-gray-400 cursor-not-allowed">
                  {t("aiSecretary.faqMode")}
                </div>
              ) : (
                <SdgSelect selectedSDGs={selectedSDGs} setSelectedSDGs={setSelectedSDGs} />
              )}
            </div>

            {/* FAQ Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <p className="text-md font-bold mb-2">{t("aiSecretary.faq")}</p>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => !selectedSDGs.length && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={selectedSDGs.length > 0}
                  className={`flex-1 text-left border rounded-lg px-3 py-2 flex justify-between items-center ${
                    selectedSDGs.length > 0
                      ? "bg-gray-100 cursor-not-allowed text-gray-400"
                      : "bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }`}
                >
                  <span className={selectedSDGs.length > 0 ? "text-gray-400" : "text-gray-700"}>
                    {selectedSDGs.length > 0
                      ? t("aiSecretary.sdgMode")
                      : selectedFaq
                        ? selectedFaq.label
                        : t("aiSecretary.selectFaq")}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""} ${
                      selectedSDGs.length > 0 ? "text-gray-400" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {selectedFaq && (
                  <button
                    onClick={() => setSelectedFaq(null)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    title={t("aiSecretary.clearSelection")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {isDropdownOpen && !selectedSDGs.length && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                  {FAQ_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleFaqClick(item)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                    >
                      <span className="text-sm text-gray-800">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto h-full">
        <ChatModule
          onConfirm={onConfirm}
          onSend={(userInput, clearInput) => {
            setPrefillText("");
            onSend(userInput, clearInput, {
              plan: selectedPlan?.name || "",
              planUuid: selectedPlan?.uuid || "",
              selectedSDGs,
              selectedFaq,
            });
          }}
          prefillText={prefillText}
        />
      </div>
    </div>
  );
}
