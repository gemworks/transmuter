use crate::*;

#[repr(C)]
#[account]
pub struct ExecutionReceipt {
    pub mutation_complete_ts: u64,

    pub state: ExecutionState,

    // can be init'ed by user in any order, hence all optional
    pub vault_a: Option<Pubkey>,
    pub vault_b: Option<Pubkey>,
    pub vault_c: Option<Pubkey>,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum ExecutionState {
    NotStarted,
    Pending,
    Complete,
}

impl ExecutionReceipt {
    pub fn is_not_started(&self) -> bool {
        self.state == ExecutionState::NotStarted
    }

    pub fn is_pending(&self) -> bool {
        self.state == ExecutionState::Pending
    }

    pub fn is_complete(&self) -> bool {
        self.state == ExecutionState::Complete
    }

    pub fn record_mutation_complete_ts(&mut self, mutation_time_sec: u64) -> ProgramResult {
        let now_ts = now_ts()?;
        self.mutation_complete_ts = now_ts.try_add(mutation_time_sec)?;

        Ok(())
    }

    pub fn mark_not_started(&mut self) {
        self.state = ExecutionState::NotStarted;
    }

    pub fn mark_pending(&mut self) {
        self.state = ExecutionState::Pending;
    }

    pub fn try_mark_complete(&mut self) -> ProgramResult {
        let now_ts = now_ts()?;
        require!(now_ts >= self.mutation_complete_ts, MutationNotComplete);
        self.state = ExecutionState::Complete;

        Ok(())
    }
}
