use crate::*;

#[error]
pub enum ErrorCode {
    #[msg("Token index must be one of 1,2,3")]
    InvalidTokenIndex,

    #[msg("Bank account passed != bank account in config")]
    BankDoesNotMatch,

    #[msg("Mint account passed != mint account in config")]
    MintDoesNotMatch,

    #[msg("Minted mutations require a Candy Machine ID to be present")]
    CandyMachineMissing,
}
