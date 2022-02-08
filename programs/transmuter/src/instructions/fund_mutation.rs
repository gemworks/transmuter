// use crate::*;
// use anchor_spl::token::{Mint, TokenAccount, Transfer};
//
// #[derive(Accounts)]
// #[instruction(bump: u8)]
// pub struct FundMutation<'info> {
//     //mutation
//     #[account(has_one = owner)]
//     pub mutation: Account<'info, Mutation>,
//     // todo currently both mutation owner and token owner
//     #[account(mut)]
//     pub owner: Signer<'info>,
//
//     #[account(init, seeds = [
//             b"escrow".as_ref(),
//             mutation.key().as_ref(),
//             token_mint.key().as_ref(),
//         ],
//         bump = bump,
//         token::mint = gem_mint,
//         token::authority = authority,
//         payer = owner)]
//     pub token_escrow: Box<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub token_source: Box<Account<'info, TokenAccount>>,
//     pub token_mint: Account<'info, Mint>,
//
//     // misc
//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
// }
//
// impl<'info> FundMutation<'info> {
//     fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//         CpiContext::new(
//             self.token_program.to_account_info(),
//             Transfer {
//                 from: self.token_source.to_account_info(),
//                 to: self.token_escrow.to_account_info(),
//                 authority: self.owner.to_account_info(),
//             },
//         )
//     }
// }
//
// pub fn handler(ctx: Context<FundMutation>, token_index: u8) -> ProgramResult {
//     match token_index {
//         1 => {}
//         2 => {}
//         3 => {}
//         _ => return Err(ErrorCode::InvalidTokenIndex.into()),
//     }
//
//     Ok(())
// }
