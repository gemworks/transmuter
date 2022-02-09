export type Transmuter = {
  "version": "0.1.0",
  "name": "transmuter",
  "instructions": [
    {
      "name": "initMutation",
      "accounts": [
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
          "name": "bumpA",
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
        }
      ]
    },
    {
      "name": "updateMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "destroyMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "executeMutation",
      "accounts": [
        {
          "name": "mutation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultC",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankC",
          "isMut": false,
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
          "name": "tokenADestination",
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
          "name": "tokenBDestination",
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
          "name": "tokenCDestination",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "receiver",
          "isMut": true,
          "isSigner": true
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
        },
        {
          "name": "bumpA",
          "type": "u8"
        },
        {
          "name": "bumpB",
          "type": "u8"
        },
        {
          "name": "bumpC",
          "type": "u8"
        }
      ]
    },
    {
      "name": "abortMutation",
      "accounts": [],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "mutation",
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
            "name": "config",
            "type": {
              "defined": "MutationConfig"
            }
          },
          {
            "name": "paid",
            "type": "bool"
          },
          {
            "name": "state",
            "type": {
              "defined": "MutationState"
            }
          }
        ]
      }
    }
  ],
  "types": [
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
            "name": "timeSettings",
            "type": {
              "defined": "TimeSettings"
            }
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "payEveryTime",
            "type": "bool"
          },
          {
            "name": "updateMetadata",
            "type": "bool"
          },
          {
            "name": "reversible",
            "type": "bool"
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
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "action",
            "type": {
              "defined": "SinkAction"
            }
          },
          {
            "name": "destination",
            "type": {
              "option": "publicKey"
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
            "name": "source",
            "type": {
              "defined": "MakerTokenSource"
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "candyMachine",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "mint",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "TimeSettings",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mutationTimeSec",
            "type": "u64"
          },
          {
            "name": "cancelWindowSec",
            "type": "u64"
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
            "name": "Open"
          },
          {
            "name": "Closed"
          }
        ]
      }
    },
    {
      "name": "MakerTokenSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Mint"
          },
          {
            "name": "Prefunded"
          }
        ]
      }
    },
    {
      "name": "SinkAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Burn"
          },
          {
            "name": "Transfer"
          },
          {
            "name": "Preserve"
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
    }
  ]
};

export const IDL: Transmuter = {
  "version": "0.1.0",
  "name": "transmuter",
  "instructions": [
    {
      "name": "initMutation",
      "accounts": [
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
          "name": "bumpA",
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
        }
      ]
    },
    {
      "name": "updateMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "destroyMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "executeMutation",
      "accounts": [
        {
          "name": "mutation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultC",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankC",
          "isMut": false,
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
          "name": "tokenADestination",
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
          "name": "tokenBDestination",
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
          "name": "tokenCDestination",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenCMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "receiver",
          "isMut": true,
          "isSigner": true
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
        },
        {
          "name": "bumpA",
          "type": "u8"
        },
        {
          "name": "bumpB",
          "type": "u8"
        },
        {
          "name": "bumpC",
          "type": "u8"
        }
      ]
    },
    {
      "name": "abortMutation",
      "accounts": [],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "mutation",
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
            "name": "config",
            "type": {
              "defined": "MutationConfig"
            }
          },
          {
            "name": "paid",
            "type": "bool"
          },
          {
            "name": "state",
            "type": {
              "defined": "MutationState"
            }
          }
        ]
      }
    }
  ],
  "types": [
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
            "name": "timeSettings",
            "type": {
              "defined": "TimeSettings"
            }
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "payEveryTime",
            "type": "bool"
          },
          {
            "name": "updateMetadata",
            "type": "bool"
          },
          {
            "name": "reversible",
            "type": "bool"
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
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "action",
            "type": {
              "defined": "SinkAction"
            }
          },
          {
            "name": "destination",
            "type": {
              "option": "publicKey"
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
            "name": "source",
            "type": {
              "defined": "MakerTokenSource"
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "candyMachine",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "mint",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "TimeSettings",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mutationTimeSec",
            "type": "u64"
          },
          {
            "name": "cancelWindowSec",
            "type": "u64"
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
            "name": "Open"
          },
          {
            "name": "Closed"
          }
        ]
      }
    },
    {
      "name": "MakerTokenSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Mint"
          },
          {
            "name": "Prefunded"
          }
        ]
      }
    },
    {
      "name": "SinkAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Burn"
          },
          {
            "name": "Transfer"
          },
          {
            "name": "Preserve"
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
    }
  ]
};
