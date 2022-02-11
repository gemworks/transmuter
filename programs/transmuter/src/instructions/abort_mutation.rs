use crate::*;

pub fn handler(ctx: Context<ExecuteMutation>) -> ProgramResult {
    let mutation = &ctx.accounts.mutation;

    // todo test
    // abort time must be <= mutation time
    // means if abort time > 0, mutation time also > 0 (no need to check extra)
    // conversely, if abort time == 0, aborts aren't supported
    if mutation.config.time_config.abort_window_sec == 0 {
        return Err(ErrorCode::AbortNotSupported.into());
    }

    // todo test
    let execution_receipt = &mut ctx.accounts.execution_receipt;
    if !execution_receipt.is_pending() {
        return Err(ErrorCode::ExecutionAlreadyComplete.into());
    }

    // return payment

    // update uses

    // unlock vaults

    // we never transferred the tokens, so no need to transfer back

    Ok(())
}
