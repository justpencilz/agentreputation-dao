use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};
use crate::state::{AgentProfile, VouchRecord, ProtocolConfig};
use crate::errors::ReputationError;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct VouchFor<'info> {
    #[account(mut)]
    pub voucher: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", voucher.key().as_ref()],
        bump = voucher_profile.bump,
    )]
    pub voucher_profile: Account<'info, AgentProfile>,
    
    #[account(
        mut,
        seeds = [b"agent", vouched_for.key().as_ref()],
        bump = vouched_for_profile.bump,
    )]
    pub vouched_for_profile: Account<'info, AgentProfile>,
    
    /// CHECK: Just the pubkey of the agent being vouched for
    #[account(mut)]
    pub vouched_for: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = voucher,
        space = VouchRecord::LEN,
        seeds = [b"vouch", voucher.key().as_ref(), vouched_for.key().as_ref()],
        bump
    )]
    pub vouch_record: Account<'info, VouchRecord>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    #[account(
        mut,
        associated_token::mint = config.reputation_mint,
        associated_token::authority = voucher,
    )]
    pub voucher_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = config.reputation_mint,
        associated_token::authority = vouch_escrow,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: PDA that owns the escrow account
    #[account(
        seeds = [b"escrow", vouch_record.key().as_ref()],
        bump,
    )]
    pub vouch_escrow: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn vouch_for(ctx: Context<VouchFor>, amount: u64) -> Result<()> {
    let voucher_key = ctx.accounts.voucher.key();
    let vouched_for_key = ctx.accounts.vouched_for.key();
    
    require!(voucher_key != vouched_for_key, ReputationError::SelfVouchNotAllowed);
    require!(
        ctx.accounts.voucher_profile.reputation_score >= ctx.accounts.config.min_reputation_for_vouching,
        ReputationError::InsufficientReputation
    );
    
    let clock = Clock::get()?;
    
    // Update vouch record
    let vouch = &mut ctx.accounts.vouch_record;
    vouch.voucher = voucher_key;
    vouch.vouched_for = vouched_for_key;
    vouch.amount = amount;
    vouch.is_positive = true;
    vouch.created_at = clock.unix_timestamp;
    vouch.bump = ctx.bumps.vouch_record;
    
    // Update profiles
    ctx.accounts.vouched_for_profile.positive_vouches = 
        ctx.accounts.vouched_for_profile.positive_vouches.saturating_add(1);
    ctx.accounts.voucher_profile.staked_amount = 
        ctx.accounts.voucher_profile.staked_amount.saturating_add(amount);
    
    // Transfer tokens to escrow
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.voucher_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.voucher.to_account_info(),
            },
        ),
        amount,
    )?;
    
    msg!("Positive vouch: {} staked {} reputation for {}", 
        voucher_key, amount, vouched_for_key);
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct VouchAgainst<'info> {
    #[account(mut)]
    pub voucher: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", voucher.key().as_ref()],
        bump = voucher_profile.bump,
    )]
    pub voucher_profile: Account<'info, AgentProfile>,
    
    #[account(
        mut,
        seeds = [b"agent", vouched_against.key().as_ref()],
        bump = vouched_against_profile.bump,
    )]
    pub vouched_against_profile: Account<'info, AgentProfile>,
    
    /// CHECK: Just the pubkey
    #[account(mut)]
    pub vouched_against: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = voucher,
        space = VouchRecord::LEN,
        seeds = [b"vouch", voucher.key().as_ref(), vouched_against.key().as_ref()],
        bump
    )]
    pub vouch_record: Account<'info, VouchRecord>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    pub system_program: Program<'info, System>,
}

pub fn vouch_against(ctx: Context<VouchAgainst>, amount: u64) -> Result<()> {
    let voucher_key = ctx.accounts.voucher.key();
    let vouched_against_key = ctx.accounts.vouched_against.key();
    
    require!(voucher_key != vouched_against_key, ReputationError::SelfVouchNotAllowed);
    require!(
        ctx.accounts.voucher_profile.reputation_score >= ctx.accounts.config.min_reputation_for_vouching,
        ReputationError::InsufficientReputation
    );
    
    let clock = Clock::get()?;
    
    // Update vouch record
    let vouch = &mut ctx.accounts.vouch_record;
    vouch.voucher = voucher_key;
    vouch.vouched_for = vouched_against_key;
    vouch.amount = amount;
    vouch.is_positive = false;
    vouch.created_at = clock.unix_timestamp;
    vouch.bump = ctx.bumps.vouch_record;
    
    // Update profile
    ctx.accounts.vouched_against_profile.negative_vouches = 
        ctx.accounts.vouched_against_profile.negative_vouches.saturating_add(1);
    
    msg!("Negative vouch: {} challenged {} with {} stake", 
        voucher_key, vouched_against_key, amount);
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawVouch<'info> {
    #[account(mut)]
    pub voucher: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", voucher.key().as_ref()],
        bump = voucher_profile.bump,
    )]
    pub voucher_profile: Account<'info, AgentProfile>,
    
    #[account(
        mut,
        close = voucher,
        seeds = [b"vouch", voucher.key().as_ref(), vouched_for.key().as_ref()],
        bump = vouch_record.bump,
    )]
    pub vouch_record: Account<'info, VouchRecord>,
    
    /// CHECK: Verified in vouch record
    #[account(mut)]
    pub vouched_for: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    #[account(
        mut,
        associated_token::mint = config.reputation_mint,
        associated_token::authority = voucher,
    )]
    pub voucher_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = config.reputation_mint,
        associated_token::authority = vouch_escrow,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: PDA that owns the escrow account
    #[account(
        seeds = [b"escrow", vouch_record.key().as_ref()],
        bump,
    )]
    pub vouch_escrow: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw_vouch(ctx: Context<WithdrawVouch>) -> Result<()> {
    let vouch = &ctx.accounts.vouch_record;
    let clock = Clock::get()?;
    
    // Check lockup period
    let elapsed = clock.unix_timestamp.saturating_sub(vouch.created_at);
    require!(
        elapsed >= ctx.accounts.config.vouch_lockup_period,
        ReputationError::LockupNotExpired
    );
    
    // Return staked tokens
    if vouch.amount > 0 && vouch.is_positive {
        let seeds = &[b"escrow", vouch.key().as_ref(), &[ctx.bumps.vouch_escrow]];
        let signer = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.voucher_token_account.to_account_info(),
                    authority: ctx.accounts.vouch_escrow.to_account_info(),
                },
                signer,
            ),
            vouch.amount,
        )?;
    }
    
    // Update profile
    ctx.accounts.voucher_profile.staked_amount = 
        ctx.accounts.voucher_profile.staked_amount.saturating_sub(vouch.amount);
    
    msg!("Vouch withdrawn. Returned {} tokens", vouch.amount);
    Ok(())
}
