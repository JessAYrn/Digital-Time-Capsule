import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import List "mo:base/List";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Bool "mo:base/Bool";
import Principal "mo:base/Principal";
import Types "dip721.types";
import Cycles "mo:base/ExperimentalCycles";
import Trie "mo:base/Trie";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Hash "mo:base/Hash";

shared actor class Dip721NFT(custodian: Principal, init : Types.Dip721NonFungibleToken) = Self {
    stable var transactionId: Types.TransactionId = 0;
    stable var nfts : Trie.Trie<Nat,Types.Nft> = Trie.empty();
    stable var nftsTrieIndex : Nat = 0;
    stable var custodians = List.make<Principal>(custodian);
    stable var logo : Types.LogoResult = init.logo;
    stable var name : Text = init.name;
    stable var symbol : Text = init.symbol;
    stable var maxLimit : Nat16 = init.maxLimit;
    stable var localFile : [Types.MetadataKeyVal] = [];

    private var balance = Cycles.balance();

    private var capacity = 1000000000000;

    // https://forum.dfinity.org/t/is-there-any-address-0-equivalent-at-dfinity-motoko/5445/3
    let null_address : Principal = Principal.fromText("aaaaa-aa");
    
    private func getTokenById(token_id: Types.TokenId) : Result.Result<(Nat, Types.Nft),Types.ApiError>  {
        let nftsTrieIter = Trie.iter(nfts);
        let nftsTrieSize = Trie.size(nfts);
        let nftsArray = Iter.toArray(nftsTrieIter);
        let ArrayBuffer = Buffer.Buffer<(Nat ,Types.Nft)>(1);

        var index = 0;

        while(index < nftsTrieSize){
            let nftAndKey = nftsArray[index];
            let nft = nftAndKey.1;
            if(nft.id == token_id){
                ArrayBuffer.add(nftAndKey);
            };
            index += 1;
        };
        let filteredNftArray = ArrayBuffer.toArray();
        if(ArrayBuffer.size() != 1){
            return #err(#InvalidTokenId);
        } else {
            return #ok(filteredNftArray[0]);
        }
    };

    public query func balanceOfDip721(user: Principal) : async Nat64 {
        return Nat64.fromNat(
        Trie.size(
            Trie.filter(nfts, func(key : Nat, token: Types.Nft) : Bool { token.owner == user })
        )
        );
    };

    public query func ownerOfDip721(token_id: Types.TokenId) : async Types.OwnerResult {
        let itemAsOption = getTokenById(token_id);
        switch(itemAsOption){
            case(#ok(item)){
                let token = item.1;
                return #Ok(token.owner);
            };
            case(#err(_)){
                return #Err(#InvalidTokenId);
            };
        };    
    };

    public shared({ caller }) func safeTransferFromDip721(from: Principal, to: Principal, token_id: Types.TokenId) : async Types.TxReceipt {  
        if (to == null_address) {
        return #Err(#ZeroAddress);
        } else {
        return transferFrom(from, to, token_id, caller);
        };
    };

    public shared({ caller }) func transferFromDip721(from: Principal, to: Principal, token_id: Types.TokenId) : async Types.TxReceipt {
        return transferFrom(from, to, token_id, caller);
    };

    func transferFrom(from: Principal, to: Principal, token_id: Types.TokenId, caller: Principal) : Types.TxReceipt {
        let item = getTokenById(token_id);
        switch (item) {
        case (#err(_)) {
            return #Err(#InvalidTokenId);
        };
        case (#ok(tokenWithKey)) {
            let token = tokenWithKey.1;
            let tokenKey = tokenWithKey.0;
            if (
            caller != token.owner and
            not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })
            ) {
            return #Err(#Unauthorized);
            } else if (Principal.notEqual(from, token.owner)) {
            return #Err(#Other);
            } else {
                let update : Types.Nft = {
                    owner = to;
                    id = token.id;
                    fileType = token.fileType;
                    metadata = token.metadata;
                };
                let (updatedNftsTrie, oldValueForThisKey) = Trie.put(
                    nfts,
                    natKey(tokenKey),
                    Nat.equal,
                    update
                );
                nfts := updatedNftsTrie;
                transactionId += 1;
                return #Ok(transactionId);   
            };
        };
        };
    };

    public query func supportedInterfacesDip721() : async [Types.InterfaceId] {
        return [#TransferNotification, #Burn, #Mint];
    };

    public query func logoDip721() : async Types.LogoResult {
        return logo;
    };

    public query func nameDip721() : async Text {
        return name;
    };

    public query func symbolDip721() : async Text {
        return symbol;
    };

    public query func totalSupplyDip721() : async Nat64 {
        return Nat64.fromNat(
        Trie.size(nfts)
        );
    };

    public query({ caller }) func getMetadataDip721Chunk(owner: Principal, chunkKey: Nat, token_id: Types.TokenId) : async Types.MetadataResult {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
        return #Err(#Unauthorized);
        };
        let item = getTokenById(token_id);
        
        switch (item) {
            case (#err(_)) {
                return #Err(#InvalidTokenId);
            };
            case (#ok(tokenWithKey)) {
                let token = tokenWithKey.1;
                if(Principal.equal(owner, token.owner)){
                    let metadataIter = Iter.fromArray(token.metadata);
                    let chunkIter = Iter.filter(metadataIter, func (x : Types.MetadataKeyVal) : Bool { x.key == chunkKey });
                    let chunkAsArray = Iter.toArray(chunkIter);
                    let chunk = chunkAsArray[0];
                    return #Ok(chunk);
                } else {
                    return #Err(#Unauthorized);
                }
            };
        };
    };

    public query func getMaxLimitDip721() : async Nat16 {
        return maxLimit;
    };

    public query func getTokenMetadataInfo(user: Principal) : async [Types.TokenMetaData] {
        let items = Trie.filter(nfts, func(key : Nat, token: Types.Nft) : Bool { token.owner == user });
        let itemsIter = Trie.iter(items);
        let ArrayBuffer = Buffer.Buffer<Types.TokenMetaData>(1);
        Iter.iterate<(Nat,Types.Nft)>(itemsIter, func(x :(Nat, Types.Nft), _index) {

            let nft = x.1;
            let nft_Id = nft.id;
            let nftMetadataArray = nft.metadata;
            let nftFileType = nft.fileType;
            let nftMetadataArraySize = Iter.size(Iter.fromArray(nftMetadataArray));
            let nftMetaDataInfo : Types.TokenMetaData = { 
                id = nft_Id; 
                metaDataArraySize = nftMetadataArraySize; 
                fileType = nftFileType; 
            };
            
            ArrayBuffer.add(nftMetaDataInfo);

        });
        let tokenIds = ArrayBuffer.toArray();
        return tokenIds;
    };

    public shared({ caller }) func clearUnsubmittedFile() : async Result.Result<(), Types.ApiError> {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
        return #err(#Unauthorized);
        };

        localFile := [];
        #ok(());
    };

    public shared({ caller }) func uploadNftChunk(metadata: Types.MetadataKeyVal) : async Result.Result<(), Types.ApiError> {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
        return #err(#Unauthorized);
        };

        let localFileIter = Iter.fromArray(localFile);
        let ArrayBuffer = Buffer.Buffer<{key: Nat; val: Blob;}>(1);
        Iter.iterate<Types.MetadataKeyVal>(localFileIter, func(x :Types.MetadataKeyVal, _index) {
            ArrayBuffer.add(x);
        });
        ArrayBuffer.add(metadata);

        localFile := ArrayBuffer.toArray();
        #ok(());
    };

    public shared({ caller }) func mintDip721(to: Principal, file_Type: Text) : async Types.MintReceipt {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
        return #Err(#Unauthorized);
        };

        let newId = Nat64.fromNat(Trie.size(nfts));
        let nft : Types.Nft = {
            owner = to;
            id = newId;
            fileType = file_Type;
            metadata = localFile;
        };

        let (newNftsTrie, oldValueForThisKey) = Trie.put(
            nfts,
            natKey(nftsTrieIndex),
            Nat.equal,
            nft
        );

        nfts := newNftsTrie;

        transactionId += 1;
        nftsTrieIndex += 1;

        localFile := [];

        return #Ok({
            token_id = newId;
            id = transactionId;
        });
    };

    public func wallet_receive() : async { accepted: Nat64 } {
        let amount = Cycles.available();
        let limit : Nat = capacity - balance;
        let accepted = 
            if (amount <= limit) amount
            else limit;
        let deposit = Cycles.accept(accepted);
        assert (deposit == accepted);
        balance += accepted;
        { accepted = Nat64.fromNat(accepted) };
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };
}