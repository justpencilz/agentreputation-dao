use anchor_lang::prelude::*;
use crate::state::AgentProfile;

#[derive(Accounts)]
pub struct GetReputation<'info> {
    #[account(
        seeds = [b"agent", agent.key().as_ref()],
        bump = agent_profile.bump,
    )]
    pub agent_profile: Account<'info, AgentProfile>,
    
    /// CHECK: Just the pubkey
    pub agent: UncheckedAccount<'info>,
}

pub fn get_reputation(ctx: Context<GetReputation>) -> Result<u64> {
    Ok(ctx.accounts.agent_profile.reputation_score)
}
