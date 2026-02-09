import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

const UserRegistrationStatistics = ({ show, onHide }) => {
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chartType, setChartType] = useState("line"); // "line" or "bar"

  const fetchRegistrationStats = async () => {
    setLoading(true);
    setError("");
    
    try {
      const url = `${API_BASE}/api/accounts/registration_stats`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Registration stats response:", data);

      if (data.result !== true) {
        throw new Error(data.error || "獲取統計資料失敗");
      }

      const stats = data.stats || [];
      
      // 格式化資料以便圖表使用
      const formattedStats = stats.map(item => ({
        ...item,
        date: formatDate(item.date),
        displayDate: item.date // 保留原始日期用於顯示
      }));

      setStatsData(formattedStats);
      
    } catch (err) {
      console.error("Failed to fetch registration stats:", err);
      setError(err.message || "獲取統計資料失敗");
      setStatsData([]);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-800">{`日期: ${data.displayDate}`}</p>
          <p className="text-blue-600">{`新增用戶: ${data.new_users} 人`}</p>
          <p className="text-green-600">{`累計總數: ${data.total_users} 人`}</p>
        </div>
      );
    }
    return null;
  };

  // 計算統計摘要
  const calculateSummary = () => {
    if (statsData.length === 0) return null;

    const totalNewUsers = statsData.reduce((sum, item) => sum + item.new_users, 0);
    const currentTotal = statsData[statsData.length - 1]?.total_users || 0;
    const avgNewUsersPerDay = (totalNewUsers / statsData.length).toFixed(1);
    const maxNewUsersDay = Math.max(...statsData.map(item => item.new_users));
    const maxDay = statsData.find(item => item.new_users === maxNewUsersDay);

    return {
      totalNewUsers,
      currentTotal,
      avgNewUsersPerDay,
      maxNewUsersDay,
      maxDay: maxDay?.displayDate
    };
  };

  const summary = calculateSummary();

  useEffect(() => {
    if (show) {
      fetchRegistrationStats();
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>使用者註冊統計</Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ minHeight: '600px' }}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">載入統計資料中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">載入失敗</p>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button variant="outline-primary" onClick={fetchRegistrationStats}>
                重新載入
              </Button>
            </div>
          </div>
        ) : statsData.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-600">暫無統計資料</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 統計摘要 */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.totalNewUsers}</div>
                  <div className="text-sm text-gray-600">30天新增用戶</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.currentTotal}</div>
                  <div className="text-sm text-gray-600">總用戶數</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{summary.avgNewUsersPerDay}</div>
                  <div className="text-sm text-gray-600">平均每日新增</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{summary.maxNewUsersDay}</div>
                  <div className="text-sm text-gray-600">單日最高新增</div>
                  {summary.maxDay && (
                    <div className="text-xs text-gray-500 mt-1">({summary.maxDay})</div>
                  )}
                </div>
              </div>
            )}

            {/* 圖表控制 */}
            <div className="flex justify-between items-center">
              <h5 className="font-semibold text-gray-700">過去30天註冊趨勢</h5>
              <div className="flex gap-2">
                <Button
                  variant={chartType === "line" ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => setChartType("line")}
                >
                  折線圖
                </Button>
                <Button
                  variant={chartType === "bar" ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                >
                  柱狀圖
                </Button>
              </div>
            </div>

            {/* 圖表 */}
            <div style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={statsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="new_users" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="新增用戶"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#1D4ED8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_users" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="累計總數"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#059669' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={statsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="new_users" fill="#3B82F6" name="新增用戶" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* 數據表格（可選顯示） */}
            <details className="mt-6">
              <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-800">
                查看詳細數據 ({statsData.length} 天)
              </summary>
              <div className="mt-4">
                {/* 顯示有活動的日期 */}
                <div className="mb-4">
                  <h6 className="font-medium text-gray-700 mb-2">有新用戶註冊的日期</h6>
                  {statsData.filter(item => item.new_users > 0).length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      {statsData.filter(item => item.new_users > 0).map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="font-medium text-green-800">{item.displayDate}</span>
                          <span className="text-green-600">+{item.new_users} 位新用戶</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">過去30天內無新用戶註冊</div>
                  )}
                </div>

                {/* 完整數據表格 */}
                <details>
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
                    查看完整30天數據
                  </summary>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">日期</th>
                          <th className="px-4 py-2 text-right">新增用戶</th>
                          <th className="px-4 py-2 text-right">累計總數</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {statsData.map((item, index) => (
                          <tr 
                            key={index} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${item.new_users > 0 ? 'bg-green-50' : ''}`}
                          >
                            <td className="px-4 py-2 font-medium">{item.displayDate}</td>
                            <td className={`px-4 py-2 text-right ${item.new_users > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                              {item.new_users}
                            </td>
                            <td className="px-4 py-2 text-right text-green-600">{item.total_users}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            </details>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-500">
            {!loading && !error && statsData.length > 0 && (
              `最後更新: ${new Date().toLocaleString('zh-TW')}`
            )}
          </div>
          <div className="flex gap-2">
            {!loading && !error && statsData.length > 0 && (
              <Button variant="outline-primary" onClick={fetchRegistrationStats}>
                重新整理
              </Button>
            )}
            <Button variant="secondary" onClick={onHide}>
              關閉
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default UserRegistrationStatistics;