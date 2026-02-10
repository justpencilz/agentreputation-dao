use anchor_lang::prelude::*;
use crate::state::AgentProfile;
use crate::errors::ReputationError;

#[derive(Accounts)]
#[instruction(agent_name: String)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        space = AgentProfile::LEN,
        seeds = [b"agent", owner.key().as_ref()],
        bump
    )]
    pub agent_profile: Account<'info, AgentProfile>,
    
    pub system_program: Program<'info, System>,
}

pub fn register_agent(ctx: Context<RegisterAgent>, agent_name: String) -> Result<()> {
    require!(agent_name.len() <= 50, ReputationError::NameTooLong);
    
    let profile = &mut ctx.accounts.agent_profile;
    let clock = Clock::get()?;
    
    profile.owner = ctx.accounts.owner.key();
    profile.name = agent_name;
    profile.reputation_score = 0;
    profile.total_tasks_completed = 0;
    profile.last_activity_timestamp = clock.unix_timestamp;
    profile.is_active = true;
    profile.positive_vouches = 0;
    profile.negative_vouches = 0;
    profile.staked_amount = 0;
    profile.bump = ctx.bumps.agent_profile;
    
    msg!("Agent registered: {}", profile.name);
    Ok(())
}
