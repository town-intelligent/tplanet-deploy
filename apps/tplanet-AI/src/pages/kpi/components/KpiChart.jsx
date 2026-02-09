// t-planet-cms-nantou-gov/src/pages/kpi/components/KpiChart.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Line, Pie } from "react-chartjs-2";
import { fetchSdgsProjects } from "../../../utils/KpiApi";
import { useHosters } from "../../../utils/multi-tenant";
import { useTranslation } from "react-i18next";

// Register the scales
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

const Dashboard = () => {
  const [lineChartData, setLineChartData] = useState(null);
  const [totalProjectWeight, setTotalProjectWeight] = useState({});
  const { t } = useTranslation();
  const siteHosters = useHosters();

  // ✅ 多帳號設定 - 使用 hosters[1:] (會員) 的資料（穩定引用）
  const hosters = useMemo(() => {
    return siteHosters.length > 1 ? siteHosters.slice(1) : siteHosters;
  }, [siteHosters]);

  // 追蹤已載入的 hosters key
  const loadedPieKeyRef = useRef('');
  const loadedLineKeyRef = useRef('');
  const hostersKey = useMemo(() => JSON.stringify(hosters), [hosters]);

  // ✅ 並行呼叫 fetchSdgsProjects，多帳號彙總
  useEffect(() => {
    if (hosters.length === 0 || loadedPieKeyRef.current === hostersKey) return;
    loadedPieKeyRef.current = hostersKey;

    (async () => {
      try {
        const requests = hosters.map((email) =>
          fetchSdgsProjects(email)
            .then((res) => res)
            .catch((err) => {
              console.error(`[KPI Pie] ${email} 請求失敗：`, err);
              return null;
            })
        );

        const results = await Promise.all(requests);
        const totals = {};

        // 累加每個帳號的 SDG 權重
        results.forEach((data) => {
          if (!data) return;
          Object.entries(data).forEach(([key, val]) => {
            if (!totals[key]) totals[key] = 0;
            totals[key] += Number(val ?? 0);
          });
        });

        setTotalProjectWeight(totals);
      } catch (e) {
        console.error("多帳號 SDGs 彙總失敗：", e);
        setTotalProjectWeight({});
      }
    })();
  }, [hostersKey, hosters]);

  // 篩選 SDG 權重（僅 SDG-1 ~ SDG-17）
  const sdgsWeights = Object.fromEntries(
    Object.entries(totalProjectWeight).filter(([key]) => {
      const match = key.match(/\d+/);
      const num = match ? parseInt(match[0]) : NaN;
      return num >= 1 && num <= 17;
    })
  );

  const pieChartData = {
    labels: Object.keys(sdgsWeights),
    datasets: [
      {
        label: t("sdgsChart.sdgs"),
        data: Object.values(sdgsWeights),
        backgroundColor: [
          "#0A93F5",
          "#EA4335",
          "#FABC05",
          "#33A852",
          "#FE6D01",
          "#46BDC6",
          "#7BAAF7",
        ],
        borderWidth: 1,
      },
    ],
  };

  // ✅ 並行呼叫多帳號 relational API
  useEffect(() => {
    if (hosters.length === 0 || loadedLineKeyRef.current === hostersKey) return;
    loadedLineKeyRef.current = hostersKey;

    const fetchLineChartData = async () => {
      try {
        const requests = hosters.map((email) =>
          fetch(`${import.meta.env.VITE_HOST_URL_TPLANET}/api/dashboard/relational`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch((err) => {
              console.error(`[Relational] ${email} 請求失敗：`, err);
              return null;
            })
        );

        const results = await Promise.all(requests);

        // 彙總處理
        const combined = {
          labels: [],
          datasets: [],
        };

        results.forEach((data) => {
          if (!data?.content) return;
          const content = data.content;
          if (!combined.labels.length && Array.isArray(content.labels)) {
            combined.labels = content.labels.slice(0, 17);
          }

          (content.datasets || []).forEach((ds) => {
            const existing = combined.datasets.find((d) => d.label === ds.label);
            if (existing) {
              // 累加資料
              existing.data = existing.data.map(
                (v, i) => v + (Number(ds.data?.[i] ?? 0))
              );
            } else {
              combined.datasets.push({
                ...ds,
                data: (ds.data || []).slice(0, 17).map(Number),
              });
            }
          });
        });

        // 顏色與排序（動態產生當前年度往前三年）
        const currentYear = new Date().getFullYear();
        const colors = ["#0A93F5", "#EA4335", "#FABC05"];
        const colorMap = Object.fromEntries(
          Array.from({ length: 3 }, (_, i) => [`${currentYear - i}年`, colors[i]])
        );
        const sortedDatasets = combined.datasets
          .filter((ds) => ds.label && ds.label.includes("年"))
          .sort((a, b) => b.label.localeCompare(a.label))
          .map((ds) => ({
            ...ds,
            borderColor: colorMap[ds.label] || "#ccc",
            backgroundColor: colorMap[ds.label] || "#ccc",
            fill: false,
            tension: 0.3,
          }));

        setLineChartData({
          labels: combined.labels.slice(0, 17),
          datasets: sortedDatasets,
        });
      } catch (error) {
        console.error("Error fetching relational data:", error);
      }
    };

    fetchLineChartData();
  }, [hostersKey, hosters]);

  const lineOptions = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: t("map.axisIndicator"),
          font: { size: 14, weight: "bold" },
        },
        ticks: { autoSkip: false },
      },
      y: {
        title: {
          display: true,
          text: t("map.axisProjectCount"),
          font: { size: 14, weight: "bold" },
        },
      },
    },
    plugins: { datalabels: { display: false } },
  };

  const drawLinePlugin = {
    id: "drawLinePlugin",
    afterDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      const dataset = chart.data.datasets[0];
      if (!dataset) return;
      const total = dataset.data.reduce((sum, v) => sum + v, 0);
      let leftLabels = [];
      let rightLabels = [];

      meta.data.forEach((element, index) => {
        const { x, y } = element.tooltipPosition();
        const label = chart.data.labels[index];
        const value = dataset.data[index];
        if (value === 0) return;

        const percent = ((value / total) * 100).toFixed(1);
        const angle =
          element.startAngle + (element.endAngle - element.startAngle) / 2;

        const lineLength = 60;
        const extraLine = 30;
        const lineX = x + Math.cos(angle) * lineLength;
        let lineY = y + Math.sin(angle) * lineLength;
        let textX = lineX + (Math.cos(angle) > 0 ? extraLine : -extraLine);
        let textAlign = Math.cos(angle) > 0 ? "left" : "right";

        const usedArray = Math.cos(angle) > 0 ? rightLabels : leftLabels;
        let spacing = 16;
        usedArray.forEach((usedY) => {
          if (Math.abs(lineY - usedY) < spacing) lineY = usedY + spacing;
        });
        usedArray.push(lineY);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(lineX, lineY);
        ctx.lineTo(textX, lineY);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = "#333";
        ctx.textAlign = textAlign;
        ctx.textBaseline = "middle";
        ctx.fillText(`${label}: ${percent}%`, textX, lineY);
      });
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 50, bottom: 50, left: 100, right: 100 } },
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
    },
    clip: false,
  };

  return (
    <div className="">
      <div className="flex flex-col md:flex-row gap-4 w-5/6 mx-auto">
        <div className="w-2/3 md:w-1/2 py-4 md:py-0">
          <p className="text-center text-lg font-bold mb-4">
            {t("map.lineTitle")}
          </p>
          <div className="h-64 flex items-center justify-center bg-white shadow py-2">
            {lineChartData && (
              <Line data={lineChartData} options={lineOptions} className="w-full" />
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 py-4 md:py-0">
          <p className="text-center text-lg font-bold mb-4">
            {t("map.pieTitle")}
          </p>
          <div className="h-64 flex items-center justify-center bg-white shadow py-2 w-full">
            {pieChartData && (
              <Pie
                data={pieChartData}
                options={pieOptions}
                plugins={[drawLinePlugin]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;