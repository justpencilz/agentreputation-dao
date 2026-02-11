# AgentReputation DAO API Reference

## Program Instructions

### Initialize

Initialize the protocol configuration.

```rust
Initialize {
    min_stake: u64,        // Minimum stake required to vouch
    decay_rate: u64,       // Reputation decay rate per day
    reward_amount: u64,    // Base reward for task completion
}
```

**Accounts:**
- `config` (PDA) - Protocol configuration account
- `authority` (Signer) - Protocol admin
- `system_program` - System program

---

### Register Agent

Register a new agent in the reputation system.

```rust
RegisterAgent {
    name: String,         // Agent display name
    metadata_uri: String, // Optional metadata URI
}
```

**Accounts:**
- `agent_profile` (PDA) - Agent's profile account
- `agent` (Signer) - Agent's wallet
- `reputation_token` - Agent's reputation token account
- `token_program` - SPL Token program
- `system_program` - System program

**Computation:**
```
agent_profile PDA = [b"agent", agent_pubkey]
```

---

### Complete Task

Mark a task as completed and reward the agent.

```rust
CompleteTask {
    task_id: String,     // Unique task identifier
    proof_uri: String,   // URI to task completion proof
}
```

**Accounts:**
- `agent_profile` - Agent's profile account
- `task_record` (PDA) - Task completion record
- `agent` (Signer)
- `config` - Protocol configuration
- `system_program`

---

### Vouch

Stake tokens to vouch for another agent's reputation.

```rust
Vouch {
    target_agent: Pubkey, // Agent being vouched for
    amount: u64,         // Stake amount in lamports
    is_positive: bool,   // true = vouch for, false = vouch against
}
```

**Accounts:**
- `vouch_record` (PDA) - Vouching record
- `voucher_profile` - Voucher's agent profile
- `target_profile` - Target agent's profile
- `voucher` (Signer)
- `stake_vault` - PDA holding staked tokens
- `system_program`

**Computation:**
```
vouch_record PDA = [b"vouch", voucher_pubkey, target_pubkey]
stake_vault PDA = [b"stake", voucher_pubkey, target_pubkey]
```

---

### Decay Reputation

Trigger reputation decay check for an agent.

```rust
Decay {}
```

**Accounts:**
- `agent_profile` - Agent to decay
- `config` - Protocol configuration
- `clock` - Sysvar clock

---

### Query Reputation

Get agent reputation score (read-only).

```rust
QueryReputation {
    agent: Pubkey,
}
```

**Accounts:**
- `agent_profile` - Agent's profile

**Returns:**
```rust
ReputationScore {
    total_score: u64,
    task_count: u64,
    vouch_count: u64,
    positive_vouches: u64,
    negative_vouches: u64,
    last_activity: i64,
    decayed_amount: u64,
}
```

---

## Account Structures

### Config

```rust
pub struct Config {
    pub authority: Pubkey,
    pub min_stake: u64,
    pub decay_rate: u64,
    pub reward_amount: u64,
    pub total_agents: u64,
    pub bump: u8,
}
```

### AgentProfile

```rust
pub struct AgentProfile {
    pub owner: Pubkey,
    pub name: String,
    pub reputation_score: u64,
    pub task_count: u64,
    pub vouch_count: u64,
    pub positive_vouches: u64,
    pub negative_vouches: u64,
    pub staked_amount: u64,
    pub last_activity: i64,
    pub created_at: i64,
    pub bump: u8,
}
```

### VouchRecord

```rust
pub struct VouchRecord {
    pub voucher: Pubkey,
    pub target: Pubkey,
    pub amount: u64,
    pub is_positive: bool,
    pub created_at: i64,
    pub bump: u8,
}
```

### TaskRecord

```rust
pub struct TaskRecord {
    pub agent: Pubkey,
    pub task_id: String,
    pub proof_uri: String,
    pub completed_at: i64,
    pub reward_amount: u64,
    pub verified: bool,
    pub bump: u8,
}
```

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 6000 | InvalidStakeAmount | Stake amount below minimum |
| 6001 | AlreadyRegistered | Agent already registered |
| 6002 | NotRegistered | Agent not found |
| 6003 | InvalidVouch | Cannot vouch for self |
| 6004 | InsufficientReputation | Reputation too low for action |
| 6005 | DecayTooSoon | Decay called too early |
| 6006 | TaskAlreadyComplete | Task already marked complete |
| 6007 | InvalidAuthority | Unauthorized action |
| 6008 | InsufficientStake | Stake amount too low |
| 6009 | VouchNotFound | Vouch record doesn't exist |

---

## JavaScript/TypeScript Client

### Example: Register Agent

```typescript
import { Program, AnchorProvider, web3, utils } from '@coral-xyz/anchor';
import { AgentReputationDao } from './types/agent_reputation_dao';

const program = new Program<AgentReputationDao>(idl, provider);

// Find agent profile PDA
const [agentProfilePda] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from('agent'), wallet.publicKey.toBuffer()],
  program.programId
);

// Register
await program.methods
  .registerAgent('My Agent', 'https://metadata.uri')
  .accounts({
    agentProfile: agentProfilePda,
    agent: wallet.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc();
```

### Example: Vouch

```typescript
const [vouchRecordPda] = web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from('vouch'),
    wallet.publicKey.toBuffer(),
    targetAgent.toBuffer()
  ],
  program.programId
);

await program.methods
  .vouch(targetAgent, new BN(1000000000), true) // 1 SOL, positive vouch
  .accounts({
    vouchRecord: vouchRecordPda,
    voucherProfile: voucherProfilePda,
    targetProfile: targetProfilePda,
    voucher: wallet.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc();
```

---

## Events

### AgentRegistered

```rust
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub name: String,
    pub timestamp: i64,
}
```

### TaskCompleted

```rust
pub struct TaskCompleted {
    pub agent: Pubkey,
    pub task_id: String,
    pub reward: u64,
    pub timestamp: i64,
}
```

### VouchCreated

```rust
pub struct VouchCreated {
    pub voucher: Pubkey,
    pub target: Pubkey,
    pub amount: u64,
    pub is_positive: bool,
    pub timestamp: i64,
}
```

### ReputationDecayed

```rust
pub struct ReputationDecayed {
    pub agent: Pubkey,
    pub amount: u64,
    pub new_score: u64,
    pub timestamp: i64,
}
```
