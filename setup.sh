#!/bin/bash
# TPlanet Deploy - Setup Script
# Clone all application repos into apps/ directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$SCRIPT_DIR/apps"

echo "=== TPlanet Deploy Setup ==="

# Create apps directory if not exists
mkdir -p "$APPS_DIR"
cd "$APPS_DIR"

# Clone and checkout specific branch
clone_repo() {
    local name=$1
    local url=$2
    local branch=$3

    if [ -d "$name" ]; then
        echo "✓ $name already exists, updating..."
        cd "$name"
        git fetch origin
        git checkout "$branch"
        git pull origin "$branch"
        cd ..
    else
        echo "→ Cloning $name ($branch)..."
        git clone -b "$branch" "$url" "$name"
    fi
}

# Repos with their branches
clone_repo "tplanet-AI"      "git@github.com:town-intelligent-beta/tplanet-AI.git"  "main"
clone_repo "tplanet-daemon"  "git@github.com:town-intelligent/tplanet-daemon.git"   "beta"
clone_repo "LLMTwins"        "git@github.com:towNingtek/LLMTwins.git"               "beta-tplanet-AI"
clone_repo "ollama-gateway"  "git@github.com:towNingtek/ollama-gateway.git"         "main"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Repos:"
for repo in tplanet-AI tplanet-daemon LLMTwins ollama-gateway; do
    branch=$(cd "$repo" && git branch --show-current)
    echo "  $repo → $branch"
done
echo ""
echo "Next steps:"
echo "  docker compose -f docker-compose.yml -f docker-compose.beta.yml up -d"
