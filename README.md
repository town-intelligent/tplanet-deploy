# TPlanet Beta

TPlanet 平台 (測試環境) - Multi-tenant CMS with LLM RAG & Agent

## 目錄結構

```
tplanet-beta/
├── apps/                         # 應用程式 (獨立 repos)
│   ├── tplanet-AI/               # Frontend (React + Vite) → main
│   ├── tplanet-daemon/           # Backend (Django) → beta
│   ├── LLMTwins/                 # AI Service (FastAPI) → beta-tplanet-AI
│   └── ollama-gateway/           # LLM Gateway → main
│
├── docker-compose.yml            # Base compose
├── docker-compose.beta.yml       # Beta 環境
├── docker-compose.multi-tenant.yml
├── setup.sh                      # 自動 clone apps + 設定 branch
├── nginx/
└── packages/
    └── multi-tenant/             # 共用套件
```

## 快速開始

```bash
# 1. Clone repo
git clone git@github.com:town-intelligent/tplanet-beta.git
cd tplanet-beta

# 2. 執行 setup.sh 自動 clone 所有 apps 並設定 branch
./setup.sh

# 3. 複製環境變數
cp .env.example .env

# 4. 啟動服務
docker compose -f docker-compose.yml -f docker-compose.beta.yml up -d
```

## Apps 分支對應

| App | Branch | 說明 |
|-----|--------|------|
| tplanet-AI | main | Frontend |
| tplanet-daemon | beta | Backend with multi-tenant |
| LLMTwins | beta-tplanet-AI | AI Service |
| ollama-gateway | main | LLM Gateway |

## Multi-tenant 測試網址 (Beta)

| 網址 | Tenant |
|------|--------|
| https://beta.multi-tenant.4impact.cc | default |
| https://nantou.beta.multi-tenant.4impact.cc | nantou-gov |

## Beta vs Stable

| 環境 | Repo | 用途 |
|------|------|------|
| Beta | tplanet-beta (本 repo) | Demo / 測試 |
| Stable | [tplanet-stable](https://github.com/town-intelligent/tplanet-stable) | 正式使用 |

## 部署流程

```
開發 → tplanet-beta (測試) → PM 驗收 → merge to stable → tplanet-stable (正式)
```

## 開發流程

各 app 在 `apps/` 內保持獨立的 git repo：

```bash
# 開發 frontend
cd apps/tplanet-AI
git pull origin main
# ... 修改 ...
git add . && git commit && git push

# 開發 backend
cd apps/tplanet-daemon
git pull origin beta
# ... 修改 ...
git add . && git commit && git push
```

## 架構

```
                    ┌─────────────────┐
                    │     Nginx       │
                    │  (X-Tenant-ID)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Frontend     │ │    Backend      │ │   LLMTwins      │
│   tplanet-AI    │ │ tplanet-daemon  │ │    Wrapper      │
│  (React/Vite)   │ │    (Django)     │ │   (FastAPI)     │
└─────────────────┘ └────────┬────────┘ └────────┬────────┘
                             │                   │
                    ┌────────┴────────┐          ▼
                    │   Databases     │   ┌─────────────┐
                    │  (per tenant)   │   │  LLMTwins   │
                    └─────────────────┘   │  (RAG/AI)   │
                                          └──────┬──────┘
                                                 │
                                          ┌──────▼──────┐
                                          │   Ollama    │
                                          │   Gateway   │
                                          └──────┬──────┘
                                                 │
                                          ┌──────▼──────┐
                                          │   Ollama    │
                                          │    (LLM)    │
                                          └─────────────┘
```

## 新增 Tenant

詳見 [docs/add-tenant.md](docs/add-tenant.md)
