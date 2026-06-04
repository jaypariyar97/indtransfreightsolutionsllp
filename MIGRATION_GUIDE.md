# Freight Management System - Java to Motoko Migration Guide

## Overview

This guide documents the complete migration of the Freight Management System from:
- **Backend**: Java Spring Boot → Motoko (Internet Computer)
- **Frontend**: React (unchanged, but updated for Motoko API)
- **Database**: MySQL/PostgreSQL → On-chain storage (Motoko canister memory)

## Architecture Changes

### Before (Java Spring Boot)
```
┌─────────────┐      REST APIs      ┌──────────────┐
│ React App   │ ◄──────────────────► │ Spring Boot  │
└─────────────┘                       │   Backend    │
                                      └──────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │ MySQL/PostgreSQL │
                                      │   Database   │
                                      └──────────────┘
```

### After (Motoko)
```
┌─────────────┐    Canister Calls   ┌──────────────┐
│ React App   │ ◄──────────────────► │   Motoko     │
└─────────────┘   (@dfinity/agent)   │   Canister   │
                                      └──────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │ On-chain     │
                                      │   Memory     │
                                      └──────────────┘
```

## Key Differences

| Feature | Java Spring Boot | Motoko |
|---------|------------------|--------|
| Language | Java | Motoko |
| Runtime | JVM | WebAssembly (Wasm) |
| API Communication | HTTP/REST | Inter-canister calls |
| Database | External (MySQL/PostgreSQL) | On-chain (Stable Memory) |
| Authentication | Spring Security + JWT | Internet Identity (Optional) |
| Deployment | Docker containers | dfx deploy |
| Cost Model | Server hosting | Cycles (ICP blockchain) |
| Storage Limit | Unlimited (external DB) | ~4GB per canister |

## File Structure

```
indt-freight-motoko/
├── dfx.json                          # DFX configuration
├── mops.toml                         # Motoko package manager config
├── deploy.sh                         # Deployment script
├── docker-compose.yml                # Docker setup (optional)
├── src/
│   └── freight_backend/
│       └── main.mo                   # Motoko backend
├── frontend/
│   └── src/
│       ├── services/
│       │   └── motokoApi.ts          # API service layer
│       ├── hooks/
│       │   └── useMotokoBackend.ts   # React hook
│       ├── .env.local                # Local development config
│       └── .env.production           # Production config
└── MIGRATION_GUIDE.md                # This file
```

## Installation & Setup

### Prerequisites

1. **Install DFX** (dfinity developer toolkit)
```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

2. **Install Node.js & npm**
```bash
node --version  # v18+
npm --version   # v9+
```

3. **Install Mops** (Motoko package manager)
```bash
npm install -g ic-mops
```

### Local Development Setup

#### Option 1: Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/jaypariyar97/indtransfreightsolutionsllp.git
cd indtransfreightsolutionsllp

# Switch to migration branch
git checkout motoko-migration-complete

# Start all services
docker-compose up -d

# Frontend will be available at http://localhost:3000
# DFX at http://localhost:4943
```

#### Option 2: Manual Setup

```bash
# Start local DFX network
dfx start --background

# Deploy Motoko backend
dfx build
dfx deploy

# In another terminal, start frontend
cd frontend
npm install
npm start
```

## API Migration

### Java Spring Boot Example
```java
@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {
    @PostMapping
    public ResponseEntity<Shipment> create(@RequestBody CreateShipmentRequest request) {
        // Implementation
    }
}
```

### Motoko Equivalent
```motoko
public func createShipment(request: CreateShipmentRequest) : async Result.Result<Shipment, Text> {
    let id = generateId();
    let newShipment : Shipment = { /* ... */ };
    shipments.put(id, newShipment);
    #ok(newShipment)
};
```

### React Integration

**Before (Java Backend)**
```typescript
import axios from 'axios';

const response = await axios.post(
  'http://localhost:8080/api/shipments',
  { origin, destination, weight }
);
```

**After (Motoko Backend)**
```typescript
import { shipmentApi } from '../services/motokoApi';

const shipment = await shipmentApi.create({
  origin,
  destination,
  weight
});
```

## Function Mapping

### Shipment Operations

| Operation | Java Endpoint | Motoko Function |
|-----------|---------------|----------------|
| Get all | GET /shipments | getAllShipments() |
| Get by ID | GET /shipments/{id} | getShipmentById(id) |
| Get by status | GET /shipments?status=X | getShipmentsByStatus(status) |
| Create | POST /shipments | createShipment(request) |
| Update | PUT /shipments/{id} | updateShipment(id, request) |
| Delete | DELETE /shipments/{id} | deleteShipment(id) |
| Assign driver | PUT /shipments/{id}/driver | assignDriver(shipmentId, driverId) |

### Driver Operations

| Operation | Java Endpoint | Motoko Function |
|-----------|---------------|----------------|
| Get all | GET /drivers | getAllDrivers() |
| Get by ID | GET /drivers/{id} | getDriverById(id) |
| Get active | GET /drivers?status=active | getActiveDrivers() |
| Create | POST /drivers | createDriver(name, email, license) |
| Update status | PUT /drivers/{id}/status | updateDriverStatus(id, status) |

## Data Types

