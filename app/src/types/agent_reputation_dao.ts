export type AgentReputationDao = {
  version: '0.1.0'
  name: 'agentreputation_dao'
  instructions: [
    {
      name: 'initialize'
      accounts: [
        { name: 'config'; isMut: true; isSigner: false }
        { name: 'authority'; isMut: true; isSigner: true }
        { name: 'systemProgram'; isMut: false; isSigner: false }
      ]
      args: [
        { name: 'minStake'; type: 'u64' }
        { name: 'decayRate'; type: 'u64' }
        { name: 'rewardAmount'; type: 'u64' }
      ]
    },
    {
      name: 'registerAgent'
      accounts: [
        { name: 'agentProfile'; isMut: true; isSigner: false }
        { name: 'agent'; isMut: true; isSigner: true }
        { name: 'systemProgram'; isMut: false; isSigner: false }
      ]
      args: [
        { name: 'name'; type: 'string' }
        { name: 'metadataUri'; type: 'string' }
      ]
    },
    {
      name: 'completeTask'
      accounts: [
        { name: 'agentProfile'; isMut: true; isSigner: false }
        { name: 'taskRecord'; isMut: true; isSigner: false }
        { name: 'agent'; isMut: true; isSigner: true }
        { name: 'config'; isMut: false; isSigner: false }
        { name: 'systemProgram'; isMut: false; isSigner: false }
      ]
      args: [
        { name: 'taskId'; type: 'string' }
        { name: 'proofUri'; type: 'string' }
      ]
    },
    {
      name: 'vouch'
      accounts: [
        { name: 'vouchRecord'; isMut: true; isSigner: false }
        { name: 'voucherProfile'; isMut: false; isSigner: false }
        { name: 'targetProfile'; isMut: true; isSigner: false }
        { name: 'voucher'; isMut: true; isSigner: true }
        { name: 'stakeVault'; isMut: true; isSigner: false }
        { name: 'systemProgram'; isMut: false; isSigner: false }
      ]
      args: [
        { name: 'targetAgent'; type: 'publicKey' }
        { name: 'amount'; type: 'u64' }
        { name: 'isPositive'; type: 'bool' }
      ]
    },
    {
      name: 'decay'
      accounts: [
        { name: 'agentProfile'; isMut: true; isSigner: false }
        { name: 'config'; isMut: false; isSigner: false }
      ]
      args: []
    },
    {
      name: 'queryReputation'
      accounts: [{ name: 'agentProfile'; isMut: false; isSigner: false }]
      args: []
    }
  ]
  accounts: {
    config: {
      authority: PublicKey
      minStake: any
      decayRate: any
      rewardAmount: any
      totalAgents: any
      bump: number
    }
    agentProfile: {
      owner: PublicKey
      name: string
      reputationScore: any
      taskCount: any
      vouchCount: any
      positiveVouches: any
      negativeVouches: any
      stakedAmount: any
      lastActivity: any
      createdAt: any
      bump: number
    }
    vouchRecord: {
      voucher: PublicKey
      target: PublicKey
      amount: any
      isPositive: boolean
      createdAt: any
      bump: number
    }
  }
  errors: [
    { code: 6000; name: 'InvalidStakeAmount'; msg: 'Stake amount below minimum' },
    { code: 6001; name: 'AlreadyRegistered'; msg: 'Agent already registered' },
    { code: 6002; name: 'NotRegistered'; msg: 'Agent not found' },
    { code: 6003; name: 'InvalidVouch'; msg: 'Cannot vouch for self' },
    { code: 6004; name: 'InsufficientReputation'; msg: 'Reputation too low for action' },
    { code: 6005; name: 'DecayTooSoon'; msg: 'Decay called too early' },
    { code: 6006; name: 'TaskAlreadyComplete'; msg: 'Task already marked complete' },
    { code: 6007; name: 'InvalidAuthority'; msg: 'Unauthorized action' },
    { code: 6008; name: 'InsufficientStake'; msg: 'Stake amount too low' },
    { code: 6009; name: 'VouchNotFound'; msg: 'Vouch record does not exist' }
  ]
}

import { PublicKey } from '@solana/web3.js'
