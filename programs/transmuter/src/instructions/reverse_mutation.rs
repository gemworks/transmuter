use crate::*;
use gem_bank::state::Vault;

#[access_control(ctx.accounts.validate())]
pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
) -> ProgramResult {
    if !ctx.accounts.mutation.config.reversible {
        return Err(ErrorCode::MutationNotReversible.into());
    }

    let execution_receipt = &mut ctx.accounts.execution_receipt;
    if !execution_receipt.is_complete() {
        return Err(ErrorCode::MutationNotComplete.into());
    }
    execution_receipt.mark_not_started();

    // --------------------------------------- uses & payment

    let mutation = &mut ctx.accounts.mutation;
    mutation.increment_uses()?;

    let price = mutation.config.price.reversal_price_lamports;
    if price < 0 {
        ctx.accounts.make_payment(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.taker.to_account_info(),
            price.abs() as u64,
        )?;
    } else if price > 0 {
        ctx.accounts.make_payment(
            ctx.accounts.taker.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            price as u64,
        )?;
    }

    // --------------------------------------- unlock taker vaults

    let config = ctx.accounts.mutation.config;

    // first bank
    ctx.accounts.perform_vault_action(
        ctx.accounts.bank_a.to_account_info(),
        ctx.accounts.vault_a.to_account_info(),
        ctx.accounts.mutation.config.taker_token_a,
        false,
        false,
    )?;

    // second bank
    if let Some(taker_token_b) = config.taker_token_b {
        ctx.accounts.perform_vault_action(
            ctx.accounts.bank_b.to_account_info(),
            ctx.accounts.vault_b.to_account_info(),
            taker_token_b,
            false,
            false,
        )?;
    }

    // third bank
    if let Some(taker_token_c) = config.taker_token_c {
        ctx.accounts.perform_vault_action(
            ctx.accounts.bank_c.to_account_info(),
            ctx.accounts.vault_c.to_account_info(),
            taker_token_c,
            false,
            false,
        )?;
    }

    // --------------------------------------- move back tokens

    // first token
    ctx.accounts.perform_token_transfer(
        ctx.accounts.token_a_escrow.to_account_info(),
        ctx.accounts.token_a_taker_ata.to_account_info(),
        config.maker_token_a,
        true,
    )?;

    // second token
    if let Some(maker_token_b) = config.maker_token_b {
        ctx.accounts.perform_token_transfer(
            ctx.accounts.token_b_escrow.to_account_info(),
            ctx.accounts.token_b_taker_ata.to_account_info(),
            maker_token_b,
            true,
        )?;
    }

    // third token
    if let Some(maker_token_c) = config.maker_token_c {
        ctx.accounts.perform_token_transfer(
            ctx.accounts.token_c_escrow.to_account_info(),
            ctx.accounts.token_c_taker_ata.to_account_info(),
            maker_token_c,
            true,
        )?;
    }

    Ok(())
}