### Shipment Status
```motoko
type ShipmentStatus = {#pending; #in_transit; #delivered; #cancelled};
```

### User Role
```motoko
type UserRole = {#admin; #dispatcher; #driver; #customer};
```

### Driver Status
```motoko
type DriverStatus = {#active; #inactive; #suspended};
```

## Authentication

### Current Implementation (Password-based)

```typescript
// Login
const result = await authApi.authenticate(username, password);
localStorage.setItem('authToken', result.token);
```

### Future Enhancement (Internet Identity)

```typescript
import { AuthClient } from '@dfinity/auth-client';

const authClient = await AuthClient.create();
await authClient.login({
  identityProvider: process.env.II_URL,
});
```

## Statistics & Monitoring

### Shipment Statistics
```typescript
const stats = await shipmentApi.getStats();
// Returns: { total, pending, inTransit, delivered, cancelled }
```

### Driver Statistics
```typescript
const stats = await driverApi.getStats();
// Returns: { total, active, inactive }
```

### System Health
```typescript
const health = await authApi.health();
// Returns: { status, timestamp, version }
```

## Deployment to Internet Computer

### 1. Configure Your Identity

```bash
# Create or use existing identity
dfx identity new my-identity
dfx identity use my-identity
```

### 2. Create Canister

```bash
# Create canister on mainnet
dfx canister create freight_backend --ic
```

### 3. Deploy Backend

```bash
# Build and deploy
dfx build freight_backend --ic
dfx deploy freight_backend --ic
```

### 4. Get Canister ID

```bash
CAN_ID=$(dfx canister id freight_backend --ic)
echo $CAN_ID
```

### 5. Update Frontend Config

```bash
# Update .env.production
sed -i "s/REACT_APP_CANISTER_ID=.*/REACT_APP_CANISTER_ID=$CAN_ID/" frontend/.env.production
```

### 6. Deploy Frontend (Optional - using Vercel/Netlify)

```bash
cd frontend
npm run build
# Deploy build/ directory to your hosting provider
```

## Cost Analysis

### Cycles Cost

- **Create shipment**: ~100,000 cycles
- **Update shipment**: ~50,000 cycles
- **Query operation**: ~0 cycles (free)
- **Monthly storage**: ~4 billion cycles (~$1 USD per canister)

### Cost Comparison

| Aspect | Java Spring Boot | Motoko |
|--------|------------------|--------|
| Server/Host | $10-50/month | $1-5/month (cycles) |
| Database | $10-100/month | Included (on-chain) |
| Bandwidth | Pay per GB | Included |
| Total | $20-150/month | $1-5/month |

## Limitations & Workarounds

### 1. Memory Limit (~4GB)

**Problem**: Motoko canister has limited storage

**Solution**: 
- Use PostgreSQL for historical data
- Implement data archival
- Use separate canisters for different data types

### 2. PDF/Excel Generation

**Problem**: Motoko doesn't have native PDF libraries

**Solution**:
- Use external service (AWS Lambda, Cloud Functions)
- Call via HTTP outbound calls
- Store files in external storage (S3, Arweave)

### 3. Email Sending

**Problem**: Motoko can't directly send emails

**Solution**:
- Use SendGrid/Mailgun API
- Call via HTTP outbound calls
- Implement email service canister

## Performance Optimization

### 1. Query vs Update Functions

```motoko
// Query - Fast, free, no state changes
public query func getAllShipments() : async [Shipment] { /* */ };

// Update - Slower, costs cycles, can modify state
public func createShipment(request: CreateShipmentRequest) : async Result.Result<Shipment, Text> { /* */ };
```

### 2. Data Indexing

```typescript
// Instead of filtering in frontend, use Motoko functions
const pending = await shipmentApi.getByStatus('pending');
const byDriver = await shipmentApi.getByDriver(driverId);
```

### 3. Pagination (Future)

```motoko
// Can implement pagination to handle large datasets
public query func getShipmentsPage(page: Nat, pageSize: Nat) : async [Shipment] { /* */ };
```

## Troubleshooting

### Issue: "Canister not found"

```bash
# Solution: Check DFX network is running
dfx start --background
```

### Issue: "Connection refused"

```bash
# Solution: Verify port 4943 is available
lsof -i :4943
```

### Issue: "Out of memory"

```bash
# Solution: Create separate canisters for different data types
# Or implement data archival strategy
```

## Next Steps

1. ✅ Complete local testing
2. ✅ Deploy to IC mainnet
3. ⬜ Implement Internet Identity authentication
4. ⬜ Add data archival to PostgreSQL
5. ⬜ Create admin dashboard
6. ⬜ Implement multi-canister architecture

## Support & Resources

- **DFX Documentation**: https://internetcomputer.org/docs/
- **Motoko Docs**: https://internetcomputer.org/docs/current/developer-docs/build/languages/motoko/
- **React Agent**: https://github.com/dfinity/agent-js
- **Internet Computer**: https://internetcomputer.org/

## Version History

- **v1.0.0** (Current) - Initial Motoko migration
- **v0.1.0** (Previous) - Java Spring Boot version

---

**Last Updated**: June 2026
**Maintainer**: Jaypar Iyar (@jaypariyar97)
