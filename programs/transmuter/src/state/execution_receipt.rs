use crate::*;

// todo need to close it after 2nd call, if successful
#[repr(C)]
#[account]
pub struct ExecutionReceipt {
    pub mutation_complete_ts: u64,
}

impl ExecutionReceipt {
    pub fn calc_mutation_complete_ts(
        mutation_time_sec: u64,
    ) -> std::result::Result<u64, ProgramError> {
        let now_ts = now_ts()?;

        now_ts.try_add(mutation_time_sec)
    }

    // todo test
    pub fn assert_mutation_complete(&self) -> ProgramResult {
        let now_ts = now_ts()?;

        require!(now_ts >= self.mutation_complete_ts, MutationNotComplete);

        Ok(())
    }
}
