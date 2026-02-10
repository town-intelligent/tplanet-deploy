# AISecretary 架構說明

## 目錄結構

```
src/pages/backend/
├── AISecretary.jsx           # 主容器組件（76 行）
├── modules/                  # 功能模組
│   ├── ChatModule.jsx        # 對話聊天模組
│   ├── UploadModule.jsx      # 文件上傳模組
│   ├── PlanningModule.jsx    # 計畫文案建議模組
│   └── DataModule.jsx        # 數據資料統整模組
├── contexts/                 # 共享狀態管理
│   └── AISecretaryContext.jsx
├── config/                   # 配置文件
│   └── modules.config.js     # 模組註冊與配置
└── components/               # 共用組件
    ├── ModuleRenderer.jsx    # 模組渲染器
    ├── SidebarNav.jsx
    ├── ChatMessages.jsx
    └── ...
```

## 架構設計

### 1. 主容器（AISecretary.jsx）
- 負責：路由管理、模組渲染、共享邏輯協調
- 代碼行數：從 470 行降至 76 行
- 職責單一：不處理具體業務邏輯

### 2. 功能模組（modules/）
每個模組獨立封裝一個完整功能：
- **ChatModule**: 基礎對話功能
- **UploadModule**: 文件上傳與 OCR 處理
- **PlanningModule**: 計畫文案與 SDG 分析
- **DataModule**: 數據統計與圖表生成

### 3. 共享狀態（contexts/AISecretaryContext.jsx）
使用 React Context 管理所有模組共用的狀態：
- 聊天訊息（messages, send, sendSdgAnalysis）
- 上傳任務（tasks, start, updateById, completeById）
- API 服務（API_LLMTWINS, ensureSession）

### 4. 模組配置（config/modules.config.js）
集中管理模組註冊與啟用狀態：
```javascript
export const MODULE_REGISTRY = {
  chat: { id, name, component, enabled, icon },
  upload: { ... },
  planning: { ... },
  data: { ... }
};
```

## 訂購方案支持

在 `modules.config.js` 中可根據不同訂購方案返回不同的模組配置：

```javascript
export const getEnabledModules = (subscriptionPlan) => {
  if (subscriptionPlan === "basic") {
    return { chat: MODULE_REGISTRY.chat };
  }
  if (subscriptionPlan === "standard") {
    return {
      chat: MODULE_REGISTRY.chat,
      upload: MODULE_REGISTRY.upload
    };
  }
  // full 方案返回所有模組
  return Object.fromEntries(
    Object.entries(MODULE_REGISTRY).filter(([_, m]) => m.enabled)
  );
};
```

## 新增模組步驟

1. 在 `modules/` 建立新模組組件
2. 在 `modules.config.js` 註冊模組
3. 在 `SidebarNav.jsx` 添加導航項目（如需要）
4. 完成！無需修改主文件

## 優勢

✅ **可維護性**：每個模組獨立開發、測試
✅ **可擴展性**：新增功能只需加入註冊表
✅ **業務靈活性**：訂購方案可動態啟用/停用功能
✅ **代碼可讀性**：主文件從 470 行降至 76 行
✅ **職責分離**：每個文件職責單一清晰
