use crate::*;

// todo need to close it after 2nd call, if successful
#[repr(C)]
#[account]
pub struct ExecutionReceipt {
    pub mutation_complete_ts: u64,
    pub abort_window_closes_ts: u64,
}

impl ExecutionReceipt {
    pub fn calc_final_ts(added_time: u64) -> std::result::Result<u64, ProgramError> {
        let now_ts = now_ts()?;
        now_ts.try_add(added_time)
    }

    // todo test
    pub fn assert_mutation_complete(&self) -> ProgramResult {
        let now_ts = now_ts()?;
        require!(now_ts >= self.mutation_complete_ts, MutationNotComplete);

        Ok(())
    }

    // todo test
    pub fn assert_can_abort(&self) -> ProgramResult {
        let now_ts = now_ts()?;
        require!(now_ts <= self.abort_window_closes_ts, AbortWindowClosed);

        Ok(())
    }
}
