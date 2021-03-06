use crate::*;

#[proc_macros::assert_size(240)]
#[repr(C)]
#[account]
pub struct ExecutionReceipt {
    pub transmuter: Pubkey,

    pub mutation: Pubkey,

    pub taker: Pubkey,

    pub mutation_complete_ts: u64,

    pub state: ExecutionState,

    // can be init'ed by user in any order, hence all optional
    pub vault_a: Option<Pubkey>, //option adds 0 to size
    pub vault_b: Option<Pubkey>,
    pub vault_c: Option<Pubkey>,

    _reserved: [u8; 32],
}

#[proc_macros::assert_size(4)]
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

    pub fn record_mutation_complete_ts(&mut self, mutation_time_sec: u64) -> Result<()> {
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

    pub fn try_mark_complete(&mut self) -> Result<()> {
        let now_ts = now_ts()?;
        require!(now_ts >= self.mutation_complete_ts, MutationNotComplete);
        self.state = ExecutionState::Complete;

        Ok(())
    }
}
