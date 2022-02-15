pub mod bank_instructions;
pub mod destroy_mutation;
pub mod execute_mutation;
pub mod init_mutation;
pub mod init_transmuter;
pub mod reverse_mutation;
pub mod update_transmuter;

pub use bank_instructions::*;
pub use destroy_mutation::*;
pub use execute_mutation::*;
pub use init_mutation::*;
pub use init_transmuter::*;
pub use reverse_mutation::*;
pub use update_transmuter::*;

// have to duplicate or this won't show up in IDL
use anchor_lang::prelude::*;
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default, PartialEq)]
pub struct RarityConfig {
    pub mint: Pubkey,
    pub rarity_points: u16,
}
