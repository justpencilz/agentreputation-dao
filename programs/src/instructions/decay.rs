use anchor_lang::prelude::*;
use crate::state::{AgentProfile, ProtocolConfig, calculate_decay};
use crate::errors::ReputationError;

#[derive(Accounts)]
pub struct ApplyDecay<'info> {
    /// Anyone can call this to apply decay to inactive agents
    pub caller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", agent.key().as_ref()],
        bump = agent_profile.bump,
    )]
    pub agent_profile: Account<'info, AgentProfile>,
    
    /// CHECK: Just the pubkey
    pub agent: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, ProtocolConfig>,
}

pub fn apply_decay(ctx: Context<ApplyDecay>) -> Result<()> {
    let profile = &mut ctx.accounts.agent_profile;
    let clock = Clock::get()?;
    let config = &ctx.accounts.config;
    
    let days_since_activity = (clock.unix_timestamp.saturating_sub(profile.last_activity_timestamp)) / 86400;
    
    require!(days_since_activity > 0, ReputationError::DecayCooldown);
    
    let old_reputation = profile.reputation_score;
    let new_reputation = calculate_decay(
        profile.reputation_score,
        days_since_activity,
        config.decay_rate_per_day,
    );
    
    profile.reputation_score = new_reputation;
    
    // Mark as inactive if reputation drops too low
    if profile.reputation_score < 10 {
        profile.is_active = false;
    }
    
    msg!("Decay applied: {} -> {} ({} days inactive)", 
        old_reputation, new_reputation, days_since_activity);
    
    Ok(())
}
