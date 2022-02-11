use crate::*;

// todo need to close it after 2nd call, if successful
#[repr(C)]
#[account]
pub struct ExecutionReceipt {
    pub state: ExecutionState,
    pub mutation_complete_ts: u64,
    pub abort_window_closes_ts: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum ExecutionState {
    None,
    Pending,
    Complete,
}

impl Default for ExecutionState {
    fn default() -> Self {
        Self::None
    }
}

impl ExecutionReceipt {
    pub fn is_empty(&self) -> bool {
        self.state == ExecutionState::None
    }

    pub fn is_pending(&self) -> bool {
        self.state == ExecutionState::Pending
    }

    pub fn is_complete(&self) -> bool {
        self.state == ExecutionState::Complete
    }

    // todo test
    pub fn init_receipt(&mut self, time_config: TimeConfig) -> ProgramResult {
        let now_ts = now_ts()?;
        self.mutation_complete_ts = now_ts.try_add(time_config.mutation_time_sec)?;
        self.abort_window_closes_ts = now_ts.try_add(time_config.abort_window_sec)?;

        if time_config.mutation_time_sec > 0 {
            self.state = ExecutionState::Pending;
        } else {
            self.state = ExecutionState::Complete;
        }

        Ok(())
    }

    // todo test
    pub fn try_mark_complete(&mut self) -> ProgramResult {
        let now_ts = now_ts()?;
        require!(now_ts >= self.mutation_complete_ts, MutationNotComplete);

        self.state = ExecutionState::Complete;

        Ok(())
    }

    // todo test
    pub fn assert_can_abort(&self) -> ProgramResult {
        let now_ts = now_ts()?;
        require!(now_ts <= self.abort_window_closes_ts, AbortWindowClosed);

        Ok(())
    }
}
