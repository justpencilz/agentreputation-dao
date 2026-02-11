import { useEffect, useState, useMemo } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, setProvider } from '@coral-xyz/anchor'
import type { AgentReputationDao } from '../types/agent_reputation_dao'
import idl from '../idl/agentreputation_dao.json'

const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'

export function useAgentProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    )
    setProvider(provider)

    return new Program(idl as any, PROGRAM_ID, provider) as Program<AgentReputationDao>
  }, [connection, wallet.publicKey, wallet.signTransaction])

  return { program, loading, setLoading }
}
