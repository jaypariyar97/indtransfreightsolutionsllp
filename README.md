# Freight Management System - Motoko Edition 🚀

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Internet%20Computer-blueviolet)

## Overview

Freight Management System is a complete web application for managing shipments, drivers, and logistics operations. This version runs entirely on the **Internet Computer (ICP)** blockchain using **Motoko** for the backend and **React** for the frontend.

### 🎯 Key Features

- ✅ **Shipment Management**: Create, update, track, and manage shipments
- ✅ **Driver Management**: Manage drivers and assign them to shipments
- ✅ **Real-time Tracking**: Track shipment status in real-time
- ✅ **User Authentication**: Secure user login and role-based access
- ✅ **Analytics Dashboard**: View comprehensive statistics and metrics
- ✅ **On-chain Storage**: All data stored securely on the blockchain
- ✅ **Zero-downtime Deployment**: Canister-based architecture
- ✅ **Low Operating Costs**: Minimal cycle costs on Internet Computer

## Technology Stack

### Backend
- **Motoko**: Smart contract language for Internet Computer
- **DFX**: Developer kit for building on IC
- **Canister**: On-chain smart contract container

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **@dfinity/agent**: IC JavaScript agent
- **Tailwind CSS**: Styling framework

### Infrastructure
- **Internet Computer**: Blockchain platform
- **PostgreSQL**: Optional for data archival
- **Docker**: Containerization (optional)

## Quick Start

### Prerequisites

```bash
# Check required tools
dfx --version        # DFX SDK
node --version       # Node.js v18+
npm --version        # npm v9+
```

### Installation

```bash
# Clone repository
git clone https://github.com/jaypariyar97/indtransfreightsolutionsllp.git
cd indtransfreightsolutionsllp
git checkout motoko-migration-complete

# Using Docker Compose (Recommended)
docker-compose up -d

# Or manually:
dfx start --background
dfx deploy
cd frontend && npm install && npm start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **DFX Network**: http://localhost:4943
- **Documentation**: See [INSTALLATION.md](./INSTALLATION.md)

## Project Structure

```
indt-freight-motoko/
├── src/
│   └── freight_backend/
│       └── main.mo                  # Motoko canister backend
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── hooks/
│   │   │   └── useMotokoBackend.ts  # Backend integration hook
│   │   ├── services/
│   │   │   └── motokoApi.ts         # API service layer
│   │   └── App.tsx                  # Main app component
│   ├── .env.local                   # Local environment
│   └── .env.production              # Production environment
├── dfx.json                         # DFX configuration
├── mops.toml                        # Motoko packages
├── docker-compose.yml               # Docker setup
├── deploy.sh                        # Deployment script
├── MIGRATION_GUIDE.md               # Detailed migration guide
├── INSTALLATION.md                  # Setup instructions
└── README.md                        # This file
```

## API Documentation

### Shipment Endpoints

#### Get All Shipments
```motoko
public query func getAllShipments() : async [Shipment]
```

#### Create Shipment
```motoko
public func createShipment(request: CreateShipmentRequest) : async Result.Result<Shipment, Text>
```

**Request:**
```typescript
{
  origin: string,
  destination: string,
  weight: number
}
```

#### Update Shipment
```motoko
public func updateShipment(id: Text, request: UpdateShipmentRequest) : async Result.Result<Shipment, Text>
```

#### Assign Driver
```motoko
public func assignDriver(shipmentId: Text, driverId: Text) : async Result.Result<Shipment, Text>
```

### Driver Endpoints

#### Get All Drivers
```motoko
public query func getAllDrivers() : async [Driver]
```

#### Create Driver
```motoko
public func createDriver(name: Text, email: Text, licenseNumber: Text) : async Result.Result<Driver, Text>
```

#### Update Driver Status
```motoko
public func updateDriverStatus(driverId: Text, newStatus: DriverStatus) : async Result.Result<Driver, Text>
```

### Statistics Endpoints

#### Shipment Statistics
```motoko
public query func getShipmentStats() : async { total: Nat; pending: Nat; inTransit: Nat; delivered: Nat; cancelled: Nat }
```

#### Driver Statistics
```motoko
public query func getDriverStats() : async { total: Nat; active: Nat; inactive: Nat }
```

#### System Health
```motoko
public query func health() : async { status: Text; timestamp: Int; version: Text }
```

## Usage Examples

### React Component Integration

```typescript
import { useMotokoBackend } from './hooks/useMotokoBackend';

