use crate::*;

#[error]
pub enum ErrorCode {
    #[msg("Token index must be one of 1,2,3")]
    InvalidTokenIndex, //0

    #[msg("Bank account passed != bank account in config")]
    BankDoesNotMatch,

    #[msg("Mint account passed != mint account in config")]
    MintDoesNotMatch,

    #[msg("Minted mutations require a Candy Machine ID to be present")]
    CandyMachineMissing,

    #[msg("Arithmetic error (likely under/overflow)")]
    ArithmeticError,

    #[msg("This mutation has exhausted all of its uses")]
    NoMoreUsesLeft, //5 = 0x1775

    #[msg("Funding amount doesn't added up to uses * amount per use")]
    IncorrectFunding,

    #[msg("This taker's vault doesn't have enough gems")]
    InsufficientVaultGems,

    #[msg("This taker's vault doesn't have enough rarity points")]
    InsufficientVaultRarityPoints,

    #[msg("Passed vault doesn't belong to passed bank")]
    VaultDoesNotBelongToBank,

    #[msg("Reversals require all vaults to be set to Lock")]
    VaultsNotSetToLock, //10 = 0x177a

    #[msg("Mutation execution hasn't completed yet")]
    MutationNotComplete,

    #[msg("Mutation execution already finished in the past")]
    MutationAlreadyComplete,

    #[msg("Mutation isn't configured to be reversible")]
    MutationNotReversible,

    #[msg("Anchor serialization issue")]
    AnchorSerializationIssue,
}
