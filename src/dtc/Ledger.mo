module {
    public let CANISTER_ID : Text = "xbgkv-fyaaa-aaaaa-aaava-cai";

    public let Canister_ID_INDEX : Text = "qjdve-lqaaa-aaaaa-aaaeq-cai";

    public type Result<T, E> = {
        #Ok  : T;
        #Err : E;
    };

    public type TransferResult = Result<BlockIndex, TransferError>;

    // Amount of ICP tokens, measured in 10^-8 of a token.
    public type ICP = {
        e8s : Nat64;
    };

    // Number of nanoseconds from the UNIX epoch (00:00:00 UTC, Jan 1, 1970).
    public type Timestamp = {
        timestamp_nanos: Nat64;
    };

    // AccountIdentifier is a 32-byte array.
    // The first 4 bytes is big-endian encoding of a CRC32 checksum of the last 28 bytes.
    public type AccountIdentifier = Blob;

    // Subaccount is an arbitrary 32-byte byte array.
    // Ledger uses subaccounts to compute the source address, which enables one
    // principal to control multiple ledger accounts.
    public type SubAccount = Blob;

    // Sequence number of a block produced by the ledger.
    public type BlockIndex = Nat64;

    public type BlockArchive = {
        parent_hash : ?[Nat8];
        timestamp   : Timestamp;
        transaction : TransactionArchive;
    };

    public type Block = {
        transaction : Transaction;
        timestamp : TimeStamp;
        parent_hash : ?[Nat8];
    };

    public type Hash = ?{
        inner: Blob;
    };

    public type TimeStamp = {
        timestamp_nanos : Nat64;
    };

    public type TransactionArchive = {
        operation       : ?Operation;
        memo            : Memo;
        created_at_time : Timestamp;
    };

    public type Tokens = {
        e8s : Nat64;
    };

    public type Operation = {
        #Burn : { from : AccountIdentifier; amount : Tokens };
        #Mint : { to : AccountIdentifier; amount : Tokens };
        #Transfer : {
        to : AccountIdentifier;
        fee : Tokens;
        from : AccountIdentifier;
        amount : Tokens;
        };
    };

    public type Transaction = {
        memo : Memo;
        operation : ?Operation;
        created_at_time : TimeStamp;
    };

    public type Transfer = {
        #Burn : {
            from   : AccountIdentifier;
            amount : ICP;
        };
        #Mint : {
            to     : AccountIdentifier;
            amount : ICP;
        };
        #Send : {
            from   : AccountIdentifier;
            to     : AccountIdentifier;
            amount : ICP;
        };
    };

    // An arbitrary number associated with a transaction.
    // The caller can set it in a `transfer` call as a correlation identifier.
    public type Memo = Nat64;

    public type GetBlocksArgs = {
        start : BlockIndex;
        length : Nat64;
    }; 

    public type QueryBlocksResponse = {
        certificate : ?[Nat8];
        blocks : [Block];
        chain_length : Nat64;
        first_block_index : BlockIndex;
        archived_blocks : [{
            callback : QueryArchiveFn;
            start : BlockIndex;
            length : Nat64;
        }];
    };

    type BlockRange = {
        blocks : [Block];
    };

    public type QueryArchiveError = {
        #BadFirstBlockIndex : {
        requested_index : BlockIndex;
        first_valid_index : BlockIndex;
        };
        #Other : { error_message : Text; error_code : Nat64 };
    };

    public type GetBlocksError = {
        #BadFirstBlockIndex : {
        requested_index : BlockIndex;
        first_valid_index : BlockIndex;
        };
        #Other : { error_message : Text; error_code : Nat64 };
    };

    public type QueryArchiveResult = {
        #Ok : BlockRange;
        #Err : QueryArchiveError;
    };

    public type QueryArchiveFn = shared query GetBlocksArgs -> async QueryArchiveResult;

    // Arguments for the `transfer` call.
    public type TransferArgs = {
        // Transaction memo.
        // See comments for the `Memo` type.
        memo : Memo;
        // The amount that the caller wants to transfer to the destination address.
        amount : ICP;
        // The amount that the caller pays for the transaction.
        // Must be 10000 e8s.
        fee : ICP;
        // The subaccount from which the caller wants to transfer funds.
        // If null, the ledger uses the default (all zeros) subaccount to compute the source address.
        // See comments for the `SubAccount` type.
        from_subaccount : ?SubAccount;
        // The destination account.
        // If the transfer is successful, the balance of this account increases by `amount`.
        to : AccountIdentifier;
        // The point in time when the caller created this request.
        // If null, the ledger uses current IC time as the timestamp.
        created_at_time : ?Timestamp;
    };

    public type TransferError = {
        // The fee that the caller specified in the transfer request was not the one that the ledger expects.
        // The caller can change the transfer fee to the `expected_fee` and retry the request.
        #BadFee : { expected_fee : ICP };
        // The account specified by the caller doesn't have enough funds.
        #InsufficientFunds : { balance: ICP };
        // The request is too old.
        // The ledger only accepts requests created within a 24 hours window.
        // This is a non-recoverable error.
        #TxTooOld : { allowed_window_nanos: Nat64 };
        // The caller specified `created_at_time` that is too far in future.
        // The caller can retry the request later.
        #TxCreatedInFuture;
        // The ledger has already executed the request.
        // `duplicate_of` field is equal to the index of the block containing the original transaction.
        #TxDuplicate : { duplicate_of: BlockIndex; };
    };

    public type GetBlocksResult = Result<BlockRange,GetBlocksError>;


    // Arguments for the `account_balance` call.
    public type AccountBalanceArgs = {
        account : AccountIdentifier;
    };

    public type Interface = actor {
        transfer        : TransferArgs       -> async TransferResult;
        account_balance : AccountBalanceArgs -> async ICP;
        query_blocks : shared query GetBlocksArgs -> async QueryBlocksResponse;
    };

    public type InterfaceIndex = actor {
        get_blocks : shared query GetBlocksArgs -> async GetBlocksResult;
    };
};