function ShipmentList() {
  const {
    shipments,
    loading,
    error,
    createShipment,
    updateShipment,
  } = useMotokoBackend();

  const handleCreate = async () => {
    await createShipment({
      origin: 'New York',
      destination: 'Los Angeles',
      weight: 1000,
    });
  };

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <ul>
          {shipments.map((shipment) => (
            <li key={shipment.id}>
              {shipment.origin} → {shipment.destination}
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleCreate}>Create Shipment</button>
    </div>
  );
}
```

## Deployment

### Local Development

```bash
# Start local network
dfx start --background

# Deploy canister
dfx deploy

# Start frontend
cd frontend && npm start
```

### Production (Internet Computer)

```bash
# Create identity
dfx identity new production-identity
dfx identity use production-identity

# Create canister
dfx canister create freight_backend --ic

# Deploy to IC
dfx deploy freight_backend --ic

# Get canister ID
dfx canister id freight_backend --ic

# Build and deploy frontend
cd frontend
npm run build
vercel deploy --prod
```

## Performance & Costs

### Cycle Costs
- **Create operation**: ~100,000 cycles
- **Read operation**: ~0 cycles (queries are free)
- **Monthly storage**: ~4B cycles (~$1 USD per canister)

### Cost Comparison

| Service | Java Spring Boot | Motoko on IC |
|---------|------------------|-------------|
| Server Hosting | $20-50/month | $1-5/month |
| Database | $10-100/month | Included |
| Bandwidth | $0-20/month | Included |
| **Total** | **$30-170/month** | **$1-5/month** |

## Limitations & Solutions

### 1. Storage Limit (~4GB per canister)

**Solution**: Implement multi-canister architecture or archive old data to PostgreSQL.

### 2. PDF/Excel Generation

**Solution**: Use external services (AWS Lambda, Cloud Functions) via HTTP outbound calls.

### 3. Email Functionality

**Solution**: Integrate with SendGrid/Mailgun API via HTTP outbound calls.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              React Frontend                      │
│         (http://localhost:3000)                 │
└─────────────────────────────────────────────────┘
                       │
                       │ @dfinity/agent
                       ▼
┌─────────────────────────────────────────────────┐
│         Internet Computer Network               │
│  ┌──────────────────────────────────────────┐   │
│  │  Motoko Canister (freight_backend)       │   │
│  │  - Shipment Management                   │   │
│  │  - Driver Management                     │   │
│  │  - Authentication                        │   │
│  │  - Analytics                             │   │
│  └──────────────────────────────────────────┘   │
│              ↓                                    │
│  ┌──────────────────────────────────────────┐   │
│  │       On-chain Stable Memory             │   │
│  │  - Shipment Data                         │   │
│  │  - Driver Data                           │   │
│  │  - User Accounts                         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Migration from Java Spring Boot

This project was migrated from Java Spring Boot to Motoko. See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed information on:

- Architecture changes
- API mapping
- Data type conversions
- Deployment differences
- Cost analysis

## Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   dfx build
   dfx deploy
   cd frontend && npm start
   ```

2. **Testing**
   ```bash
   dfx build
   dfx canister call freight_backend health
   cd frontend && npm test
   ```

3. **Deployment**
   ```bash
   ./deploy.sh --ic
   ```

## Roadmap

- [ ] Internet Identity integration
- [ ] Multi-canister architecture
- [ ] Data archival to PostgreSQL
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] REST API gateway
- [ ] GraphQL support

## Security

- All data is encrypted on-chain
- Canister uses Motoko's type system for memory safety
- Web2 security best practices implemented
- Regular security audits recommended before mainnet deployment

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- 📖 **Documentation**: [INSTALLATION.md](./INSTALLATION.md), [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- 💬 **Discord**: [DFINITY Discord](https://discord.gg/dfinity)
- 🐛 **Issues**: [GitHub Issues](https://github.com/jaypariyar97/indtransfreightsolutionsllp/issues)
- 📧 **Email**: contact@exemple.com

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Original Java Spring Boot implementation
- DFINITY team for Internet Computer
- React and open-source communities

## Version History

### v1.0.0 (Current)
- ✅ Complete Motoko migration
- ✅ React frontend integration
- ✅ Docker Compose setup
- ✅ Full documentation

### v0.1.0 (Legacy)
- Java Spring Boot backend
- MySQL/PostgreSQL database
- Originally deployed on traditional servers

---

**Current Status**: Production Ready 🚀

**Last Updated**: June 2026

**Maintainer**: Jaypar Iyar ([@jaypariyar97](https://github.com/jaypariyar97))

**Website**: https://indtransfreightsolutionsllp.vercel.app
