use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

mod state;
mod instructions;
mod errors;

use state::*;
use instructions::*;
use errors::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod agentreputation_dao {
    use super::*;

    /// Initialize the reputation protocol with config
    pub fn initialize(ctx: Context<Initialize>, config: ProtocolConfig) -> Result<()> {
        instructions::initialize(ctx, config)
    }

    /// Register a new agent in the reputation system
    pub fn register_agent(ctx: Context<RegisterAgent>, agent_name: String) -> Result<()> {
        instructions::register_agent(ctx, agent_name)
    }

    /// Complete a task and earn reputation
    pub fn complete_task(
        ctx: Context<CompleteTask>,
        task_id: String,
        reputation_amount: u64,
    ) -> Result<()> {
        instructions::complete_task(ctx, task_id, reputation_amount)
    }

    /// Vouch for another agent (stake tokens)
    pub fn vouch_for(ctx: Context<VouchFor>, amount: u64) -> Result<()> {
        instructions::vouch_for(ctx, amount)
    }

    /// Challenge/vouch against another agent
    pub fn vouch_against(ctx: Context<VouchAgainst>, amount: u64) -> Result<()> {
        instructions::vouch_against(ctx, amount)
    }

    /// Withdraw vouch (unstake)
    pub fn withdraw_vouch(ctx: Context<WithdrawVouch>) -> Result<()> {
        instructions::withdraw_vouch(ctx)
    }

    /// Apply decay to inactive agent
    pub fn apply_decay(ctx: Context<ApplyDecay>) -> Result<()> {
        instructions::apply_decay(ctx)
    }

    /// Get agent reputation score
    pub fn get_reputation(ctx: Context<GetReputation>) -> Result<u64> {
        instructions::get_reputation(ctx)
    }
}
