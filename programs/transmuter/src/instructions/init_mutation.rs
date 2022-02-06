use crate::*;

#[derive(Accounts)]
pub struct InitMutation {

}

pub fn handler(ctx: Context<InitMutation>) -> ProgramResult {
    Ok(())
}