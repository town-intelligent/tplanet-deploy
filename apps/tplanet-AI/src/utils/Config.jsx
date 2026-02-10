/**
 * Static configuration - universal data that doesn't change per tenant.
 * Tenant-specific config (hosters, departments) comes from useHosters(), useDepartments() hooks.
 */

// FAQ 問題列表
export const FAQ_ITEMS = [
  { id: 1, label: "社群貼文：請將此計畫改寫成社交網站貼文", prompt: "請將此計劃改寫為社交網站的貼文" },
  { id: 2, label: "成效試算：大致試算本專案的SROI量化數據", prompt: "請大致估算此計劃的 SROI" },
  { id: 3, label: "活動設計：請根據計畫設計對應的永續活動", prompt: "請根據此計劃，設計對應的永續活動" },
  { id: 4, label: "專案媒合：隨機選擇兩個專案進行合作提案", prompt: "專案媒合", isProjectMatch: true },
];

export const sdgData = [
  { id: "1", text: "終結貧窮", content: "終結一切形式的貧窮。" },
  { id: "2", text: "消除飢餓", content: "消除飢餓,達成糧食安全,促進永續農業。" },
  { id: "3", text: "良好健康與福祉", content: "確保健康生活,促進各年齡層福祉。" },
  { id: "4", text: "優質教育", content: "確保包容與公平的優質教育,提倡終身學習機會。" },
  { id: "5", text: "性別平等", content: "實現性別平等,賦予所有女性與女孩權力。" },
  { id: "6", text: "清潔飲水與衛生設施", content: "確保所有人取得水資源及衛生設施。" },
  { id: "7", text: "可負擔的潔淨能源", content: "確保可負擔、可靠、永續的能源供應。" },
  { id: "8", text: "合適的工作與經濟成長", content: "促進包容且永續的經濟成長與體面工作。" },
  { id: "9", text: "產業、創新與基礎建設", content: "建設具韌性的基礎設施,促進永續工業化與創新。" },
  { id: "10", text: "減少不平等", content: "減少國內與國際的不平等。" },
  { id: "11", text: "永續城市與社區", content: "使城市與人類居住具包容性、安全、韌性與永續性。" },
  { id: "12", text: "負責任消費與生產", content: "確保永續的消費與生產模式。" },
  { id: "13", text: "氣候行動", content: "採取緊急行動因應氣候變遷及其影響。" },
  { id: "14", text: "保育海洋生態", content: "保育海洋與海洋資源,促進永續利用。" },
  { id: "15", text: "保護陸域生態", content: "保護陸域生態系統,促進永續森林管理、防止沙漠化與生物多樣性流失。" },
  { id: "16", text: "和平、正義與健全制度", content: "建立和平、公正且具包容性的社會與制度。" },
  { id: "17", text: "促進目標實現的夥伴關係", content: "強化永續發展的執行方法與全球夥伴關係。" },
];

export default {
  sdgData,
  FAQ_ITEMS,
};
