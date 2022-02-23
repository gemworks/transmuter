export type UtransmuterIDL =
{
  "version": "0.1.0",
  "name": "transmuter_v0",
  "instructions": [
    {
      "name": "initTransmuter",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bankB",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bankC",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateTransmuter",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "addToBankWhitelist",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "addressToWhitelist",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "whitelistType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "removeFromBankWhitelist",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "addressToRemove",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "bumpWl",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addRaritiesToBank",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "rarityConfigs",
          "type": {
            "vec": {
              "defined": "RarityConfig"
            }
          }
        }
      ]
    },
    {
      "name": "initMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenASource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBSource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCSource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "bumpB",
          "type": "u8"
        },
        {
          "name": "bumpC",
          "type": "u8"
        },
        {
          "name": "config",
          "type": {
            "defined": "MutationConfig"
          }
        },
        {
          "name": "uses",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "destroyMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenADest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBDest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCDest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initTakerVault",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "executionReceipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpCreator",
          "type": "u8"
        }
      ]
    },
    {
      "name": "executeMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankC",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultC",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenATakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "executionReceipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "reverseMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankC",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultC",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenATakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "executionReceipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "ExecutionReceipt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transmuter",
            "type": "publicKey"
          },
          {
            "name": "mutation",
            "type": "publicKey"
          },
          {
            "name": "taker",
            "type": "publicKey"
          },
          {
            "name": "mutationCompleteTs",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": "ExecutionState"
            }
          },
          {
            "name": "vaultA",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "vaultB",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "vaultC",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Mutation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transmuter",
            "type": "publicKey"
          },
          {
            "name": "config",
            "type": {
              "defined": "MutationConfig"
            }
          },
          {
            "name": "tokenAEscrow",
            "type": "publicKey"
          },
          {
            "name": "tokenBEscrow",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "tokenCEscrow",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "totalUses",
            "type": "u64"
          },
          {
            "name": "remainingUses",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": "MutationState"
            }
          },
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Transmuter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u16"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "authoritySeed",
            "type": "publicKey"
          },
          {
            "name": "authorityBumpSeed",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "bankA",
            "type": "publicKey"
          },
          {
            "name": "bankB",
            "type": "publicKey"
          },
          {
            "name": "bankC",
            "type": "publicKey"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RarityConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "rarityPoints",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "MutationConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "takerTokenA",
            "type": {
              "defined": "TakerTokenConfig"
            }
          },
          {
            "name": "takerTokenB",
            "type": {
              "option": {
                "defined": "TakerTokenConfig"
              }
            }
          },
          {
            "name": "takerTokenC",
            "type": {
              "option": {
                "defined": "TakerTokenConfig"
              }
            }
          },
          {
            "name": "makerTokenA",
            "type": {
              "defined": "MakerTokenConfig"
            }
          },
          {
            "name": "makerTokenB",
            "type": {
              "option": {
                "defined": "MakerTokenConfig"
              }
            }
          },
          {
            "name": "makerTokenC",
            "type": {
              "option": {
                "defined": "MakerTokenConfig"
              }
            }
          },
          {
            "name": "price",
            "type": {
              "defined": "PriceConfig"
            }
          },
          {
            "name": "mutationDurationSec",
            "type": "u64"
          },
          {
            "name": "reversible",
            "type": "bool"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "TakerTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gemBank",
            "type": "publicKey"
          },
          {
            "name": "requiredAmount",
            "type": "u64"
          },
          {
            "name": "requiredUnits",
            "type": {
              "defined": "RequiredUnits"
            }
          },
          {
            "name": "vaultAction",
            "type": {
              "defined": "VaultAction"
            }
          }
        ]
      }
    },
    {
      "name": "MakerTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "totalFunding",
            "type": "u64"
          },
          {
            "name": "amountPerUse",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "PriceConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceLamports",
            "type": "u64"
          },
          {
            "name": "reversalPriceLamports",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "ExecutionState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotStarted"
          },
          {
            "name": "Pending"
          },
          {
            "name": "Complete"
          }
        ]
      }
    },
    {
      "name": "MutationState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Available"
          },
          {
            "name": "Exhausted"
          }
        ]
      }
    },
    {
      "name": "RequiredUnits",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "RarityPoints"
          },
          {
            "name": "Gems"
          }
        ]
      }
    },
    {
      "name": "VaultAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ChangeOwner"
          },
          {
            "name": "Lock"
          },
          {
            "name": "DoNothing"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidTokenIndex",
      "msg": "Token index must be one of 1,2,3"
    },
    {
      "code": 6001,
      "name": "BankDoesNotMatch",
      "msg": "Bank account passed != bank account in config"
    },
    {
      "code": 6002,
      "name": "MintDoesNotMatch",
      "msg": "Mint account passed != mint account in config"
    },
    {
      "code": 6003,
      "name": "CandyMachineMissing",
      "msg": "Minted mutations require a Candy Machine ID to be present"
    },
    {
      "code": 6004,
      "name": "ArithmeticError",
      "msg": "Arithmetic error (likely under/overflow)"
    },
    {
      "code": 6005,
      "name": "NoMoreUsesLeft",
      "msg": "This mutation has exhausted all of its uses"
    },
    {
      "code": 6006,
      "name": "IncorrectFunding",
      "msg": "Funding amount doesn't added up to uses * amount per use"
    },
    {
      "code": 6007,
      "name": "InsufficientVaultGems",
      "msg": "This taker's vault doesn't have enough gems"
    },
    {
      "code": 6008,
      "name": "InsufficientVaultRarityPoints",
      "msg": "This taker's vault doesn't have enough rarity points"
    },
    {
      "code": 6009,
      "name": "VaultDoesNotBelongToBank",
      "msg": "Passed vault doesn't belong to passed bank"
    },
    {
      "code": 6010,
      "name": "VaultsNotSetToLock",
      "msg": "Reversals require all vaults to be set to Lock"
    },
    {
      "code": 6011,
      "name": "MutationNotComplete",
      "msg": "Mutation execution hasn't completed yet"
    },
    {
      "code": 6012,
      "name": "MutationAlreadyComplete",
      "msg": "Mutation execution already finished in the past"
    },
    {
      "code": 6013,
      "name": "MutationNotReversible",
      "msg": "Mutation isn't configured to be reversible"
    },
    {
      "code": 6014,
      "name": "AnchorSerializationIssue",
      "msg": "Anchor serialization issue"
    },
    {
      "code": 6015,
      "name": "NoneOfTheBanksMatch",
      "msg": "Trying to init a vault for an unknown bank"
    }
  ]
}
;
export const UtransmuterJSON: UtransmuterIDL =
{
  "version": "0.1.0",
  "name": "transmuter_v0",
  "instructions": [
    {
      "name": "initTransmuter",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bankB",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bankC",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateTransmuter",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "addToBankWhitelist",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "addressToWhitelist",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "whitelistType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "removeFromBankWhitelist",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "addressToRemove",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "bumpWl",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addRaritiesToBank",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "rarityConfigs",
          "type": {
            "vec": {
              "defined": "RarityConfig"
            }
          }
        }
      ]
    },
    {
      "name": "initMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenASource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBSource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCSource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        },
        {
          "name": "bumpB",
          "type": "u8"
        },
        {
          "name": "bumpC",
          "type": "u8"
        },
        {
          "name": "config",
          "type": {
            "defined": "MutationConfig"
          }
        },
        {
          "name": "uses",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "destroyMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenADest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBDest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCDest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuth",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initTakerVault",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "executionReceipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpCreator",
          "type": "u8"
        }
      ]
    },
    {
      "name": "executeMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankC",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultC",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenATakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "executionReceipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "reverseMutation",
      "accounts": [
        {
          "name": "transmuter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mutation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankC",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultC",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gemBank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenATakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenCEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCTakerAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "taker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "executionReceipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "ExecutionReceipt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transmuter",
            "type": "publicKey"
          },
          {
            "name": "mutation",
            "type": "publicKey"
          },
          {
            "name": "taker",
            "type": "publicKey"
          },
          {
            "name": "mutationCompleteTs",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": "ExecutionState"
            }
          },
          {
            "name": "vaultA",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "vaultB",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "vaultC",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Mutation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transmuter",
            "type": "publicKey"
          },
          {
            "name": "config",
            "type": {
              "defined": "MutationConfig"
            }
          },
          {
            "name": "tokenAEscrow",
            "type": "publicKey"
          },
          {
            "name": "tokenBEscrow",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "tokenCEscrow",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "totalUses",
            "type": "u64"
          },
          {
            "name": "remainingUses",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": "MutationState"
            }
          },
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Transmuter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u16"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "authoritySeed",
            "type": "publicKey"
          },
          {
            "name": "authorityBumpSeed",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "bankA",
            "type": "publicKey"
          },
          {
            "name": "bankB",
            "type": "publicKey"
          },
          {
            "name": "bankC",
            "type": "publicKey"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RarityConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "rarityPoints",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "MutationConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "takerTokenA",
            "type": {
              "defined": "TakerTokenConfig"
            }
          },
          {
            "name": "takerTokenB",
            "type": {
              "option": {
                "defined": "TakerTokenConfig"
              }
            }
          },
          {
            "name": "takerTokenC",
            "type": {
              "option": {
                "defined": "TakerTokenConfig"
              }
            }
          },
          {
            "name": "makerTokenA",
            "type": {
              "defined": "MakerTokenConfig"
            }
          },
          {
            "name": "makerTokenB",
            "type": {
              "option": {
                "defined": "MakerTokenConfig"
              }
            }
          },
          {
            "name": "makerTokenC",
            "type": {
              "option": {
                "defined": "MakerTokenConfig"
              }
            }
          },
          {
            "name": "price",
            "type": {
              "defined": "PriceConfig"
            }
          },
          {
            "name": "mutationDurationSec",
            "type": "u64"
          },
          {
            "name": "reversible",
            "type": "bool"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "TakerTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gemBank",
            "type": "publicKey"
          },
          {
            "name": "requiredAmount",
            "type": "u64"
          },
          {
            "name": "requiredUnits",
            "type": {
              "defined": "RequiredUnits"
            }
          },
          {
            "name": "vaultAction",
            "type": {
              "defined": "VaultAction"
            }
          }
        ]
      }
    },
    {
      "name": "MakerTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "totalFunding",
            "type": "u64"
          },
          {
            "name": "amountPerUse",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "PriceConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceLamports",
            "type": "u64"
          },
          {
            "name": "reversalPriceLamports",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "ExecutionState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotStarted"
          },
          {
            "name": "Pending"
          },
          {
            "name": "Complete"
          }
        ]
      }
    },
    {
      "name": "MutationState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Available"
          },
          {
            "name": "Exhausted"
          }
        ]
      }
    },
    {
      "name": "RequiredUnits",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "RarityPoints"
          },
          {
            "name": "Gems"
          }
        ]
      }
    },
    {
      "name": "VaultAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ChangeOwner"
          },
          {
            "name": "Lock"
          },
          {
            "name": "DoNothing"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidTokenIndex",
      "msg": "Token index must be one of 1,2,3"
    },
    {
      "code": 6001,
      "name": "BankDoesNotMatch",
      "msg": "Bank account passed != bank account in config"
    },
    {
      "code": 6002,
      "name": "MintDoesNotMatch",
      "msg": "Mint account passed != mint account in config"
    },
    {
      "code": 6003,
      "name": "CandyMachineMissing",
      "msg": "Minted mutations require a Candy Machine ID to be present"
    },
    {
      "code": 6004,
      "name": "ArithmeticError",
      "msg": "Arithmetic error (likely under/overflow)"
    },
    {
      "code": 6005,
      "name": "NoMoreUsesLeft",
      "msg": "This mutation has exhausted all of its uses"
    },
    {
      "code": 6006,
      "name": "IncorrectFunding",
      "msg": "Funding amount doesn't added up to uses * amount per use"
    },
    {
      "code": 6007,
      "name": "InsufficientVaultGems",
      "msg": "This taker's vault doesn't have enough gems"
    },
    {
      "code": 6008,
      "name": "InsufficientVaultRarityPoints",
      "msg": "This taker's vault doesn't have enough rarity points"
    },
    {
      "code": 6009,
      "name": "VaultDoesNotBelongToBank",
      "msg": "Passed vault doesn't belong to passed bank"
    },
    {
      "code": 6010,
      "name": "VaultsNotSetToLock",
      "msg": "Reversals require all vaults to be set to Lock"
    },
    {
      "code": 6011,
      "name": "MutationNotComplete",
      "msg": "Mutation execution hasn't completed yet"
    },
    {
      "code": 6012,
      "name": "MutationAlreadyComplete",
      "msg": "Mutation execution already finished in the past"
    },
    {
      "code": 6013,
      "name": "MutationNotReversible",
      "msg": "Mutation isn't configured to be reversible"
    },
    {
      "code": 6014,
      "name": "AnchorSerializationIssue",
      "msg": "Anchor serialization issue"
    },
    {
      "code": 6015,
      "name": "NoneOfTheBanksMatch",
      "msg": "Trying to init a vault for an unknown bank"
    }
  ]
}
;
import { generateErrorMap } from '@saberhq/anchor-contrib';
export const UtransmuterErrors = generateErrorMap(UtransmuterJSON);
