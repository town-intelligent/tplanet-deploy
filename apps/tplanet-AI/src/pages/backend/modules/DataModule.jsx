// src/pages/backend/modules/DataModule.jsx
import { useState } from "react";
import Form from "react-bootstrap/Form";
import SdgSelect from "../components/SdgSelect";
import ChatModule from "./ChatModule";
import { useAISecretary } from "../contexts/AISecretaryContext";
import { useTranslation } from "react-i18next";
import { useDistricts } from "../../../utils/multi-tenant";

export default function DataModule({ onConfirm, onSend }) {
  const { setMessages, nowStr } = useAISecretary();
  const [year, setYear] = useState("");
  const [district, setDistrict] = useState("");
  const [graphType, setGraphType] = useState("長條圖");
  const [selectedSDGs, setSelectedSDGs] = useState([]);
  const [showError, setShowError] = useState(false);
  const { t } = useTranslation();
  const districts = useDistricts();

  const handleGenerate = () => {
    if ((selectedSDGs || []).length === 0) {
      setShowError(true);
      return;
    }
    setShowError(false);

    const id = String(Date.now());
    const chartMessage = {
      id,
      sender: "ai",
      type: "chart",
      text: "以下是您選擇的圖表：",
      confirmed: false,
      chartData: { year, district, selectedSDGs, graphType },
      time: nowStr(),
    };
    setMessages((prev) => [...prev, chartMessage]);
  };

  return (
    <div className="flex h-full">
      <div className="w-[400px] bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex-1 pt-4 overflow-auto">
          <div className="text-left w-5/6 mx-auto space-y-3">
            <p className="text-lg font-semibold text-[#317EE0] mb-2">{t("aiSecretary.data")}</p>

            <div>
              <label className="text-md font-bold">{t("aiSecretary.year")}</label>
              <Form.Select
                aria-label={t("aiSecretary.selectYear")}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">{t("aiSecretary.selectYear")}</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return (
                    <option key={y} value={y}>
                      {y} {t("aiSecretary.yearUnit")}
                    </option>
                  );
                })}
              </Form.Select>
            </div>

            <div>
              <label className="text-md font-bold">{t("aiSecretary.district")}</label>
              <Form.Select
                aria-label={t("aiSecretary.selectDistrict")}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">{t("aiSecretary.selectDistrict")}</option>
                {districts.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Form.Select>
            </div>

            <div>
              <label className="text-md font-bold">{t("aiSecretary.sdg")}</label>
              <SdgSelect selectedSDGs={selectedSDGs} setSelectedSDGs={setSelectedSDGs} />
            </div>

            <div>
              <label className="text-md font-bold">{t("aiSecretary.graphType")}</label>
              <Form.Select
                aria-label={t("aiSecretary.selectGraphType")}
                value={graphType}
                onChange={(e) => setGraphType(e.target.value)}
              >
                <option value="長條圖">{t("aiSecretary.barChart")}</option>
                <option value="圓餅圖">{t("aiSecretary.pieChart")}</option>
                <option value="折線圖">{t("aiSecretary.lineChart")}</option>
              </Form.Select>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="w-5/6 mx-auto flex flex-col items-center">
            {showError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {t("aiSecretary.selectOne")}
              </div>
            )}
            <button
              className="bg-black rounded w-[100px] p-2 text-white hover:bg-gray-800 transition-colors"
              onClick={handleGenerate}
            >
              {t("aiSecretary.generate")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto h-full">
        <ChatModule onConfirm={onConfirm} onSend={onSend} />
      </div>
    </div>
  );
}
