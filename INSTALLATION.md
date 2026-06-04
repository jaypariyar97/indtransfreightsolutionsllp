# Installation & Quick Start Guide

## System Requirements

- **OS**: macOS, Linux, or Windows (with WSL2)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 5GB free space
- **Internet**: Stable connection for IC deployment

## Step 1: Install Required Tools

### Install DFX (Dfinity SDK)

```bash
# macOS/Linux
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Add DFX to PATH
export PATH="$HOME/.local/share/dfx/bin:$PATH"
```

### Install Node.js & npm

```bash
# Using Homebrew (macOS)
brew install node

# Using apt (Ubuntu/Debian)
sudo apt-get install nodejs npm

# Verify installation
node --version  # Should be v18+
npm --version   # Should be v9+
```

### Install Mops (Motoko Package Manager)

```bash
npm install -g ic-mops
mops --version
```

### Install Docker (Optional but Recommended)

```bash
# macOS/Windows: Download from https://www.docker.com/products/docker-desktop

# Ubuntu/Debian
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

## Step 2: Clone & Setup Repository

```bash
# Clone the repository
git clone https://github.com/jaypariyar97/indtransfreightsolutionsllp.git
cd indtransfreightsolutionsllp

# Switch to migration branch
git checkout motoko-migration-complete

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 3: Choose Your Setup Method

### Method A: Docker Compose (Easiest)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access services
# Frontend: http://localhost:3000
# DFX: http://localhost:4943
# Postgres: localhost:5432
```

### Method B: Manual Setup

#### Terminal 1 - Start DFX

```bash
# Start local IC network
dfx start --background

# Wait for network to start (30-60 seconds)
dfx ping
```

#### Terminal 2 - Deploy Canister

```bash
# Build dependencies
mops install

# Build Motoko canister
dfx build

# Deploy canister
dfx deploy

# Get canister ID
dfx canister id freight_backend
```

#### Terminal 3 - Start Frontend

```bash
cd frontend
npm start

# Frontend will open at http://localhost:3000
```

## Step 4: Test the System

### Test Backend Connectivity

```bash
# Check canister health
dfx canister call freight_backend health

# Expected output:
# (record { status = "healthy"; timestamp = 1717419000000000000; version = "1.0.0" })
```

### Test Frontend

1. Open http://localhost:3000 in browser
2. You should see the Freight Management System dashboard
3. Try creating a test shipment
4. Verify data appears in the UI

## Step 5: Common Commands

### DFX Commands

```bash
# Start local network
dfx start --background

# Stop local network
dfx stop

# Build canister
dfx build

# Deploy canister
dfx deploy

# Call canister function
dfx canister call freight_backend getAllShipments

# Get canister info
dfx canister info freight_backend

# Deploy to Internet Computer
dfx deploy --ic
```

### Frontend Commands

```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Rebuild images
docker-compose build --no-cache

# Execute command in container
docker-compose exec frontend npm install
```

## Step 6: Deploy to Internet Computer

### Prerequisites

1. Have ICP tokens for cycles (get from: https://faucet.dfinity.org/)
2. Create DFX identity:

```bash
dfx identity new my-identity
dfx identity use my-identity
```

### Deployment Steps

```bash
# 1. Create canister on IC
dfx canister create freight_backend --ic

# 2. Build for IC
dfx build freight_backend --ic

# 3. Deploy canister
dfx deploy freight_backend --ic

# 4. Get production canister ID
CANISTER_ID=$(dfx canister id freight_backend --ic)
echo "Canister ID: $CANISTER_ID"

# 5. Update environment
echo "REACT_APP_CANISTER_ID=$CANISTER_ID" > frontend/.env.production
echo "REACT_APP_NETWORK=production" >> frontend/.env.production

# 6. Build frontend
cd frontend
npm run build

# 7. Deploy frontend to hosting (Vercel, Netlify, etc.)
# Using Vercel:
vercel deploy --prod
```

## Environment Variables

### Frontend (.env.local)

```env
REACT_APP_NETWORK=local
REACT_APP_CANISTER_ID=rrkah-fqaaa-aaaaa-aaaaq-cai
REACT_APP_API_HOST=http://localhost:4943
REACT_APP_ENV=development
```

### Frontend (.env.production)

```env
REACT_APP_NETWORK=production
REACT_APP_CANISTER_ID=YOUR_PRODUCTION_CANISTER_ID
REACT_APP_API_HOST=https://icp0.io
REACT_APP_ENV=production
```

## Troubleshooting

### DFX Issues

**Problem**: "dfx: command not found"

```bash
export PATH="$HOME/.local/share/dfx/bin:$PATH"
```

**Problem**: "Canister already exists"

```bash
# Stop DFX and clear state
dfx stop
rm -rf .dfx
dfx start --background
```

### Frontend Issues

**Problem**: "Cannot find module '@dfinity/agent'"

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Problem**: "Port 3000 already in use"

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Network Issues

**Problem**: "Connection refused on port 4943"

```bash
# Check if DFX is running
dfx ping

# Start DFX if not running
dfx start --background
```

**Problem**: "Timeout waiting for canister"

```bash
# Increase timeout
export DFX_NETWORK_TIMEOUT=30
```

## Verification Checklist

- [ ] DFX is installed (`dfx --version`)
- [ ] Node.js v18+ is installed (`node --version`)
- [ ] npm is installed (`npm --version`)
- [ ] Repository is cloned
- [ ] Frontend dependencies installed (`npm install`)
- [ ] DFX network is running (`dfx ping`)
- [ ] Canister is deployed (`dfx canister id freight_backend`)
- [ ] Frontend is accessible at http://localhost:3000
- [ ] Can create/view shipments in UI

## Next Steps

1. Review the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. Explore the Motoko backend code in `src/freight_backend/main.mo`
3. Check React components in `frontend/src/`
4. Read the [Architecture Documentation](./docs/ARCHITECTURE.md)

## Getting Help

- **DFX Issues**: https://forum.dfinity.org/
- **Motoko Questions**: https://discord.gg/dfinity
- **React Issues**: Stack Overflow, GitHub Issues

---

**Last Updated**: June 2026
**Maintainer**: Jaypar Iyar (@jaypariyar97)
