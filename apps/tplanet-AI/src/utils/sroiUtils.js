// src/utils/sroiUtils.js - SROI 數據獲取工具函數

// 格式化貨幣的工具函數
export const formatCurrency = (value) => {
  if (value === 0 || value === null || value === undefined) return 0;
  return Number(value);
};

// 獲取 SROI 元數據
export const getSroiDataMeta = async (uuid, email = localStorage.getItem("email") || "") => {
  try {
    const form = new FormData();
    form.append("email", email);
    form.append("uuid_project", uuid);

    const response = await fetch(`${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/get_sroi_meta`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    let data = JSON.parse(content);
    
    // 格式化數據
    data = {
      ...data,
      computed: {
        social_subtotal: formatCurrency(data.social_subtotal || 0),
        economy_subtotal: formatCurrency(data.economy_subtotal || 0),
        environment_subtotal: formatCurrency(data.environment_subtotal || 0),
        total_cost: formatCurrency(data.total_cost || 0),
        total_benefit: formatCurrency(data.total_benefit || 0),
      },
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching SROI meta data:', error);
    throw error;
  }
};

// 獲取 SROI 數據
export const getSroiData = async (uuid, email = localStorage.getItem("email") || "") => {
  try {
    const form = new FormData();
    form.append("email", email);
    form.append("uuid_project", uuid);

    const response = await fetch(`${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/get_sroi`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    let data = JSON.parse(content);
    
    // 格式化數據
    data = {
      ...data,
      computed: {
        social_subtotal: formatCurrency(data.social_subtotal || 0),
        economy_subtotal: formatCurrency(data.economy_subtotal || 0),
        environment_subtotal: formatCurrency(data.environment_subtotal || 0),
        total_cost: formatCurrency(data.total_cost || 0),
        total_benefit: formatCurrency(data.total_benefit || 0),
      },
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching SROI data:', error);
    throw error;
  }
};

// 設置 SROI 數據可見性
export const setSroiData = async (uuid, visible = true, email = localStorage.getItem("email") || "") => {
  try {
    const form = new FormData();
    form.append("uuid_project", uuid);
    form.append("email", email);
    form.append("visible", visible);

    const response = await fetch(`${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/set_sroi`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    return JSON.parse(content);
  } catch (error) {
    console.error('Error setting SROI data:', error);
    throw error;
  }
};

export const getSroiTableData = async (uuid, sroi_type) => {
  const form = new FormData();
  form.append("uuid_project", uuid);
  form.append("sroi_type", sroi_type);

  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/get_sroi_table_values`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let data = await response.json();
  return data;
};