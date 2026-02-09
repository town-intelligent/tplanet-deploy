import { useMemo, useEffect, useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Tooltip, 
  Legend, 
  Title
);

// 讓每個 id 產生穩定的數值（非隨機）
function seededValue(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 8000 + (h % 100000); // 8,000 ~ 108,000
}

const PALETTE = [
  "#e5243b", "#DDA63A", "#4C9F38", "#C5192D", "#FF3A21",
  "#26BDE2", "#FCC30B", "#A21942", "#FD6925", "#DD1367",
  "#FD9D24", "#BF8B2E", "#3F7E44", "#0A97D9", "#56C02B",
  "#00689D", "#19486A",
];

export default function SimpleChart({ chartData }) {
  const { 
    graphType = "圓餅圖", 
    selectedSDGs = [],
    year = String(new Date().getFullYear()),
    district = ""
  } = chartData || {};

  const [budgetValues, setBudgetValues] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 當 chartData 改變時，呼叫 API
  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!selectedSDGs || selectedSDGs.length === 0) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 使用 Vite 環境變數
        const apiUrl = import.meta.env.VITE_HOST_URL_TPLANET || 'https://beta-tplanet-backend.ntsdgs.tw';
        
        const response = await fetch(`${apiUrl}/api/dashboard/sdgssimplaechard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year: year || "2025",
            district: district || "",
            sdgs: selectedSDGs
          })
        });

        const result = await response.json();
        
        if (result.success && result.data.budgetValues) {
          setBudgetValues(result.data.budgetValues);
          console.log('成功獲取預算數據:', result.data);
        } else {
          console.log('API 返回空數據，使用預設值');
          setBudgetValues(null);
        }
      } catch (err) {
        console.error('獲取預算數據失敗:', err);
        setError(err.message);
        setBudgetValues(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetData();
  }, [selectedSDGs, year, district]); // 當這些值改變時重新獲取

  const data = useMemo(() => {
    const labels = selectedSDGs.length
      ? selectedSDGs.map((id) => id) // 顯示 id（如 sdg1、sdg2）
      : ["sdg1", "sdg2"];

    // 判斷是否有真實數據
    let values;
    if (budgetValues && budgetValues.length > 0) {
      // 使用真實數據
      values = labels.map(label => {
        const item = budgetValues.find(bv => bv.id === label);
        return item ? item.value : 0;
      });
      console.log('使用真實數據:', values);
    } else {
      // 沒有真實數據時使用 seededValue
      values = labels.map(seededValue);
      console.log('使用預設數據:', values);
    }
    
    const colors = PALETTE.slice(0, labels.length);

    return {
      labels,
      datasets: [{ 
        data: values, 
        backgroundColor: colors, 
        borderColor: colors, // 折線圖需要 borderColor
        borderWidth: graphType === "折線圖" ? 2 : 1,
        label: "預算 (NT$)",
        tension: 0.4, // 折線圖的曲線平滑度
        fill: graphType === "折線圖" ? false : true, // 折線圖不填充
        pointRadius: graphType === "折線圖" ? 5 : 0, // 折線圖顯示點
        pointHoverRadius: graphType === "折線圖" ? 7 : 0
      }],
    };
  }, [selectedSDGs, budgetValues]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" },
      title: { 
        display: true, 
        text: isLoading ? "載入中..." : "永續發展指標投入量分佈" 
      },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          let value;
          
          // 根據圖表類型取得正確的數值
          if (graphType === "圓餅圖") {
            value = context.parsed;
          } else {
            // 長條圖和折線圖
            value = context.parsed.y;
          }
          
          // 格式化金額顯示
          return `${label}: NT$ ${value.toLocaleString()}`;
        }
      }
    }
    },
    // 為長條圖和折線圖加入 Y 軸設定
    ...((graphType === "長條圖" || graphType === "折線圖") && {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return `NT$ ${value.toLocaleString()}`;
            }
          }
        }
      }
    })
  };

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <div className="w-full p-4 text-center" style={{ height: 320 }}>
        <p className="text-red-500">載入數據時發生錯誤</p>
        <p className="text-sm text-gray-500">使用預設數據顯示</p>
        <div className="mt-4">
          {graphType === "長條圖" ? <Bar data={data} options={options} /> : <Pie data={data} options={options} />}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: 320 }}>
      {graphType === "長條圖" ? (
        <Bar data={data} options={options} />
      ) : graphType === "折線圖" ? (
        <Line data={data} options={options} />
      ) : (
        <Pie data={data} options={options} />
      )}
    </div>
  );
}