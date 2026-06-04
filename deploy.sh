#!/bin/bash

set -e

echo "================================"
echo "🚀 Motoko Backend Deployment"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if DFX is installed
if ! command -v dfx &> /dev/null; then
    echo -e "${RED}❌ DFX is not installed. Please install it first.${NC}"
    echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

echo -e "${YELLOW}📦 Building Motoko backend...${NC}"
dfx build

echo -e "${YELLOW}🔐 Determining deployment target...${NC}"
if [ "$1" == "--ic" ]; then
    echo -e "${YELLOW}📤 Deploying to Internet Computer (mainnet)...${NC}"
    dfx deploy freight_backend --ic
    CANISTER_ID=$(dfx canister id freight_backend --ic)
    NETWORK="production"
else
    echo -e "${YELLOW}🏠 Deploying to local network...${NC}"
    dfx deploy freight_backend
    CANISTER_ID=$(dfx canister id freight_backend)
    NETWORK="local"
fi

echo -e "${GREEN}✅ Backend deployment complete!${NC}"
echo -e "${GREEN}Canister ID: $CANISTER_ID${NC}"

echo -e "${YELLOW}📝 Updating frontend configuration...${NC}"
if [ "$NETWORK" == "production" ]; then
    sed -i "" "s/REACT_APP_CANISTER_ID=.*/REACT_APP_CANISTER_ID=$CANISTER_ID/" frontend/.env.production
    sed -i "" "s/REACT_APP_NETWORK=.*/REACT_APP_NETWORK=production/" frontend/.env.production
    echo "Updated frontend/.env.production"
else
    sed -i "" "s/REACT_APP_CANISTER_ID=.*/REACT_APP_CANISTER_ID=$CANISTER_ID/" frontend/.env.local
    sed -i "" "s/REACT_APP_NETWORK=.*/REACT_APP_NETWORK=local/" frontend/.env.local
    echo "Updated frontend/.env.local"
fi

echo -e "${YELLOW}🏗️  Building React frontend...${NC}"
cd frontend
npm run build
cd ..

echo -e "${GREEN}✅ Full deployment complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Canister ID: $CANISTER_ID${NC}"
echo -e "${GREEN}Network: $NETWORK${NC}"
if [ "$NETWORK" == "local" ]; then
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
fi
echo -e "${GREEN}================================${NC}"
