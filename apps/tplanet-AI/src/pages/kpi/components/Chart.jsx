// src/pages/kpi/components/Chart.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { fetchSdgsProjects } from "../../../utils/KpiApi";
import { useTranslation } from "react-i18next";
import i18n from "../../../utils/i18n.jsx";
import { useHosters } from "../../../utils/multi-tenant";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// SDGs 官方色彩配置
const SDG_COLORS = {
  'SDG-1': '#E5243B',   // 消除貧窮
  'SDG-2': '#DDA63A',   // 消除飢餓
  'SDG-3': '#4C9F38',   // 良好健康與福祉
  'SDG-4': '#C5192D',   // 優質教育
  'SDG-5': '#FF3A21',   // 性別平等
  'SDG-6': '#26BDE2',   // 潔淨水與衛生
  'SDG-7': '#FCC30B',   // 可負擔的潔淨能源
  'SDG-8': '#A21942',   // 尊嚴勞動與經濟發展
  'SDG-9': '#FD6925',   // 工業創新基礎建設
  'SDG-10': '#DD1367',  // 減少不平等
  'SDG-11': '#FD9D24',  // 永續城市與社區
  'SDG-12': '#BF8B2E',  // 責任消費與生產
  'SDG-13': '#3F7E44',  // 氣候行動
  'SDG-14': '#0A97D9',  // 水下生物
  'SDG-15': '#56C02B',  // 陸域生物
  'SDG-16': '#00689D',  // 和平正義與健全制度
  'SDG-17': '#19486A',  // 多元夥伴關係
};

// 自訂插件：在最高值的柱狀上添加「卓越永續指標」標注
const excellencePlugin = {
  id: "excellenceLabel",
  afterDatasetsDraw: (chart) => {
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    if (!meta.data || meta.data.length === 0) return;

    const data = chart.data.datasets[0].data;
    const maxValue = Math.max(...data);
    const maxIndex = data.indexOf(maxValue);
    
    if (maxValue === 0) return; // 沒有數據時不顯示

    const bar = meta.data[maxIndex];
    const x = bar.x;
    const y = bar.y - 30;

    // 設置文字樣式
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2E8B57';
    ctx.font = 'bold 14px Arial';
    
    // 繪製背景框
    const text = i18n.t("sdgsChart.badgeExcellence");
    const textWidth = ctx.measureText(text).width;
    const padding = 8;
    
    ctx.fillStyle = 'rgba(46, 139, 87, 0.1)';
    ctx.fillRect(x - textWidth/2 - padding, y - 12, textWidth + padding*2, 24);
    
    ctx.strokeStyle = '#2E8B57';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - textWidth/2 - padding, y - 12, textWidth + padding*2, 24);
    
    // 繪製文字
    ctx.fillStyle = '#2E8B57';
    ctx.fillText(text, x, y);
    
    ctx.restore();
  },
};

const createChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 60,
      bottom: 20,
      left: 20,
      right: 20,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { 
        precision: 0,
        font: {
          size: 12,
          weight: 'normal',
        },
        color: '#666',
      },
      grid: { 
        display: true,
        color: 'rgba(0,0,0,0.05)',
        drawBorder: false,
      },
      border: {
        display: false,
      },
    },
    x: {
      title: {
        display: true,
        text: i18n.t("sdgsChart.chartTitle"),
        font: { 
          size: 16, 
          weight: "bold",
          family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        },
        color: '#333',
        padding: { top: 20 },
      },
      ticks: {
        font: {
          size: 11,
          weight: '500',
        },
        color: '#666',
        maxRotation: 45,
        minRotation: 0,
      },
      grid: { 
        display: false,
        drawBorder: false,
      },
      border: {
        display: false,
      },
    },
  },
  plugins: {
    legend: { 
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        title: function(tooltipItems) {
          return tooltipItems[0].label;
        },
        label: function(context) {
          return `${i18n.t("kpi.projectCount")}: ${context.parsed.y} ${i18n.t("kpi.item")}`;
        },
      },
    },
  },
  elements: { 
    bar: { 
      borderRadius: {
        topLeft: 6,
        topRight: 6,
        bottomLeft: 0,
        bottomRight: 0,
      },
      borderSkipped: false,
    },
  },
  animation: {
    duration: 1500,
    easing: 'easeInOutQuart',
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
});

