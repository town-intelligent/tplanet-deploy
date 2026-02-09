// src/utils/KpiApi.jsx
import { useState, useEffect } from "react";
import { plan_info, list_plan_tasks, getProjectWeight } from "./Plan";

const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

/**
 * 取得 SDGs 計畫數（SDG-1 ~ SDG-17）
 * 可選參數 year，若不提供則取全部年度。
 * 回傳格式：{ "SDG-1": 0, ..., "SDG-17": 0 }
 */
export async function fetchSdgsProjects(email, year = null) {
  if (!email) throw new Error("email is required");
  // 構建 payload：有提供 year 才加進去
  const payload = { email };
  if (year) payload.year = year;

  const res = await fetch(`${API_BASE}/api/dashboard/sdgs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`fetchSdgsProjects failed: ${res.status} ${msg}`);
  }

  const json = await res.json();
  return json?.content?.sdgs_projects ?? {};
}

const useProjectCounts = (listProjectUuids) => {
  const [projectCounts, setProjectCounts] = useState({});

  useEffect(() => {
    const updateCounts = async () => {
      const counts = {};
      for (const uuid of listProjectUuids) {
        try {
          const projectInfo = await plan_info(uuid); // 獲取項目資訊
          const parentTasks = await list_plan_tasks(projectInfo.uuid, 1); // 獲取父任務
          const weight = getProjectWeight(parentTasks.tasks); // 獲取權重

          // 累加權重
          for (let i = 1; i <= 27; i++) {
            const key = `sdgs-${i}`;
            if (weight[key] && weight[key] !== "0") {
              counts[key] = (counts[key] || 0) + 1;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      setProjectCounts(counts);
    };

    if (listProjectUuids.length > 0) {
      updateCounts();
    }
  }, [listProjectUuids]);

  return projectCounts;
};
