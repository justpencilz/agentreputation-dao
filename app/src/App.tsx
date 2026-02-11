import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

import { useAgentProgram } from './hooks/useAgentProgram'
import { useAgentProfile } from './hooks/useAgentProfile'

function App() {
  const { connected, publicKey } = useWallet()
  const [agentName, setAgentName] = useState('')
  const [vouchTarget, setVouchTarget] = useState('')
  const [vouchAmount, setVouchAmount] = useState('1.0')
  const [vouchType, setVouchType] = useState<'positive' | 'negative'>('positive')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { program, loading: programLoading } = useAgentProgram()
  const { profile, loading: profileLoading, refresh } = useAgentProfile(publicKey)

  const showError = (msg: string) => {
    setError(msg)
    setSuccess(null)
    setTimeout(() => setError(null), 5000)
  }

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setError(null)
    setTimeout(() => setSuccess(null), 5000)
  }

  // Register agent
  const handleRegister = async () => {
    if (!program || !publicKey || !agentName.trim()) return
    
    try {
      setError(null)
      
      // Find agent profile PDA
      const [agentProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), publicKey.toBuffer()],
        program.programId
      )

      await program.methods
        .registerAgent(agentName, '')
        .accounts({
          agentProfile: agentProfilePda,
          agent: publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc()

      showSuccess('Agent registered successfully!')
      refresh()
      setAgentName('')
    } catch (err: any) {
      showError(err.message || 'Failed to register agent')
    }
  }

  // Vouch for agent
  const handleVouch = async () => {
    if (!program || !publicKey || !vouchTarget.trim()) return
    
    try {
      setError(null)
      
      const targetPubkey = new PublicKey(vouchTarget)
      const amount = new BN(parseFloat(vouchAmount) * 1e9) // Convert SOL to lamports

      // Find PDAs
      const [voucherProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), publicKey.toBuffer()],
        program.programId
      )
      const [targetProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), targetPubkey.toBuffer()],
        program.programId
      )
      const [vouchRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vouch'), publicKey.toBuffer(), targetPubkey.toBuffer()],
        program.programId
      )
      const [stakeVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('stake'), publicKey.toBuffer(), targetPubkey.toBuffer()],
        program.programId
      )

      await program.methods
        .vouch(targetPubkey, amount, vouchType === 'positive')
        .accounts({
          vouchRecord: vouchRecordPda,
          voucherProfile: voucherProfilePda,
          targetProfile: targetProfilePda,
          voucher: publicKey,
          stakeVault: stakeVaultPda,
          systemProgram: PublicKey.default,
        })
        .rpc()

      showSuccess(`Vouched ${vouchAmount} SOL ${vouchType === 'positive' ? 'for' : 'against'} agent!`)
      setVouchTarget('')
      setVouchAmount('1.0')
      refresh()
    } catch (err: any) {
      showError(err.message || 'Failed to vouch')
    }
  }

  const getScoreClass = (score: number) => {
    if (score >= 7000) return 'score-high'
    if (score >= 4000) return 'score-medium'
    return 'score-low'
  }

  if (!connected) {
    return (
      <div className="container">
        <header>
          <h1>🤖 AgentReputation DAO</h1>
        </header>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Welcome to AgentReputation DAO</h2>
          <p style={{ margin: '20px 0', opacity: 0.8 }}>
            A decentralized reputation protocol for AI agents on Solana.
          </p>
          <p style={{ marginBottom: '30px', opacity: 0.6 }}>
            Connect your wallet to get started.
          </p>
          <WalletMultiButton />
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>🤖 AgentReputation DAO</h1>
        <WalletMultiButton />
      </header>

      {error && <div className="error">{error}</div>}
      {success && <div className="card" style={{ background: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ade80' }}>{success}</div>}

      <div className="grid">
        {/* Agent Profile Card */}
        <div className="card">
          <h2>Your Profile</h2>
          {profileLoading ? (
            <div className="loading">Loading...</div>
          ) : profile ? (
            <>
              <div className={`score-display ${getScoreClass(profile.reputationScore)}`}>
                {profile.reputationScore.toLocaleString()}
              </div>
              <p style={{ textAlign: 'center', opacity: 0.7 }}>Reputation Score</p>
              
              <div style={{ marginTop: '20px' }}>
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Tasks:</strong> {profile.taskCount.toString()}</p>
                <p><strong>Vouches:</strong> {profile.vouchCount.toString()}</p>
                <p><strong>Staked:</strong> {(profile.stakedAmount.toNumber() / 1e9).toFixed(2)} SOL</p>
                <p className="address">{publicKey?.toString()}</p>
              </div>
            </>
          ) : (
            <>
              <p style={{ marginBottom: '16px', opacity: 0.7 }}>
                You are not registered as an agent.
              </p>
              <input
                type="text"
                className="input"
                placeholder="Agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <button
                className="button"
                onClick={handleRegister}
                disabled={!agentName.trim() || programLoading}
              >
                {programLoading ? 'Registering...' : 'Register Agent'}
              </button>
            </>
          )}
        </div>

        {/* Vouch Card */}
        <div className="card">
          <h2>Vouch for Agent</h2>
          <p style={{ marginBottom: '16px', opacity: 0.7 }}>
            Stake SOL to vouch for or against another agent's reputation.
          </p>
          
          <input
            type="text"
            className="input"
            placeholder="Target agent address"
            value={vouchTarget}
            onChange={(e) => setVouchTarget(e.target.value)}
          />
          
          <input
            type="number"
            className="input"
            placeholder="Amount (SOL)"
            value={vouchAmount}
            onChange={(e) => setVouchAmount(e.target.value)}
            min="0.1"
            step="0.1"
          />
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              className="button"
              style={{ 
                flex: 1,
                background: vouchType === 'positive' ? '#4ade80' : undefined
              }}
              onClick={() => setVouchType('positive')}
            >
              👍 Positive
            </button>
            <button
              className="button"
              style={{ 
                flex: 1,
                background: vouchType === 'negative' ? '#f87171' : undefined
              }}
              onClick={() => setVouchType('negative')}
            >
              👎 Negative
            </button>
          </div>
          
          <button
            className="button"
            onClick={handleVouch}
            disabled={!vouchTarget.trim() || programLoading}
          >
            {programLoading ? 'Vouching...' : `Vouch ${vouchAmount} SOL`}
          </button>
        </div>

        {/* About Card */}
        <div className="card">
          <h2>About Staked Vouching</h2>
          <p style={{ marginBottom: '12px', opacity: 0.9 }}>
            Unlike traditional reputation systems, we use <strong>economic backing</strong> via staked vouches:
          </p>
          <ul style={{ paddingLeft: '20px', opacity: 0.8 }}>
            <li>Stake SOL to vouch for others</li>
            <li>Staked amount = economic collateral</li>
            <li>Bad actors lose stake through slashing</li>
            <li>Weighted trust based on stake size</li>
          </ul>
          <p style={{ marginTop: '16px', fontSize: '0.9rem', opacity: 0.6 }}>
            This is the unique feature that differentiates us from competitors.
          </p>
        </div>

        {/* Stats Card */}
        <div className="card">
          <h2>Protocol Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00d4ff' }}>
                --
              </div>
              <p style={{ opacity: 0.7 }}>Total Agents</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00d4ff' }}>
                --
              </div>
              <p style={{ opacity: 0.7 }}>Total Staked</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00d4ff' }}>
                --
              </div>
              <p style={{ opacity: 0.7 }}>Vouches</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00d4ff' }}>
                --
              </div>
              <p style={{ opacity: 0.7 }}>Tasks</p>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ marginTop: '40px', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>
        <p>Agent ID: 1630 | Built for Colosseum Agent Hackathon</p>
      </footer>
    </div>
  )
}

export default App
