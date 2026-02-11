# AgentReputation DAO Architecture

## System Overview

AgentReputation DAO is a decentralized reputation protocol built on Solana using the Anchor framework. It creates a web-of-trust for AI agents where reputation is backed by economic stake.

```
┌─────────────────────────────────────────────────────────────┐
│                    AgentReputation DAO                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Agent A   │  │   Agent B   │  │      Agent C        │ │
│  │  (Voucher)  │──│  (Target)   │  │   (Another Agent)   │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
│         │                │                                  │
│         │   STAKE        │                                  │
│         │   (1 SOL)      │                                  │
│         ▼                ▼                                  │
│  ┌─────────────────────────────────────┐                   │
│  │         Vouch Record PDA            │                   │
│  │  ├ voucher: Agent A                 │                   │
│  │  ├ target: Agent B                  │                   │
│  │  ├ amount: 1 SOL                    │                   │
│  │  ├ is_positive: true                │                   │
│  │  └ created_at: timestamp            │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │      Agent Profile PDA (Agent B)    │                   │
│  │  ├ owner: Agent B pubkey            │                   │
│  │  ├ reputation_score: 1000           │                   │
│  │  ├ positive_vouches: 5              │                   │
│  │  ├ negative_vouches: 1              │                   │
│  │  ├ staked_amount: 10 SOL            │                   │
│  │  └ last_activity: timestamp         │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### 1. Staked Vouching (Unique Feature)

Unlike traditional reputation systems that rely on ratings or reviews, AgentReputation DAO uses **economic backing**:

- **Voucher** stakes SOL to vouch for another agent
- **Positive vouch**: Increases target's reputation
- **Negative vouch**: Decreases target's reputation
- **Stake at risk**: If target acts badly, voucher loses stake

This creates a **web-of-trust with economic weight** - you only vouch for agents you truly trust because your money is on the line.

### 2. Reputation Score Calculation

```
base_score = 100
positive_boost = positive_vouches * avg_stake_per_vouch * 10
negative_penalty = negative_vouches * avg_stake_per_vouch * 15
task_bonus = completed_tasks * 50

total_score = base_score + positive_boost - negative_penalty + task_bonus
```

**Key properties:**
- Negative vouches weighted more heavily (15x vs 10x)
- Larger stakes = bigger reputation impact
- Decay reduces score for inactive agents

### 3. Decay Mechanism

Prevents reputation hoarding and encourages continued participation:

```
decay_amount = (current_time - last_activity) / decay_rate * current_score * 0.01
new_score = max(current_score - decay_amount, 100)  # Floor at 100
```

- Default decay: 1% per day of inactivity
- Can be called by anyone (permissionless)
- Creates economic incentive to stay active

## Account Structure

### PDAs (Program Derived Addresses)

| PDA | Seeds | Purpose |
|-----|-------|---------|
| `Config` | `["config"]` | Protocol parameters |
| `AgentProfile` | `["agent", agent_pubkey]` | Agent's reputation data |
| `VouchRecord` | `["vouch", voucher_pubkey, target_pubkey]` | Vouching relationship |
| `TaskRecord` | `["task", agent_pubkey, task_id]` | Completed task proof |

### Account Relationships

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   Config    │◄────────│  AgentProfile   │◄────────│ VouchRecord │
│  (Single)   │         │   (Per Agent)   │         │  (Per Pair) │
└─────────────┘         └─────────────────┘         └─────────────┘
        │                      │                            │
        │                      │                            │
        ▼                      ▼                            ▼
  ├─ min_stake           ├─ reputation_score          ├─ amount
  ├─ decay_rate          ├─ task_count                ├─ is_positive
  ├─ reward_amount       ├─ vouch_count               └─ created_at
  └─ total_agents        ├─ staked_amount
                         └─ last_activity
```

## Instruction Flow

### Register Agent

```
1. User calls register_agent(name, metadata_uri)
2. Program creates AgentProfile PDA
3. Program initializes reputation token account
4. Event: AgentRegistered emitted
```

### Complete Task

```
1. Agent calls complete_task(task_id, proof_uri)
2. Program creates TaskRecord PDA
3. Program mints reputation tokens to agent
4. Program updates AgentProfile task_count
5. Program updates last_activity
6. Event: TaskCompleted emitted
```

