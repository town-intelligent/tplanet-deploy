// src/pages/backend/config/modules.config.js
import ChatModule from "../modules/ChatModule";
import UploadModule from "../modules/UploadModule";
import PlanningModule from "../modules/PlanningModule";
import DataModule from "../modules/DataModule";

export const MODULE_REGISTRY = {
  chat: {
    id: "chat",
    name: "對話聊天",
    component: ChatModule,
    enabled: true,
    icon: "chat",
  },
  upload: {
    id: "upload",
    name: "文件上傳",
    component: UploadModule,
    enabled: true,
    icon: "upload",
  },
  planning: {
    id: "planning",
    name: "計畫文案",
    component: PlanningModule,
    enabled: true,
    icon: "planning",
  },
  data: {
    id: "data",
    name: "數據統整",
    component: DataModule,
    enabled: true,
    icon: "data",
  },
};

// 根據訂購方案獲取啟用的模組
export const getEnabledModules = (subscriptionPlan = "full") => {
  // 未來可以根據不同的訂購方案返回不同的模組配置
  // 例如：
  // if (subscriptionPlan === "basic") {
  //   return { chat: MODULE_REGISTRY.chat };
  // }
  // if (subscriptionPlan === "standard") {
  //   return { chat: MODULE_REGISTRY.chat, upload: MODULE_REGISTRY.upload };
  // }

  // 目前返回所有啟用的模組
  return Object.fromEntries(
    Object.entries(MODULE_REGISTRY).filter(([_, module]) => module.enabled)
  );
};
