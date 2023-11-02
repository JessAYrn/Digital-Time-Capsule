module {
    public type BatchId = Nat;
    public type ChunkId = Nat;
    public type Key = Text;
    public type Time = Int;
    public type Content_encoding = Text;
    public type Sha256 = ? Blob;
    public type Chunk = Blob;

    public type ChunkData = (Content_encoding, Sha256, Chunk);

    public type Error ={
        #NotFound;
        #AlreadyExists;
        #NotAuthorized;
        #NoInputGiven;
        #InsufficientFunds;
        #TxFailed;
        #UserNameTaken;
        #WalletBalanceTooLow;
        #ZeroAddress;
        #NotAcceptingRequests;
    };


    public type ListResultObject = {
        content_type : Text;
        encodings: [{
            content_encoding : Text;
            length : Nat;
            modified :Int;
            sha256 : ?Blob;
        }];
        key : Key;
    };

    public type AssetArgs = {
        content_type: Text;
        max_age: ? Nat64;
        headers: ? [HeaderField];
        enable_aliasing: ? Bool;
        allow_raw_access: ? Bool;
        chunks: [(ChunkId, (Content_encoding, Sha256, Chunk))];
    };

    public type Assets = [(Key, AssetArgs)];

    public type CreateAssetArguments = {
        key: Key;
        content_type: Text;
        max_age: ? Nat64;
        headers: ? [HeaderField];
        enable_aliasing: ? Bool;
        allow_raw_access: ? Bool;
    };

    // Add or change content for an asset, by content encoding
    public type SetAssetContentArguments = {
        key: Key;
        content_encoding: Text;
        chunk_ids: [ChunkId];
        sha256: ? Blob;
    };

    // Remove content for an asset, by content encoding
    public type UnsetAssetContentArguments = {
        key: Key;
        content_encoding: Text;
    };

    // Delete an asset
    public type DeleteAssetArguments = {
        key: Key;
    };

    // Reset everything
    public type ClearArguments = {};

    public type BatchOperationKind = {
        #CreateAsset: CreateAssetArguments;
        #SetAssetContent: SetAssetContentArguments;
        #UnsetAssetContent: UnsetAssetContentArguments;
        #DeleteAsset: DeleteAssetArguments;
        #Clear: ClearArguments;
    };

    public type HeaderField = { text: Text; };

    public type HttpRequest = {
        method: Text;
        url: Text;
        headers: [HeaderField];
        body: Blob;
    };

    public type HttpResponse = {
        status_code: Nat16;
        headers: [HeaderField];
        body: Blob;
        streaming_strategy: ? StreamingStrategy;
    };

    public type StreamingCallbackHttpResponse = {
        body: Blob;
        token: ? StreamingCallbackToken;
    };

    public type StreamingCallbackToken = {
        key: Key;
        content_encoding: Text;
        index: Nat;
        sha256: ? Blob;
    };

    public type StreamingStrategy = {
        #Callback: {
            callback: query (StreamingCallbackToken) -> async (? StreamingCallbackHttpResponse);
            token: StreamingCallbackToken;
        };
    };

    public type SetAssetPropertiesArguments = {
        key: Key;
        max_age: ?? Nat64;
        headers: ??  [HeaderField];
        allow_raw_access: ?? Bool;
    };

    public type Permission = {
        #Commit;
        #ManagePermissions;
        #Prepare;
    };

    public type GrantPermission = {
        to_principal: Principal;
        permission: Permission;
    };
    public type RevokePermission = {
        of_principal: Principal;
        permission: Permission;
    };
    public type ListPermitted = { permission: Permission };

    public type ValidationResult = { #Ok : Text; #Err : Text };

    public type Interface = actor {
        get: query ({
            key: Key;
            accept_encodings: [Text];
        }) -> async ({
            content: Blob; // may be the entirety of the content, or just chunk index 0
            content_type: Text;
            content_encoding: Text;
            sha256: ? Blob; // sha256 of entire asset encoding, calculated by dfx and passed in SetAssetContentArguments
            total_length: Nat; // all chunks except last have size == content.size()
        }) ;
        // if get() returned chunks > 1, call this to retrieve them.
        // chunks may or may not be split up at the same boundaries as presented to create_chunk().
        get_chunk: query ({
            key: Key;
            content_encoding: Text;
            index: Nat;
            sha256: ? Blob;  // sha256 of entire asset encoding, calculated by dfx and passed in SetAssetContentArguments
        }) -> async ({ content: Blob });
        list : query ({}) -> async ([{
                key: Key;
                content_type: Text;
                encodings: [{
                content_encoding: Text;
                sha256: ? Blob; // sha256 of entire asset encoding, calculated by dfx and passed in SetAssetContentArguments
                length: Nat; // Size of this encoding's blob. Calculated when uploading assets.
                modified: Time;
            }];
        }]);
        certified_tree : query ({}) -> async ({
            certificate: Blob;
            tree: Blob;
        });
        create_batch : ({}) -> async ({ batch_id: BatchId });
        create_chunk: ({ batch_id: BatchId; content: Blob }) -> async ({ chunk_id: ChunkId });
        // Perform all operations successfully, or reject
        commit_batch: ({ batch_id: BatchId; operations: [BatchOperationKind] }) -> async ();
        create_asset: (CreateAssetArguments) -> async ();
        set_asset_content: (SetAssetContentArguments) -> async ();
        unset_asset_content: (UnsetAssetContentArguments) -> ();
        delete_asset: (DeleteAssetArguments) -> ();
        clear: (ClearArguments) -> async ();
        // Single call to create an asset with content for a single content encoding that
        // fits within the message ingress limit.
        store: ({
            key: Key;
            content_type: Text;
            content_encoding: Text;
            content: Blob;
            sha256: ? Blob
        }) -> ();
        http_request: query (request: HttpRequest) -> async (HttpResponse);
        http_request_streaming_callback: query (token: StreamingCallbackToken) -> async (? StreamingCallbackHttpResponse);
        authorize: (Principal) -> async ();
        deauthorize: (Principal) -> ();
        list_authorized: query () -> async ([Principal]) ;
        grant_permission: (GrantPermission) -> ();
        revoke_permission: (RevokePermission) -> ();
        list_permitted: query (ListPermitted) -> async ([Principal]);
        take_ownership: () -> async ();
        get_asset_properties : query (key: Key) -> async ({
            max_age: ? Nat64;
            headers: ? [HeaderField];
            allow_raw_access: ? Bool; 
        });
        set_asset_properties: (SetAssetPropertiesArguments) -> ();
        validate_grant_permission: (GrantPermission) -> async (ValidationResult);
        validate_revoke_permission: (RevokePermission) -> async (ValidationResult);
    };

};