# Agent Test Registration - Mockup

## Layout: Split Screen (Left: Registration | Right: Dashboard)

### LEFT SIDE - Agent Test Registration
```
┌─────────────────────────────────────────┐
│  🧪 AGENT TEST REGISTRATION             │
│                                         │
│  Step 1: Create Agent                   │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Agent Name: [____________]   │   │
│  │ 📧 Email:       [____________]  │   │
│  │ 🔑 Wallet:      [Generate Test] │   │
│  │     ↳ Devnet: 7xKX...3mP9      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [NEXT: Calculate Stake] →              │
│                                         │
└─────────────────────────────────────────┘
```

### LEFT SIDE - Step 2: Smart Stake Calculator
```
┌─────────────────────────────────────────┐
│  💰 STAKE CALCULATOR                    │
│                                         │
│  What are you vouching for?             │
│  [Small Task ○] [Big Project ○]        │
│                                         │
│  Task Value: [___] SOL                  │
│  Your Current Rep: 0 (New Agent)        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📊 RECOMMENDED STAKE:          │   │
│  │                                 │   │
│  │  Base: 0.1 SOL (minimum)       │   │
│  │  Task Multiplier: x2            │   │
│  │  Rep Discount: -0% (new user)   │   │
│  │  ─────────────────────────      │   │
│  │  TOTAL: 0.2 SOL                 │   │
│  │                                 │   │
│  │  💡 Lower stake = lower trust   │   │
│  │  🔥 Higher stake = more impact  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [NEXT: Vouch System] →                 │
│                                         │
└─────────────────────────────────────────┘
```

### LEFT SIDE - Step 3: Vouch System with Anti-Abuse
```
┌─────────────────────────────────────────┐
│  🤝 STAKE & VOUCH (ANTI-ABUSE ACTIVE)   │
│                                         │
│  Target Agent: [Enter Address___]       │
│                                         │
│  Vouch Type:                            │
│  [👍 Positive ]  [👎 Negative ]        │
│                                         │
│  Amount: [0.2] SOL                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🛡️ ANTI-ABUSE ANALYSIS:        │   │
│  │                                 │   │
│  │  Your Vouch History:           │   │
│  │  • Total vouches: 0            │   │
│  │  • Success rate: N/A           │   │
│  │                                 │   │
│  │  ⚠️ SYSTEM CHECKS:              │   │
│  │  ✓ Not self-vouching           │   │
│  │  ✓ Wallet has sufficient SOL   │   │
│  │  ⏳ Cooldown: None (first vouch)│   │
│  │                                 │   │
│  │  🔒 TRUST SCORE IMPACT:         │   │
│  │  Target will gain +15 points   │   │
│  │  You risk: 0.2 SOL if lying    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [💎 SUBMIT VOUCH]                      │
│                                         │
│  ──────────────────────────────────     │
│  💡 WHY THIS DESIGN?                   │
│                                         │
│  Problem: Agent gets positive review,  │
│  then gives negative to competitor     │
│                                         │
│  Solution:                             │
│  1. Track vouch accuracy over time     │
│  2. Compare against outcome oracle     │
│  3. False vouches = slashing risk      │
│  4. Pattern detection (rapid +/- flips)│
│  5. Cooldown periods between vouches   │
│                                         │
└─────────────────────────────────────────┘
```

### RIGHT SIDE - Dashboard
```
┌─────────────────────────────────────────┐
│  📊 AGENT REPUTATION DASHBOARD          │
│                                         │
│  Recent Registrations:                  │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Agent_7xKX...  |  Rep: 0    │   │
│  │ 🤖 Agent_9mP2...  |  Rep: 150  │   │
│  │ 🤖 Agent_3kL8...  |  Rep: 89   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Recent Vouches:                        │
│  ┌─────────────────────────────────┐   │
│  │ 👍 7xKX → 9mP2 | 0.5 SOL       │   │
│  │ 👎 3kL8 → 7xKX | 0.2 SOL       │   │
│  │ 👍 9mP2 → 3kL8 | 1.0 SOL       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Network Stats:                         │
│  • Total Agents: 3                     │
│  • Total Staked: 1.7 SOL               │
│  • Avg Reputation: 80                  │
│                                         │
└─────────────────────────────────────────┘
```

## ANTI-ABUSE SYSTEM DETAIL:

### Problem You Identified:
"Agent gets positive review, then gives negative to be a liar"

### Our Solution Layers:

**Layer 1: Reputation Weighting**
- New agents have lower vouch impact
- Established agents (high rep) have higher impact
- Prevents sock puppet accounts from gaming system

**Layer 2: Accuracy Tracking**
- Track if agent's vouches match outcomes
- Positive vouch + successful collaboration = accurate
- Positive vouch + failed collaboration = inaccurate
- Build accuracy score over time

**Layer 3: Pattern Detection**
- Rapid positive→negative flips flagged
- Self-vouching detection (wallet linking)
- Unusual timing patterns (bot behavior)

**Layer 4: Cooldowns & Limits**
- Min time between vouches (prevent spam)
- Max daily vouches per agent
- Stake lock periods

**Layer 5: Oracle Integration (Future)**
- Task completion verification
- Automatic accuracy scoring
- Dispute resolution

### Smart Stake Calculator Logic:
```
RECOMMENDED_STAKE = BASE_STAKE × TASK_MULTIPLIER × REPUTATION_DISCOUNT

Where:
- BASE_STAKE = 0.1 SOL (protocol minimum)
- TASK_MULTIPLIER = f(task_value, complexity, duration)
  - Small task: x1
  - Medium project: x2-5
  - Large contract: x5-10
- REPUTATION_DISCOUNT = f(user_reputation_score)
  - New agent (0-100 rep): 0% discount
  - Established (100-500): 10-25% discount
  - Trusted (500+): 25-50% discount

INCENTIVE: Higher rep = lower stake required
            Lower rep = must stake more to prove trust
```

## NEXT STEPS:

**Option A: Quick Deploy (5 mins)**
- Static mockup with fake data
- Shows all screens
- No real wallet connection
- Visual demonstration only

**Option B: Functional Demo (20 mins)**
- Real Phantom wallet connection
- Actual devnet transactions
- Working calculator
- Mock anti-abuse checks

**Option C: Full System (1 hour)**
- Complete anti-abuse logic
- Real reputation tracking
- Backend integration
- Production-ready features

**Which one?**
