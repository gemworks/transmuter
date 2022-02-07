export type UtransmuterIDL =
{
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
          "name": "mutationOwner",
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
          "name": "bump",
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
      "name": "beginMutation",
      "accounts": [
        {
          "name": "mutation",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "completeMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "cancelMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "updateMutation",
      "accounts": [],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Mutation",
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
            "name": "inTokenA",
            "type": {
              "defined": "InTokenConfig"
            }
          },
          {
            "name": "inTokenB",
            "type": {
              "option": {
                "defined": "InTokenConfig"
              }
            }
          },
          {
            "name": "inTokenC",
            "type": {
              "option": {
                "defined": "InTokenConfig"
              }
            }
          },
          {
            "name": "outTokenA",
            "type": {
              "defined": "OutTokenConfig"
            }
          },
          {
            "name": "outTokenB",
            "type": {
              "option": {
                "defined": "OutTokenConfig"
              }
            }
          },
          {
            "name": "outTokenC",
            "type": {
              "option": {
                "defined": "OutTokenConfig"
              }
            }
          },
          {
            "name": "sinkSettings",
            "type": {
              "defined": "SinkSettings"
            }
          },
          {
            "name": "timeSettings",
            "type": {
              "defined": "TimeSettings"
            }
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
      "name": "InTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gemBank",
            "type": "publicKey"
          },
          {
            "name": "count",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "OutTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "source",
            "type": {
              "defined": "OutTokenSource"
            }
          },
          {
            "name": "count",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "SinkSettings",
      "type": {
        "kind": "struct",
        "fields": [
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
      "name": "OutTokenSource",
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
  ]
}
;
export const UtransmuterJSON: UtransmuterIDL =
{
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
          "name": "mutationOwner",
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
          "name": "bump",
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
      "name": "beginMutation",
      "accounts": [
        {
          "name": "mutation",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "completeMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "cancelMutation",
      "accounts": [],
      "args": []
    },
    {
      "name": "updateMutation",
      "accounts": [],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Mutation",
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
            "name": "inTokenA",
            "type": {
              "defined": "InTokenConfig"
            }
          },
          {
            "name": "inTokenB",
            "type": {
              "option": {
                "defined": "InTokenConfig"
              }
            }
          },
          {
            "name": "inTokenC",
            "type": {
              "option": {
                "defined": "InTokenConfig"
              }
            }
          },
          {
            "name": "outTokenA",
            "type": {
              "defined": "OutTokenConfig"
            }
          },
          {
            "name": "outTokenB",
            "type": {
              "option": {
                "defined": "OutTokenConfig"
              }
            }
          },
          {
            "name": "outTokenC",
            "type": {
              "option": {
                "defined": "OutTokenConfig"
              }
            }
          },
          {
            "name": "sinkSettings",
            "type": {
              "defined": "SinkSettings"
            }
          },
          {
            "name": "timeSettings",
            "type": {
              "defined": "TimeSettings"
            }
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
      "name": "InTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gemBank",
            "type": "publicKey"
          },
          {
            "name": "count",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "OutTokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "source",
            "type": {
              "defined": "OutTokenSource"
            }
          },
          {
            "name": "count",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "SinkSettings",
      "type": {
        "kind": "struct",
        "fields": [
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
      "name": "OutTokenSource",
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
  ]
}
;
import { generateErrorMap } from '@saberhq/anchor-contrib';
export const UtransmuterErrors = generateErrorMap(UtransmuterJSON);