const SDGsChart = () => {
  const [sdgsMap, setSdgsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();
  const siteHosters = useHosters();

  // ✅ 多帳號設定 - 使用 hosters[1:] (會員) 的資料（穩定引用）
  const hosters = useMemo(() => {
    return siteHosters.length > 1 ? siteHosters.slice(1) : siteHosters;
  }, [siteHosters]);

  // 追蹤已載入的 hosters key
  const loadedKeyRef = useRef('');
  const hostersKey = useMemo(() => JSON.stringify(hosters), [hosters]);

  useEffect(() => {
  if (hosters.length === 0 || loadedKeyRef.current === hostersKey) return;
  loadedKeyRef.current = hostersKey;

  (async () => {
    try {
      // 🔸 1. 建立多帳號請求（並行）
      const requests = hosters.map((email) =>
        fetchSdgsProjects(email)
          .then((res) => res)
          .catch((err) => {
            console.error(`[SDG Chart] ${email} 請求失敗：`, err);
            return null;
          })
      );

      // 🔸 2. 等待所有完成
      const results = await Promise.all(requests);

      // 🔸 3. 彙總所有結果
      const totalCounts = Array(18).fill(0);
      results.forEach((data) => {
        if (!data) return;
        for (let i = 1; i <= 17; i++) {
          const key = `SDG-${i}`;
          totalCounts[i] += Number(data?.[key] ?? 0);
        }
      });

      // 🔸 4. 轉成物件形式
      const filled = {};
      for (let i = 1; i <= 17; i++) {
        const key = `SDG-${i}`;
        filled[key] = totalCounts[i];
      }

      setSdgsMap(filled);
    } catch (e) {
      console.error(e);
      setSdgsMap({});
    } finally {
      setLoading(false);
    }
  })();
}, [hostersKey, hosters]);


  // 依數字排序 SDG-1 ~ SDG-17
  const labels = Array.from({ length: 17 }, (_, i) => `SDG-${i + 1}`);
  const values = labels.map((k) => sdgsMap[k] ?? 0);
  const colors = labels.map((k) => SDG_COLORS[k]);

  const sdgsData = {
    labels,
    datasets: [
      {
        label: t("sdgsChart.datasetLabel"),
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color + '80'),
        borderWidth: 2,
        hoverBackgroundColor: colors.map(color => color + 'CC'),
        hoverBorderColor: colors,
        hoverBorderWidth: 3,
      },
    ],
  };

  return (
    <div className="py-5" style={{ backgroundColor: '#fafbfc' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-12">
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-3" style={{ 
                color: '#2c3e50',
                fontSize: '2rem',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}>
                {t("sdgsChart.title")}
              </h2>
              <p className="text-muted fs-5">
                {t("sdgsChart.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="row mt-4 justify-content-center">
          <div className="col-md-12">
            <div 
              className="bg-white shadow-sm rounded-4 p-4"
              style={{ 
                minHeight: '500px',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {loading ? (
                <div className="d-flex align-items-center justify-content-center h-100 py-5">
                  <div className="spinner-border text-primary me-3" role="status">
                    <span className="visually-hidden">{t("sdgsChart.loading")}</span>
                  </div>
                  <span className="fs-5 text-muted">{t("sdgsChart.loadingData")}</span>
                </div>
              ) : (
                <div style={{ height: '450px' }}>
                  <Bar 
                    options={createChartOptions()} 
                    data={sdgsData} 
                    plugins={[excellencePlugin]} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default SDGsChart;