### Vouch

```
1. Voucher calls vouch(target, amount, is_positive)
2. Program transfers SOL from voucher to stake vault
3. Program creates/updates VouchRecord PDA
4. Program updates target's AgentProfile
   - If positive: increment positive_vouches, add to score
   - If negative: increment negative_vouches, subtract from score
5. Program updates voucher's staked_amount
6. Event: VouchCreated emitted
```

### Decay

```
1. Anyone calls decay(agent_pubkey)
2. Program checks: time_since_last_activity > decay_interval
3. Program calculates decay_amount
4. Program reduces agent's reputation_score
5. Program updates last_activity to now
6. Event: ReputationDecayed emitted
```

## Security Considerations

### Economic Attacks

| Attack Vector | Mitigation |
|---------------|------------|
| **Sybil Attack** | Stake required to vouch; expensive to create fake agents |
| **Reputation Inflation** | Decay mechanism prevents hoarding; stake slashing for bad vouches |
| **Collusion** | Negative vouches weighted higher; public vouch records traceable |
| **Nothing at Stake** | Vouchers lock SOL; can't vouch without collateral |

### Program Security

- **PDA validation**: All accounts verified via seeds
- **Signer checks**: Critical operations require agent signature
- **Arithmetic**: Using checked math to prevent overflows
- **Reentrancy**: Solana's account model prevents classic reentrancy

## Comparison: Our Approach vs Competitors

### Traditional Reputation (Web2)
- **Mechanism**: Ratings, reviews, karma points
- **Problem**: No economic backing, easily gamed
- **Example**: Reddit karma, Uber ratings

### Job Marketplace (George's approach)
- **Mechanism**: Escrow + ratings after job completion
- **Problem**: Reputation only within platform, no cross-platform trust
- **Example**: Upwork, Fiverr

### **Our Approach: Staked Vouching**
- **Mechanism**: Economic stake backing every reputation signal
- **Advantage**: Trust is portable, stake makes it costly to lie
- **Innovation**: Web-of-trust graph with weighted edges (stake amount)

## Scalability

### Current Limits (Devnet)

| Metric | Value |
|--------|-------|
| Max agents | Unlimited (PDA space) |
| Max vouches per agent | ~10,000 (account size limit) |
| Transaction cost | ~0.005 SOL |
| Decay check cost | ~0.002 SOL |

### Future Optimizations

1. **Compression**: Use Solana's account compression for vouch records
2. **Batched operations**: Multiple decays in one transaction
3. **Off-chain indexing**: Query reputation via RPC, not on-chain iteration

## Integration Points

### For AI Agents

```typescript
// Check if agent can be trusted
const canTrust = await program.methods
  .queryReputation(targetAgent)
  .accounts({ agentProfile: targetProfile })
  .view();

if (canTrust.total_score > 500 && canTrust.positive_vouches > 3) {
  // Proceed with high-trust action
}
```

### For Other Protocols

- **Lending**: Use reputation score for credit limits
- **Governance**: Weight votes by reputation
- **Access control**: Reputation-gated features
- **Orchestration**: High-rep agents get priority

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                 │
│              ├─ Wallet Adapter                      │
│              ├─ Anchor Client                       │
│              └─ Real-time updates                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ RPC + WebSocket
                      ▼
┌─────────────────────────────────────────────────────┐
│              Solana Devnet/Mainnet                  │
│                                                     │
│  ┌─────────────────┐    ┌───────────────────────┐  │
│  │ AgentReputation │    │ Other Programs        │  │
│  │ DAO Program     │◄──►│ (SPL Token, etc)      │  │
│  └─────────────────┘    └───────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Roadmap

### Phase 1: MVP (Hackathon)
- ✅ Core program with 7 instructions
- ✅ Basic frontend
- ✅ Integration tests
- 🔄 Devnet deployment

### Phase 2: Mainnet
- Security audit
- Bug bounty program
- Mainnet deployment

### Phase 3: Ecosystem
- Reputation oracles
- Cross-program integrations
- Governance token

---

**Built for Colosseum Agent Hackathon**
