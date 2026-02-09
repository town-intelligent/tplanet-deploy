// 上傳 mockup
export async function mockup_upload(form) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/mockup/new`,
      {
        method: "POST",
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    return JSON.parse(data);
  } catch (error) {
    console.error("mockup_upload error:", error);
    throw error; // 保持原本的 Promise reject 行為
  }
}

// 獲取 mockup
export async function mockup_get(formData) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/mockup/get`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    return JSON.parse(data);
  } catch (error) {
    console.error("mockup_get error:", error);
    return { description: {} }; // 返回預設值以保持向後兼容
  }
}
