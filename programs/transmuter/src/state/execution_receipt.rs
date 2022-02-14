use crate::*;

#[repr(C)]
#[account]
pub struct ExecutionReceipt {
    pub mutation_complete_ts: u64,
    pub state: ExecutionState,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum ExecutionState {
    Pending,
    Complete,
}

impl ExecutionReceipt {
    pub fn is_pending(&self) -> bool {
        self.state == ExecutionState::Pending
    }

    pub fn is_complete(&self) -> bool {
        self.state == ExecutionState::Complete
    }

    pub fn calc_mutation_complete_ts(
        mutation_time_sec: u64,
    ) -> std::result::Result<u64, ProgramError> {
        let now_ts = now_ts()?;
        now_ts.try_add(mutation_time_sec)
    }

    pub fn try_mark_complete(&mut self) -> ProgramResult {
        let now_ts = now_ts()?;
        require!(now_ts >= self.mutation_complete_ts, MutationNotComplete);

        self.state = ExecutionState::Complete;

        Ok(())
    }
}
