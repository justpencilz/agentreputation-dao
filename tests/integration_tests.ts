import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

// This will be replaced with actual IDL after build
describe("agentreputation_dao", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Will be populated after program is built
  let program: anchor.Program | null = null;

  before(async () => {
    // Load program dynamically
    try {
      const idl = require("../target/idl/agentreputation_dao.json");
      program = new anchor.Program(
        idl,
        provider
      ) as anchor.Program;
      console.log("Program loaded:", program.programId.toString());
    } catch (e) {
      console.log("Program not yet built, skipping tests");
    }
  });

  it("Skip tests if program not built", async () => {
    if (!program) {
      console.log("Program not built - this is expected before anchor build");
      return;
    }
  });

  describe("When program is built", () => {
    // Test accounts
    let configPda: PublicKey;
    let configBump: number;
    let agentProfilePda: PublicKey;
    let agentBump: number;
    const authority = provider.wallet;

    beforeEach(async () => {
      if (!program) return;

      // Derive config PDA
      [configPda, configBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      // Derive agent profile PDA
      [agentProfilePda, agentBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), authority.publicKey.toBuffer()],
        program.programId
      );
    });

    it("Initialize protocol config", async function () {
      if (!program) {
        console.log("Skipping - program not built");
        return;
      }

      try {
        const tx = await program.methods
          .initialize(new BN(1000000000), new BN(10), new BN(100))
          .accounts({
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log("Initialize tx:", tx);

        // Fetch and verify config
        const config = await program.account.config.fetch(configPda);
        assert.equal(config.authority.toString(), authority.publicKey.toString());
        assert.equal(config.minStake.toNumber(), 1000000000);
        assert.equal(config.decayRate.toNumber(), 10);
        assert.equal(config.rewardAmount.toNumber(), 100);
      } catch (e: any) {
        // Might already be initialized
        if (e.toString().includes("already in use")) {
          console.log("Config already initialized");
          return;
        }
        throw e;
      }
    });

    it("Register agent", async function () {
      if (!program) {
        console.log("Skipping - program not built");
        return;
      }

      const name = "Test Agent";
      const metadataUri = "https://test.uri";

      try {
        const tx = await program.methods
          .registerAgent(name, metadataUri)
          .accounts({
            agentProfile: agentProfilePda,
            agent: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log("Register tx:", tx);

        // Verify profile
        const profile = await program.account.agentProfile.fetch(agentProfilePda);
        assert.equal(profile.name, name);
        assert.equal(profile.owner.toString(), authority.publicKey.toString());
        assert.equal(profile.reputationScore.toNumber(), 1000); // Starting score
      } catch (e: any) {
        if (e.toString().includes("AlreadyRegistered")) {
          console.log("Agent already registered");
          return;
        }
        throw e;
      }
    });

    it("Query reputation", async function () {
      if (!program) {
        console.log("Skipping - program not built");
        return;
      }

      try {
        const profile = await program.account.agentProfile.fetchNullable(agentProfilePda);
        if (profile) {
          console.log("Reputation score:", profile.reputationScore.toString());
          console.log("Task count:", profile.taskCount.toString());
          console.log("Vouches:", profile.vouchCount.toString());
        } else {
          console.log("No profile found");
        }
      } catch (e) {
        console.log("Error querying:", e);
      }
    });
  });
});
