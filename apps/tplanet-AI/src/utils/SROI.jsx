const formatCurrency = (number, digits = 0) => {
  const formatted = new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: digits,
  }).format(number);

  return formatted.replaceAll("$", "");
};

export const getSroiDataMeta = async (uuid, email = localStorage.getItem("email") || "") => {
  const form = new FormData();
  form.append("email", email);
  form.append("uuid_project", uuid);

  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/get_sroi_meta`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let data = await response.json();

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
};

export const getSroiData = async (uuid, email = localStorage.getItem("email") || "") => {
  const form = new FormData();
  form.append("email", email);
  form.append("uuid_project", uuid);

  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/get_sroi`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let data = await response.json();

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
};

export const setSroiData = async (uuid, visible = true, email = localStorage.getItem("email") || "") => {
  const form = new FormData();
  form.append("uuid_project", uuid);
  form.append("email", email);
  form.append("visible", visible);

  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/set_sroi`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
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

export const getSroiEvidenceIdentifiers = async (uuid) => {
  const form = new FormData();
  form.append("uuid_project", uuid);

  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/get_sroi_evidence_identifiers`,
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

export const getSroiEvidence = async (uuid) => {
  const response = await fetch(
    `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/get_sroi_evidences`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid_project: uuid }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let data = await response.json();
  return data;
};
