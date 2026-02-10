import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

// 註冊 Chart.js 元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 主要組件
const SdgsChart = ({ chartData }) => {
  const { selectedSDGs, graphType } = chartData;

  // 模擬經費資料 - 使用小寫鍵值
  const mockBudgetData = {
    sdg1: { budget: 120000, name: "消除貧窮", color: "#E5243B" },
    sdg2: { budget: 98000, name: "消除飢餓", color: "#DDA63A" },
    sdg3: { budget: 250000, name: "良好健康與福祉", color: "#4C9F38" },
    sdg4: { budget: 320000, name: "優質教育", color: "#C5192D" },
    sdg5: { budget: 75000, name: "性別平等", color: "#FF3A21" },
    sdg6: { budget: 180000, name: "淨水與衛生", color: "#26BDE2" },
    sdg7: { budget: 220000, name: "可負擔的潔淨能源", color: "#FCC30B" },
    sdg8: { budget: 160000, name: "尊嚴勞動與經濟發展", color: "#A21942" },
    sdg9: { budget: 280000, name: "產業創新與基礎設施", color: "#FD6925" },
    sdg10: { budget: 90000, name: "減少不平等", color: "#DD1367" },
    sdg11: { budget: 210000, name: "永續城市與社區", color: "#FD9D24" },
    sdg12: {
      budget: 130000,
      name: "確保永續消費與生產模式",
      color: "#BF8B2E",
    },
    sdg13: { budget: 190000, name: "氣候行動", color: "#3F7E44" },
    sdg14: { budget: 110000, name: "保育海洋生態", color: "#0A97D9" },
    sdg15: { budget: 140000, name: "保育陸域生態", color: "#56C02B" },
    sdg16: { budget: 100000, name: "和平、正義與健全制度", color: "#00689D" },
    sdg17: { budget: 80000, name: "多元夥伴關係", color: "#19486A" },
  };

  const data = selectedSDGs.map((sdgId) => ({
    sdg: mockBudgetData[sdgId].name,
    budget: mockBudgetData[sdgId].budget,
    color: mockBudgetData[sdgId].color,
    sdgId: sdgId,
  }));

  const chartJsData = {
    labels: data.map((item) => item.sdgId),
    datasets: [
      {
        label: "投入經費",
        data: data.map((item) => item.budget),
        backgroundColor: data.map((item) => item.color),
      },
    ],
  };

  // 格式化數字為千位分隔符
  const formatCurrency = (value) => {
    return `NT$ ${value.toLocaleString()}`;
  };

  // 長條圖配置
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "永續發展指標投入經費分析",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "計畫專案件數",
        },
        ticks: {
          callback: function (value) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // 圓餅圖配置
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: "永續發展指標投入經費分佈",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce(
              (sum, value) => sum + value,
              0
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
          },
        },
      },
    },
  };

  //const chartData = generateChartData();

  // 如果沒有生成或沒有選擇SDG，顯示提示
  // if (!selectedSDGs.length) {
  //   return (
  //     <div className="p-6 max-w-7xl mx-auto bg-white">
  //       <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg mb-8">
  //         <div className="text-center py-16">
  //           <div className="text-6xl mb-4">📊</div>
  //           <p className="text-gray-500 text-xl">
  //             {selectedSDGs.length === 0
  //               ? "請至少選擇一個永續發展指標，然後按下生成按鈕來產生圖表"
  //               : "請按下生成按鈕來產生圖表"}
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 圖表顯示區域 */}
      <div className="rounded-lg shadow-lg mb-8">
        <div className="h-72">
          {graphType === "長條圖" ? (
            <Bar data={chartJsData} options={barOptions} />
          ) : (
            <Pie data={chartJsData} options={pieOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SdgsChart;
