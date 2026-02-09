// src/pages/backend/Dashboard.jsx
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
import NewList from "../../assets/new_list.svg";
import AddIcon from "../../assets/add.svg";

import Logout from "../../assets/logout.svg";
import Manage from "../../assets/manage.svg";
import AccountManage from "../../assets/account.svg";
import { logout } from "../../utils/Accounts";
import { fetchSdgsProjects } from "../../utils/KpiApi";
import { useHosters, useAccessLevel } from "../../utils/multi-tenant";
import { useTranslation } from "react-i18next";

// Register chart.js plugins
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

// 只保留 SDG-1~17
function keepOnlySDG1to17(chartData) {
  if (!chartData || !Array.isArray(chartData.labels)) return chartData;
  const limitedLabels = (chartData.labels || []).slice(0, 17);
  const limitedDatasets = (chartData.datasets || []).map((ds) => ({
    ...ds,
    data: (ds.data || []).slice(0, 17),
  }));
  return { labels: limitedLabels, datasets: limitedDatasets };
}

// 繪圖插件
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

const Dashboard = () => {
  const [lineChartData, setLineChartData] = useState(null);
  const [totalProjectWeight, setTotalProjectWeight] = useState({});
  const [isAdmin] = useState(false);
  const { t } = useTranslation();
  const siteHosters = useHosters();
  const { isSuperuser } = useAccessLevel();
  const hasFetchedPie = useRef(false);
  const hasFetchedLine = useRef(false);

  // ✅ 多帳號設定 - 使用 hosters[1:] (會員) 的資料（穩定引用）
  const hosters = useMemo(() => {
    return siteHosters.length > 1 ? siteHosters.slice(1) : siteHosters;
  }, [siteHosters]);

  // ✅ 多帳號 SDGs 總量
  useEffect(() => {
    if (hosters.length === 0 || hasFetchedPie.current) return;
    hasFetchedPie.current = true;

    (async () => {
      try {
        const currentYear = new Date().getFullYear();

        const requests = hosters.map((email) =>
          fetchSdgsProjects(email, currentYear)
            .then((res) => res)
            .catch((err) => {
              console.error(`[Admin Dashboard] ${email} SDGs 請求失敗：`, err);
              return null;
            })
        );

        const results = await Promise.all(requests);
        const totals = {};
        results.forEach((data) => {
          if (!data) return;
          Object.entries(data).forEach(([key, val]) => {
            if (!totals[key]) totals[key] = 0;
            totals[key] += Number(val ?? 0);
          });
        });

        setTotalProjectWeight(totals);
      } catch (error) {
        console.error("Error fetching project weights:", error);
        setTotalProjectWeight({});
      }
    })();
  }, [hosters]);

  // ✅ 多帳號 relational 折線圖
  useEffect(() => {
    if (hosters.length === 0 || hasFetchedLine.current) return;
    hasFetchedLine.current = true;

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
              console.error(`[Admin Dashboard] ${email} relational 請求失敗：`, err);
              return null;
            })
        );

        const results = await Promise.all(requests);
        const combined = { labels: [], datasets: [] };

        results.forEach((data) => {
          if (!data?.content) return;
          const content = data.content;

          // 初始化 labels
          if (!combined.labels.length && Array.isArray(content.labels)) {
            combined.labels = content.labels.slice(0, 17);
          }

          (content.datasets || []).forEach((ds) => {
            const existing = combined.datasets.find((d) => d.label === ds.label);
            if (existing) {
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

        setLineChartData(keepOnlySDG1to17(combined));
      } catch (error) {
        console.error("Error fetching line data:", error);
      }
    };

    fetchLineChartData();
  }, [hosters]);

  // ======== 圓餅圖處理 ========
  const sdgsWeights = Object.fromEntries(
    Object.entries(totalProjectWeight).filter(([key]) => {
      if (!key || typeof key !== "string") return false;
      const m = key.match(/^SDG-(\d{1,2})$/);
      const n = m ? Number(m[1]) : NaN;
      return Number.isFinite(n) && n >= 1 && n <= 17;
    })
  );

  const sortedSdgs = Object.entries(sdgsWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const top3PieChartData = {
    labels: sortedSdgs.map(([label]) => label),
    datasets: [
      {
        label: t("dashboard.labels.sdgs"),
        data: sortedSdgs.map(([, weight]) => weight),
        backgroundColor: ["#0A93F5", "#EA4335", "#FABC05"],
        borderWidth: 1,
      },
    ],
  };

  // ======== Chart Options ========
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: { radius: 2, hitRadius: 6, hoverRadius: 4 },
      line: { borderWidth: 2, tension: 0.25 },
    },
    scales: {
      x: {
        title: { display: true, text: t("dashboard.labels.indicator"), font: { size: 14, weight: "bold" } },
        ticks: { autoSkip: false },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: t("dashboard.labels.projectCount"), font: { size: 14, weight: "bold" } },
      },
    },
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: { enabled: true },
      datalabels: { display: false },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 50, bottom: 50, left: 100, right: 100 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      datalabels: { display: false },
    },
    clip: false,
  };

  // ======== Admin menu ========
  const menuItems = [
    { id: "profile", icon: Manage, title: t("dashboard.menu.home"), link: "/backend/admin_index", show: true },
    // 架站精靈只在 SuperuserDashboard 顯示
    // { id: "site-wizard", icon: AddIcon, title: t("dashboard.menu.siteWizard"), link: "/backend/tenant", show: isSuperuser },
    { id: "sustainable", icon: NewList, title: t("dashboard.menu.news"), link: "/backend/admin_news_list", show: true },
    { id: "logout", icon: AccountManage, title: t("dashboard.menu.account"), link: "/backend/account-list", show: true },
    { id: "ignut", icon: Logout, title: t("dashboard.menu.logout"), onClick: logout, show: true },
  ];

  return (
    <div className="container mx-auto">
      {/* 功能卡片 */}
      <div className="flex justify-center">
        <div className="w-5/6 md:block">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-10">
            {menuItems.map((item) =>
              item.show ? (
                item.onClick ? (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="block w-full bg-white text-black rounded-lg shadow-md hover:shadow-lg transition-shadow !no-underline"
                  >
                    <div className="flex justify-center items-center h-36">
                      <div className="text-center">
                        <img src={item.icon} alt="" className="w-12 h-12 mx-auto" />
                        <p className="mt-2 mb-0">{item.title}</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <a
                    key={item.id}
                    href={item.link}
                    className="block w-full bg-white text-black rounded-lg shadow-md hover:shadow-lg transition-shadow !no-underline"
                  >
                    <div className="flex justify-center items-center h-36">
                      <div className="text-center">
                        <img src={item.icon} alt="" className="w-12 h-12 mx-auto" />
                        <p className="mt-2 mb-0">{item.title}</p>
                      </div>
                    </div>
                  </a>
                )
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* 圖表列 */}
      <div className="flex flex-col md:flex-row gap-4 w-5/6 mx-auto">
        <div className="w-2/3 md:w-2/3 py-4 md:py-0">
          <p className="text-center text-lg font-bold mb-4">
            {t("dashboard.charts.lineTitle")}
          </p>
          <div className="h-64 flex items-center justify-center bg-white shadow py-2">
            {lineChartData && <Line data={lineChartData} options={lineOptions} className="w-full" />}
          </div>
        </div>

        <div className="w-full md:w-1/2 py-4 md:py-0">
          <p className="text-center text-lg font-bold mb-4">{t("dashboard.charts.pieTitle")}</p>
          <div className="h-64 flex items-center justify-center bg-white shadow py-2 w-full">
            {sortedSdgs.length > 0 && (
              <Pie data={top3PieChartData} options={pieOptions} plugins={[drawLinePlugin]} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;