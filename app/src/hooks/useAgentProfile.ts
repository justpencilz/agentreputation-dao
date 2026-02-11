import { useEffect, useState, useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'
import type { Program } from '@coral-xyz/anchor'
import { useAgentProgram } from './useAgentProgram'
import type { AgentReputationDao } from '../types/agent_reputation_dao'

export interface AgentProfile {
  owner: PublicKey
  name: string
  reputationScore: number
  taskCount: number
  vouchCount: number
  positiveVouches: number
  negativeVouches: number
  stakedAmount: any
  lastActivity: number
  createdAt: number
  bump: number
}

export function useAgentProfile(publicKey: PublicKey | null) {
  const { program } = useAgentProgram()
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!program || !publicKey) {
      setProfile(null)
      return
    }

    try {
      setLoading(true)

      // Find agent profile PDA
      const [agentProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), publicKey.toBuffer()],
        program.programId
      )

      // Try to fetch profile
      const account = await program.account.agentProfile.fetchNullable(agentProfilePda)
      
      if (account) {
        setProfile({
          owner: account.owner,
          name: account.name,
          reputationScore: account.reputationScore.toNumber(),
          taskCount: account.taskCount.toNumber(),
          vouchCount: account.vouchCount.toNumber(),
          positiveVouches: account.positiveVouches.toNumber(),
          negativeVouches: account.negativeVouches.toNumber(),
          stakedAmount: account.stakedAmount,
          lastActivity: account.lastActivity.toNumber(),
          createdAt: account.createdAt.toNumber(),
          bump: account.bump,
        })
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [program, publicKey])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, refresh: fetchProfile }
}
