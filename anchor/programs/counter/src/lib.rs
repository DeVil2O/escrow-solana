#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("EcWG8mVNom4wmqWxXZSshhA2Udark9tt5ebZ6xSCbgAR");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.initialiser = ctx.accounts.payer.key();
        escrow.is_released = false;
        escrow.amount = amount;
        Ok(())
    }

    pub fn release(ctx: Context<Release>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.is_released = true;
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 8, seeds = [b"escrow"], bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    pub initialiser: Signer<'info>,
    #[account(mut, has_one = initialiser)]
    pub escrow: Account<'info, Escrow>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub initialiser: Pubkey,
    pub amount: u64,
    pub is_released: bool,
}

#[error_code]
pub enum EscrowError {
    #[msg("Escrow is already released")]
    AlreadyReleased,
}