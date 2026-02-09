import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  getSroiEvidenceIdentifiers,
  getSroiEvidence,
} from "../../../utils/SROI.jsx";

const CATEGORY_MAP = {
  SOCIAL: "社會",
  ECONOMY: "經濟",
  ENVIRONMENT: "環境",
};

const SroiEvidence = () => {
  const { id } = useParams();
  const [data, setData] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const objProject = await getSroiEvidenceIdentifiers(id);
        const objEvidence = await getSroiEvidence(id);
        setData(objProject);
        if (objEvidence.status === "OK" && Array.isArray(objEvidence.content)) {
          const initialInputs = {};
          objEvidence.content.forEach((item) => {
            initialInputs[item.id] = item.reference;
          });
          setInputs(initialInputs);
        }
      } catch (err) {
        console.error("Error loading SROI meta:", err);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (item, value) => {
    setInputs((prev) => ({
      ...prev,
      [item.id + item.name]: value,
    }));
  };

  const handleSave = () => {
    const sroi_evidences = Object.keys(inputs).map((id) => ({
      id,
      reference: inputs[id],
    }));

    const requestData = {
      uuid_project: id,
      sroi_evidences,
    };

    fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/set_sroi_evidences`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      }
    )
      .then((res) => res.json())
      .then(() => {
        alert("儲存成功");
        window.location.href = `/backend/cms_sroi/${id}`;
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="container my-5">
      <div className="mt-4">
        <p className="bg-[#317EE0] py-2 text-white pl-6">佐證資料提示</p>

        <div className="relative bg-gray-100">
          <div
            className={`content px-2 overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? "max-h-[1000px]" : "max-h-[200px]"
            }`}
          >
            <ol className="list-decimal">
              <li>
                社會面向
                <ul className="list-disc">
                  <li>S1：成就感（滿意度調查）</li>
                  <li>
                    S2：文化意識（文化、美感、質感方面課程重度參與人員參加證明或簽到表）
                  </li>
                  <li>S3：生理健康（健保快譯通掛號次數）</li>
                  <li>S4：技能水平（前後次薪資單）</li>
                  <li>
                    S5：凝聚力（普通常態性活動重度參與人員參加證明或簽到表）
                  </li>
                  <li>
                    S6：道德知識（品格、學術知識、專業技能活動重度參與人員參加證明或簽到表）
                  </li>
                </ul>
              </li>

              <li>
                環境面向
                <ul className="list-disc">
                  <li>
                    E1：生物多樣性 e11 水質（前後樹種採買價格+水質檢測報告）
                  </li>
                  <li>
                    E1：生物多樣性 e12
                    營收（該地產品定價相關行銷文案+水質監測報告）
                  </li>
                  <li>
                    E2：土地有機化 e21 空氣（農地土地證明+土地更改相關資料）
                  </li>
                  <li>
                    E2：土地有機化 e22
                    水土（農地土地面積+農業用水帳單+友善種植使用肥料紀錄+土地更改相關資料）
                  </li>
                  <li>
                    E2：土地有計畫 e23
                    有機（農地土地面積+有機認證+土地更改相關資料）
                  </li>
                  <li>E3：生物多樣性（作物購買單據）</li>
                  <li>E4：綠美化空間（401表或報稅資料）</li>
                  <li>
                    E5：減少碳排放 e51 交通（行程 Google
                    map，km/1人，因行程所減少的交通碳排放）
                  </li>
                  <li>
                    E5：減少碳排放 e52
                    文宣（文宣設計稿、掃描發放次數統計，因電子化所減少的紙張文宣製造碳排放，A4
                    紙：3.2kg/500張）
                  </li>
                  <li>
                    E5：減少碳排放 e53
                    餐具（課程/活動參與人數統計表+提供餐具照片佐證，一副筷子/湯匙：0.02kgCO2）
                  </li>
                  <li>E6：農廢棄物（廢棄物清運購買服務發票）</li>
                </ul>
              </li>

              <li>
                經濟面向
                <ul className="list-disc">
                  <li>E1：長期工作（聘用員工月薪薪資單）</li>
                  <li>E2：短期工作（聘用員工時數薪資）</li>
                  <li>E3：產品價值（標章認證通過證明+檢驗費用證明）</li>
                  <li>
                    E4：無形資產（無形資產課程售價或使用者認定售價調查報告）
                  </li>
                  <li>E5：專案政策（中央型計畫核定書與 KPI 說明）</li>
                  <li>E6：專案政策（地方型計畫核定書與 KPI 說明）</li>
                  <li>E7：外界資源（401表或贊助匯款證明）</li>
                  <li>E8：媒體報導（媒體連結或紙本媒體刊登處掃描）</li>
                </ul>
              </li>
            </ol>
          </div>

          {/* 漸層遮罩 - 放在 content 的同級 */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-20 pointer-events-none transition-opacity duration-300 ${
              expanded ? "opacity-0" : "opacity-100"
            }`}
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(243, 244, 246, 0.8) 50%, rgb(243, 244, 246) 100%)",
            }}
          />
        </div>

        <div className="text-center">
          <button
            className="bg-[#317EE0] p-2 text-white rounded"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "隱藏" : "顯示更多"}
          </button>
        </div>
      </div>

      <div className="col-12 mt-4">
        {!data || Object.keys(data).length === 0 ? (
          <p className="text-center text-gray-500 py-6">首次載入可能需要較長時間，請耐心等待</p>
        ) : (
          Object.keys(data).map((categoryKey) => (
            <div key={categoryKey} className="mb-4">
              <p className="bg-[#317EE0] py-2 text-white pl-6">
                {CATEGORY_MAP[categoryKey]}面向{" "}
                <span className="text-white">
                  （請將資料上傳雲端，並提供可檢視連結）
                </span>
              </p>
              <div className="py-4">
                <ul>
                  {data[categoryKey].map((item) => (
                    <div
                      key={item.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <li className="mr-5">
                        {item.id} {item.name}{" "}
                      </li>
                      <input
                        className="form-control w-50 my-2"
                        type="text"
                        placeholder="請填入可檢視雲端連結"
                        value={inputs[item.id + item.name] || ""}
                        onChange={(e) => handleChange(item, e.target.value)}
                      />
                    </div>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center">
        <a className="btn btn-dark mb-3" href={`/backend/cms_sroi/${id}`}>
          返回
        </a>
        <button className="btn btn-dark mb-3 mx-3" onClick={handleSave}>
          儲存
        </button>
      </div>
    </div>
  );
};

export default SroiEvidence;
