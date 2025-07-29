#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("EcWG8mVNom4wmqWxXZSshhA2Udark9tt5ebZ6xSCbgAR");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {

        let escrow_key = ctx.accounts.escrow.key();
        let escrow = &mut ctx.accounts.escrow;

        let ix = system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &escrow_key,
            amount
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                escrow.to_account_info(),
            ]
        )?;

        escrow.initialiser = ctx.accounts.payer.key();
        escrow.is_released = false;
        escrow.amount = amount;
        Ok(())
    }

    pub fn release(ctx: Context<Release>) -> Result<()> {
        let escrow_key = ctx.accounts.escrow.key();
        let escrow = &mut ctx.accounts.escrow;
        if escrow.is_released {
            return err!(EscrowError::AlreadyReleased);
        }

        let ix = system_instruction::transfer(
            &escrow_key,
            &ctx.accounts.receiver.key(),
            escrow.amount
        );
        
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                escrow.to_account_info(),
                ctx.accounts.receiver.to_account_info(),
            ]
        )?;
        
        
        escrow.is_released = true;
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = Escrow::INIT_SPACE + 8, seeds = [b"escrow"], bump)]
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

    /// CHECK: This is a generic receiver account, validated by business logic.
    #[account(mut)]
    pub receiver: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
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