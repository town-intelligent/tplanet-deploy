#!/bin/bash
# TPlanet - Export Tenant Data
# Usage: ./scripts/export-tenant.sh <tenant-id>
# Example: ./scripts/export-tenant.sh nantou-gov

set -e

# 顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 檢查參數
if [ -z "$1" ]; then
    echo -e "${RED}Error: 請提供 tenant ID${NC}"
    echo "Usage: $0 <tenant-id>"
    echo "Example: $0 nantou-gov"
    exit 1
fi

TENANT_ID=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_DIR="exports/${TENANT_ID}_${TIMESTAMP}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo " TPlanet Tenant Export"
echo " Tenant: ${TENANT_ID}"
echo " Time: ${TIMESTAMP}"
echo "========================================"

# 建立匯出目錄
mkdir -p "${PROJECT_DIR}/${EXPORT_DIR}"
cd "${PROJECT_DIR}"

# ========================================
# 1. 資料庫匯出
# ========================================
echo -e "\n${YELLOW}[1/4] 匯出資料庫...${NC}"

# 根據 tenant ID 決定 container 名稱
case $TENANT_ID in
    "default")
        DB_CONTAINER="tplanet-db-multi-tenant"
        ;;
    "nantou-gov")
        DB_CONTAINER="tplanet-db-nantou"
        ;;
    *)
        DB_CONTAINER="tplanet-db-${TENANT_ID}"
        ;;
esac

# 檢查 container 是否存在
if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "  Container: ${DB_CONTAINER}"
    docker exec ${DB_CONTAINER} pg_dump -U postgres tplanet > "${EXPORT_DIR}/database.sql"
    echo -e "  ${GREEN}✓ database.sql${NC}"
else
    echo -e "  ${RED}✗ Container ${DB_CONTAINER} not found${NC}"
    echo "  Trying alternative container names..."

    # 嘗試其他可能的名稱
    for container in $(docker ps --format '{{.Names}}' | grep -i "${TENANT_ID}.*db\|db.*${TENANT_ID}"); do
        echo "  Found: ${container}"
        docker exec ${container} pg_dump -U postgres tplanet > "${EXPORT_DIR}/database.sql" 2>/dev/null && break
    done

    if [ -f "${EXPORT_DIR}/database.sql" ]; then
        echo -e "  ${GREEN}✓ database.sql${NC}"
    else
        echo -e "  ${RED}✗ 無法匯出資料庫${NC}"
    fi
fi

# ========================================
# 2. 媒體檔案匯出
# ========================================
echo -e "\n${YELLOW}[2/4] 匯出媒體檔案...${NC}"

MEDIA_PATHS=(
    "apps/tplanet-AI/public/assets/tenants/${TENANT_ID}"
    "apps/tplanet-daemon/media/${TENANT_ID}"
    "uploads/${TENANT_ID}"
)

MEDIA_FOUND=false
for media_path in "${MEDIA_PATHS[@]}"; do
    if [ -d "${media_path}" ]; then
        echo "  Found: ${media_path}"
        tar czf "${EXPORT_DIR}/media_$(basename ${media_path}).tar.gz" -C "$(dirname ${media_path})" "$(basename ${media_path})" 2>/dev/null
        MEDIA_FOUND=true
    fi
done

if [ "$MEDIA_FOUND" = true ]; then
    echo -e "  ${GREEN}✓ 媒體檔案已匯出${NC}"
else
    echo -e "  ${YELLOW}⚠ 無媒體檔案${NC}"
fi

# ========================================
# 3. AI Session 匯出
# ========================================
echo -e "\n${YELLOW}[3/4] 匯出 AI Sessions...${NC}"

SESSION_PATHS=(
    "apps/LLMTwins/sessions"
    "sessions"
)

SESSION_FOUND=false
for session_path in "${SESSION_PATHS[@]}"; do
    if [ -d "${session_path}" ]; then
        # 找出該租戶的 session 檔案
        SESSION_FILES=$(find "${session_path}" -name "${TENANT_ID}_*" -o -name "*_${TENANT_ID}_*" 2>/dev/null)
        if [ -n "$SESSION_FILES" ]; then
            echo "  Found sessions in: ${session_path}"
            mkdir -p "${EXPORT_DIR}/sessions"
            echo "$SESSION_FILES" | xargs -I {} cp {} "${EXPORT_DIR}/sessions/" 2>/dev/null
            SESSION_FOUND=true
        fi
    fi
done

if [ "$SESSION_FOUND" = true ]; then
    tar czf "${EXPORT_DIR}/sessions.tar.gz" -C "${EXPORT_DIR}" sessions
    rm -rf "${EXPORT_DIR}/sessions"
    echo -e "  ${GREEN}✓ sessions.tar.gz${NC}"
else
    echo -e "  ${YELLOW}⚠ 無 AI Session 資料${NC}"
fi

# ========================================
# 4. 建立 README
# ========================================
echo -e "\n${YELLOW}[4/4] 建立匯入說明...${NC}"

cat > "${EXPORT_DIR}/README.md" << EOF
# ${TENANT_ID} 資料匯出

匯出時間: ${TIMESTAMP}

## 檔案說明

| 檔案 | 說明 |
|------|------|
| database.sql | PostgreSQL 資料庫完整備份 |
| media_*.tar.gz | 媒體檔案 (logo, 上傳檔案等) |
| sessions.tar.gz | AI 對話記錄 |

## 匯入步驟

### 1. 建立資料庫

\`\`\`bash
# 建立資料庫
createdb -h <your-db-host> -U postgres tplanet

# 匯入資料
psql -h <your-db-host> -U postgres -d tplanet < database.sql
\`\`\`

### 2. 解壓媒體檔案

\`\`\`bash
tar xzf media_*.tar.gz -C /path/to/your/media/
\`\`\`

### 3. 解壓 AI Sessions (optional)

\`\`\`bash
tar xzf sessions.tar.gz -C /path/to/your/llmtwins/sessions/
\`\`\`

## 注意事項

- 請確保目標環境的 PostgreSQL 版本相容 (建議 15+)
- 媒體檔案路徑可能需要根據您的部署調整
- 匯入後請執行 Django migrations 確保 schema 一致

## 支援

如有問題請聯繫: support@example.com
EOF

echo -e "  ${GREEN}✓ README.md${NC}"

# ========================================
# 打包
# ========================================
echo -e "\n${YELLOW}打包中...${NC}"

cd exports
tar czf "${TENANT_ID}_${TIMESTAMP}.tar.gz" "${TENANT_ID}_${TIMESTAMP}"
cd ..

# ========================================
# 完成
# ========================================
echo ""
echo "========================================"
echo -e "${GREEN}匯出完成!${NC}"
echo "========================================"
echo ""
echo "匯出目錄: ${EXPORT_DIR}/"
ls -la "${EXPORT_DIR}/"
echo ""
echo "打包檔案: exports/${TENANT_ID}_${TIMESTAMP}.tar.gz"
ls -lh "exports/${TENANT_ID}_${TIMESTAMP}.tar.gz"
echo ""
echo "交付給客戶: exports/${TENANT_ID}_${TIMESTAMP}.tar.gz"
