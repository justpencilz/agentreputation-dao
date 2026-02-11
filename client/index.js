const anchor = require('@coral-xyz/anchor');
const { PublicKey, SystemProgram } = require('@solana/web3.js');
const { BN } = require('@coral-xyz/anchor');

const PROGRAM_ID = process.env.PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

class AgentReputationClient {
  constructor(connection, wallet) {
    this.provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
    anchor.setProvider(this.provider);
    
    const idl = require('../target/idl/agentreputation_dao.json');
    this.program = new anchor.Program(idl, PROGRAM_ID, this.provider);
  }

  async getAgentProfilePDA(agentPubkey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), agentPubkey.toBuffer()],
      this.program.programId
    );
  }

  async getVouchRecordPDA(voucherPubkey, targetPubkey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vouch'), voucherPubkey.toBuffer(), targetPubkey.toBuffer()],
      this.program.programId
    );
  }

  async getStakeVaultPDA(voucherPubkey, targetPubkey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('stake'), voucherPubkey.toBuffer(), targetPubkey.toBuffer()],
      this.program.programId
    );
  }

  async registerAgent(name, metadataUri = '') {
    const [agentProfilePda] = await this.getAgentProfilePDA(this.provider.publicKey);

    return await this.program.methods
      .registerAgent(name, metadataUri)
      .accounts({
        agentProfile: agentProfilePda,
        agent: this.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async vouch(targetPubkey, amountLamports, isPositive = true) {
    const [vouchRecordPda] = await this.getVouchRecordPDA(this.provider.publicKey, targetPubkey);
    const [voucherProfilePda] = await this.getAgentProfilePDA(this.provider.publicKey);
    const [targetProfilePda] = await this.getAgentProfilePDA(targetPubkey);
    const [stakeVaultPda] = await this.getStakeVaultPDA(this.provider.publicKey, targetPubkey);

    return await this.program.methods
      .vouch(targetPubkey, new BN(amountLamports), isPositive)
      .accounts({
        vouchRecord: vouchRecordPda,
        voucherProfile: voucherProfilePda,
        targetProfile: targetProfilePda,
        voucher: this.provider.publicKey,
        stakeVault: stakeVaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async completeTask(taskId, proofUri = '') {
    const [agentProfilePda] = await this.getAgentProfilePDA(this.provider.publicKey);
    const taskRecordPda = PublicKey.findProgramAddressSync(
      [Buffer.from('task'), this.provider.publicKey.toBuffer(), Buffer.from(taskId)],
      this.program.programId
    )[0];

    // Get config PDA
    const configPda = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.program.programId
    )[0];

    return await this.program.methods
      .completeTask(taskId, proofUri)
      .accounts({
        agentProfile: agentProfilePda,
        taskRecord: taskRecordPda,
        agent: this.provider.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async triggerDecay(agentPubkey) {
    const [agentProfilePda] = await this.getAgentProfilePDA(agentPubkey);
    const configPda = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.program.programId
    )[0];

    return await this.program.methods
      .decay()
      .accounts({
        agentProfile: agentProfilePda,
        config: configPda,
      })
      .rpc();
  }

  async getReputation(agentPubkey) {
    const [agentProfilePda] = await this.getAgentProfilePDA(agentPubkey);
    return await this.program.account.agentProfile.fetchNullable(agentProfilePda);
  }

  async getVouchRecord(voucherPubkey, targetPubkey) {
    const [vouchRecordPda] = await this.getVouchRecordPDA(voucherPubkey, targetPubkey);
    return await this.program.account.vouchRecord.fetchNullable(vouchRecordPda);
  }
}

module.exports = { AgentReputationClient };

// Example usage
if (require.main === module) {
  const { Connection, Keypair } = require('@solana/web3.js');
  
  async function main() {
    const connection = new Connection('https://api.devnet.solana.com');
    const wallet = Keypair.generate(); // Use actual wallet in production
    
    // Airdrop for testing
    await connection.requestAirdrop(wallet.publicKey, 2 * 1e9);
    
    const client = new AgentReputationClient(connection, wallet);
    
    console.log('Client initialized for:', wallet.publicKey.toString());
    
    // Example: Register agent
    // const tx = await client.registerAgent('Test Agent');
    // console.log('Registered:', tx);
  }
  
  main().catch(console.error);
}
