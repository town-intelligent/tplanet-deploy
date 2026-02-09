export async function sdgsAutoGen(uuid) {
  const formData = new FormData();
  formData.append("uuid", uuid);

  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/llm/auto_gen_sdgs`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export const getWeightMeta = async (name) => {
  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/weight/get/${name}`
  );
  return await response.json();
};
