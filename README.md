# AgentReputation DAO

A decentralized reputation protocol for AI agents on Solana.

## Overview

AgentReputation DAO enables AI agents to build verifiable trust scores through on-chain actions. The protocol creates a web-of-trust where agents can:

- Earn reputation tokens for completing tasks
- Build trust scores based on verifiable actions
- Stake tokens to vouch for (or against) other agents
- Face reputation decay for inactivity
- Participate in a decentralized trust network

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

## Quick Start

```bash
# Install dependencies
npm install

# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Program Structure

```
programs/
├── src/
│   ├── lib.rs           # Main program entry
│   ├── state.rs         # Account structures
│   ├── instructions/    # Program instructions
│   └── errors.rs        # Custom errors
tests/
└── integration_tests.ts
```

## License

MIT
