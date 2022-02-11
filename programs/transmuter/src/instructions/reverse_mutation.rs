use crate::*;
use gem_bank::state::Vault;

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
) -> ProgramResult {
    if !ctx.accounts.mutation.config.reversible {
        return Err(ErrorCode::MutationNotReversible.into());
    }

    let execution_receipt_info = ctx.accounts.execution_receipt.to_account_info();
    let execution_receipt: Account<'_, ExecutionReceipt> =
        Account::try_from(&execution_receipt_info)?;
    if !execution_receipt.is_complete() {
        return Err(ErrorCode::MutationNotComplete.into());
    }

    let (expected_receipt, _bump) = Pubkey::find_program_address(
        &[
            b"receipt".as_ref(),
            ctx.accounts.mutation.key().as_ref(),
            ctx.accounts.taker.key().as_ref(),
        ],
        ctx.program_id,
    );
    assert_keys_eq!(
        expected_receipt,
        ctx.accounts.execution_receipt.key(),
        "receipt"
    );

    // --------------------------------------- uses & payment

    let mutation = &mut ctx.accounts.mutation;
    mutation.increment_uses()?;

    // todo test
    let price = mutation.config.price.reversal_price_lamports;
    if price < 0 {
        ctx.accounts.make_payment(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.taker.to_account_info(),
            price as u64,
        )?;
    } else if price > 0 {
        ctx.accounts.make_payment(
            ctx.accounts.taker.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            price as u64,
        )?;
    }

    // --------------------------------------- unlock taker vaults

    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let mutation = &mut ctx.accounts.mutation;
    let config = mutation.config;

    // first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    let vault_a = &ctx.accounts.vault_a;
    let taker_token_a = mutation.config.taker_token_a;
    ctx.accounts
        .perform_vault_action(bank_a, vault_a, taker_token_a, false)?;

    // second bank
    if let Some(taker_token_b) = config.taker_token_b {
        let bank_b = next_account_info(remaining_accs)?;
        let vault_b = next_account_info(remaining_accs)?;
        let vault_b_acc: Account<'_, Vault> = Account::try_from(vault_b)?;
        ctx.accounts
            .perform_vault_action(bank_b.clone(), &vault_b_acc, taker_token_b, false)?;
    }

    // third bank
    if let Some(taker_token_c) = config.taker_token_c {
        let bank_c = next_account_info(remaining_accs)?;
        let vault_c = next_account_info(remaining_accs)?;
        let vault_c_acc: Account<'_, Vault> = Account::try_from(vault_c)?;
        ctx.accounts
            .perform_vault_action(bank_c.clone(), &vault_c_acc, taker_token_c, false)?;
    }

    // --------------------------------------- move back tokens

    // first token
    let escrow_a = ctx.accounts.token_a_escrow.to_account_info();
    let taker_ata_a = ctx.accounts.token_a_taker_ata.to_account_info();
    ctx.accounts
        .perform_token_transfer(escrow_a, taker_ata_a, config.maker_token_a, true)?;

    // second token
    if let Some(maker_token_b) = config.maker_token_b {
        let escrow_b = ctx.accounts.token_b_escrow.to_account_info();
        let taker_ata_b = ctx.accounts.token_b_taker_ata.to_account_info();
        ctx.accounts
            .perform_token_transfer(escrow_b, taker_ata_b, maker_token_b, true)?;
    }

    // third token
    if let Some(maker_token_c) = config.maker_token_c {
        let escrow_c = ctx.accounts.token_c_escrow.to_account_info();
        let taker_ata_c = ctx.accounts.token_c_taker_ata.to_account_info();
        ctx.accounts
            .perform_token_transfer(escrow_c, taker_ata_c, maker_token_c, true)?;
    }

    // --------------------------------------- close receipt account

    let receipt = &mut ctx.accounts.execution_receipt.to_account_info();
    let taker = &mut ctx.accounts.taker.to_account_info();

    close_account(receipt, taker)?;

    Ok(())
}
