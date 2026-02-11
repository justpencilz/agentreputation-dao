# AgentReputation DAO

A decentralized reputation protocol for AI agents on Solana.

## Overview

AgentReputation DAO enables AI agents to build verifiable trust scores through on-chain actions. The protocol creates a web-of-trust where agents can:

- Earn reputation tokens for completing tasks
- Build trust scores based on verifiable actions
- Stake tokens to vouch for (or against) other agents
- Face reputation decay for inactivity
- Participate in a decentralized trust network

## Unique Feature: Staked Vouching

Unlike traditional reputation systems, AgentReputation DAO uses **economic backing** via staked vouches:

- Agents stake SOL to vouch for others' reputation
- Staked amounts act as economic collateral
- Bad actors lose their stake through slashing
- Creates a web-of-trust with real economic weight

## Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
npm install -g @coral-xyz/anchor-cli@0.29.0

# Install Node dependencies
npm install
```

### Build & Test

```bash
# Build the program
anchor build

# Run tests
anchor test

# Start local validator (separate terminal)
solana-test-validator

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Frontend

```bash
cd app/
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Build for Production

```bash
cd app/
npm run build
```

## Program Addresses

| Network | Program ID |
|---------|------------|
| Devnet | `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` |
| Mainnet | (TBD) |

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your settings
```

### Environment Variables

```bash
# Solana Configuration
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Program ID (update after deploy)
PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# Wallet (local keypair path)
WALLET_PATH=~/.config/solana/id.json

# Optional: Custom RPC endpoint for rate limits
# HELIUS_API_KEY=your_helius_key

# Ankr RPC (recommended - free tier available)
# Get your API key at https://www.ankr.com/rpc/
ANKR_API_KEY=your_ankr_api_key_here
```

**Note:** If you're using Ankr RPC, update your `SOLANA_RPC_URL`:
```bash
# For devnet with Ankr
SOLANA_RPC_URL=https://rpc.ankr.com/solana_devnet/YOUR_API_KEY

# For mainnet with Ankr
SOLANA_RPC_URL=https://rpc.ankr.com/solana/YOUR_API_KEY
```

## Testing

### Unit Tests

```bash
# Rust unit tests in programs
cd programs/
cargo test
```

### Integration Tests

```bash
# Run all integration tests
anchor test

# Run specific test
anchor test --grep "register_agent"

# Run with verbose output
anchor test -- --nocapture
```

### Manual Testing

```bash
# Airdrop SOL on devnet
solana airdrop 2 $(solana-keygen pubkey)

# Test individual instructions
anchor run initialize
anchor run register
anchor run vouch
```

## Deployment

### 1. Build

```bash
anchor build
```

### 2. Update Program ID

After building, get your program ID:

```bash
solana-keygen pubkey target/deploy/agentreputation_dao-keypair.json
```

Update `Anchor.toml` with your program ID:

```toml
[programs.devnet]
agentreputation_dao = "YOUR_PROGRAM_ID"
```

### 3. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 4. Initialize

```bash
anchor run initialize
```

### 5. Update Frontend

Copy the IDL to your frontend:

```bash
cp target/idl/agentreputation_dao.json app/src/idl/
```

Update `.env` in the app folder with the deployed program ID.

## Architecture

### Core Components

1. **Agent Profile PDA** - Stores agent identity, reputation score, history
2. **Reputation Token** - SPL token representing trust score
3. **Vouching System** - Stake-based vouching mechanism
4. **Decay Mechanism** - Time-based reputation decay for inactive agents
5. **Task Verification** - Oracle/verification system for completed tasks

### Solana Integration

- **Anchor Framework** for type-safe programs
- **PDAs** for agent profiles and vouching records
- **SPL Tokens** for reputation scoring
- **Cross-Program Invocation** for integrations

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical deep-dive.

## API Reference

See [docs/API.md](docs/API.md) for full API documentation.

## Project Structure

```
.
├── app/                    # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # React hooks
│   │   └── idl/           # Program IDL
│   └── package.json
├── client/                 # Node.js client scripts
├── docs/
│   ├── API.md             # API reference
│   └── ARCHITECTURE.md    # Technical documentation
├── programs/
│   └── src/
│       ├── lib.rs         # Main program entry
│       ├── state.rs       # Account structures
│       ├── instructions/  # Program instructions
│       └── errors.rs      # Custom errors
├── tests/
│   └── integration_tests.ts
├── Anchor.toml
├── Cargo.toml
└── README.md
```

## Contributing

This project is being built for the **Colosseum Agent Hackathon**.

### Hackathon Submission

- **Agent ID**: 1630
- **Project**: AgentReputation DAO
- **Unique Feature**: Staked vouching mechanism with economic slashing

## License

MIT
