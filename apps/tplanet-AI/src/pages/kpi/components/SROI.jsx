import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SROI({
  sroiValue,
  totalValue,
  socialValue,
  economicValue,
  environmentalValue,
  totalInvestment,
  visible = true
}) {
  const data = {
    labels: ["環境價值", "經濟價值"],
    datasets: [
      {
        data: [environmentalValue, economicValue],
        backgroundColor: ["#3E6896", "#f2798e"],
        borderColor: ["#3E6896", "#f2798e"],
        borderWidth: 1,
        cutout: "50%", // 控制中間空心大小
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        display: false,
      },
    },
  };

  // 如果不可見，顯示預設訊息
  if (!visible) {
    return (
      <div className="text-center py-4">
        <p className="text-center font-bold mb-4">
          社會影響力數值已被積累，請持續關注。
        </p>
        <img 
          className="max-w-full h-auto mx-auto" 
          src="/static/imgs/sroi-empty.png" 
          alt="SROI 數據準備中"
        />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div id="SROI_block" className="flex flex-wrap mt-4">
        {/* 左側甜甜圈圖 */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <div className="relative w-64 h-64">
            <Doughnut data={data} options={options} />
            {/* 中間文字 */}
            <div className="absolute inset-0 top-2 flex flex-col justify-center items-center text-center">
              <p className="font-bold">SROI</p>
              <p className="font-bold">
                {typeof sroiValue === 'number' ? sroiValue.toFixed(2) : sroiValue}
              </p>
            </div>
            {/* 上下標籤 */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs font-bold">
              環境價值{" "}
              {environmentalValue && economicValue && (environmentalValue + economicValue) > 0
                ? ((environmentalValue / (environmentalValue + economicValue)) * 100).toFixed(0)
                : 0}
              %
            </div>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-xs font-bold">
              經濟價值{" "}
              {environmentalValue && economicValue && (environmentalValue + economicValue) > 0
                ? ((economicValue / (environmentalValue + economicValue)) * 100).toFixed(0)
                : 0}
              %
            </div>
          </div>
        </div>

        {/* 右側文字敘述 */}
        <div className="w-full md:w-1/2 flex justify-center items-center space-y-2 ">
          <ul className="list-disc space-y-10">
            <li>
              基於社會投資報酬率 (SROI) 方法學 產出數值為：
              {typeof sroiValue === 'number' ? sroiValue.toFixed(2) : sroiValue}
            </li>
            <li>
              總社會現值：{totalValue ? totalValue.toLocaleString() : '0'}{" "}
              <ul className="list-[circle] pl-5">
                <li>社會面向：{socialValue ? socialValue.toLocaleString() : '0'}</li>
                <li>經濟面向：{economicValue ? economicValue.toLocaleString() : '0'}</li>
                <li>環境面向：{environmentalValue ? environmentalValue.toLocaleString() : '0'}</li>
              </ul>
            </li>
            <li>總投入現值：{totalInvestment ? totalInvestment.toLocaleString() : '0'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}