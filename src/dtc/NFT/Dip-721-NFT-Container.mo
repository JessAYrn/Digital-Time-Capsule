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

shared actor class Dip721NFT(custodian: Principal) = this {
    stable var transactionId: Types.TransactionId = 0;
    stable var nfts : Trie.Trie<Nat,Types.Nft> = Trie.empty();
    stable var nftsTrieIndex : Nat = 0;
    stable var custodians = List.make<Principal>(custodian);
    stable var logo : Types.LogoResult = {
        logo_type = "null";
        data = "null";
    };
    stable var name : Text = "null";
    stable var symbol : Text = "null";
    stable var maxLimit : Nat16 = 0;
    stable var collectionIndex : Nat = 0;
    stable var initArgsHaveBeenSet : Bool = false;

    stable var localFile : Trie.Trie<Nat,Blob> = Trie.empty();

    private var balance = Cycles.balance();

    private var capacity = 1000000000000;

    // https://forum.dfinity.org/t/is-there-any-address-0-equivalent-at-dfinity-motoko/5445/3
    let null_address : Principal = Principal.fromText("aaaaa-aa");

    public shared({ caller }) func setInitArgs(init: Types.Dip721NonFungibleToken) : async Result.Result<(),Types.ApiError> {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
            return #err(#Unauthorized);
        };

        let creatorOfCollectionAsList = List.make<Principal>(init.creatorOfCollection);
        let newCustodiansList = List.append(custodians, creatorOfCollectionAsList);
        custodians := newCustodiansList;
        
        if(not initArgsHaveBeenSet){
            logo := init.logo;
            name := init.name;
            symbol := init.symbol;
            maxLimit := init.maxLimit;
            collectionIndex := init.collectionIndex;
            initArgsHaveBeenSet := true;
        };
        #ok(());
    };

    public shared({ caller }) func clearUnsubmittedFile() : async Result.Result<(), Types.ApiError> {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
        return #err(#Unauthorized);
        };

        localFile := Trie.empty();
        #ok(());
    };

    public shared({ caller }) func uploadNftChunk(chunkId: Nat, blobChunk: Blob) : async Result.Result<(), Types.ApiError> {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
            return #err(#Unauthorized);
        };
        
        let (newTree, oldValueForThisKey) = Trie.put(
            localFile,
            natKey(chunkId),
            Nat.equal,
            blobChunk
        );

        localFile := newTree;
        #ok(());
    };

    public shared({ caller }) func mintNft(owner: Principal, file_Type: Text, numberOfCopies: Nat) : async Types.MintReceipt {
        if (not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })) {
            return #Err(#Unauthorized);
        };

        let ArrayBuffer = Buffer.Buffer<Principal>(1);

        var index = 0;
        while(index < numberOfCopies){
            ArrayBuffer.add(owner);
            index += 1;
        };

        let owners = ArrayBuffer.toArray();

        let newId = Nat64.fromNat(Trie.size(nfts));
        let nft : Types.Nft = {
            owners = owners;
            id = newId;
            fileType = file_Type;
            nftData = localFile;
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

        localFile := Trie.empty();

        return #Ok({
            token_id = newId;
            id = transactionId;
        });
    };
    
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
                Trie.filter(nfts, func(key : Nat, token: Types.Nft) : Bool {

                    let ownerPrincipal = Array.find(token.owners,  func (owner : Principal) : Bool {
                        user == owner;
                    });

                    return Option.isSome(ownerPrincipal);
                })
            )
        );
    };

    public query func ownersOfDip721(token_id: Types.TokenId) : async Types.OwnerResult {
        let itemAsOption = getTokenById(token_id);
        switch(itemAsOption){
            case(#ok(item)){
                let token = item.1;
                return #Ok(token.owners);
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

                let ownersArraySearchResultAsOption = Array.find(token.owners,  func (owner : Principal) : Bool {
                    from == owner;
                });

                if (
                    Option.isNull(ownersArraySearchResultAsOption) or
                    not List.some(custodians, func (custodian : Principal) : Bool { custodian == caller })
                ) {
                    return #Err(#Unauthorized);
                } else if (Principal.notEqual(from, Option.get(ownersArraySearchResultAsOption, Principal.fromActor(this)))) {
                    return #Err(#Other);
                } else {
                    
                    let ownersIter = Iter.fromArray(token.owners);
                    let ArrayBuffer = Buffer.Buffer<Principal>(1);
                    var foundOne = false;
                    
                    Iter.iterate<Principal>(ownersIter, func (owner: Principal, _index){
                        if (Principal.equal(owner, from) and foundOne == false){
                            ArrayBuffer.add(to);
                            foundOne := true;
                        } else {
                            ArrayBuffer.add(owner);
                        }
                    });

                    let newOwnersArray = ArrayBuffer.toArray();

                    let update : Types.Nft = {
                        owners = newOwnersArray;
                        id = token.id;
                        fileType = token.fileType;
                        nftData = token.nftData;
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

                let ownersArraySearchResultAsOption = Array.find(token.owners,  func (tokenOwner : Principal) : Bool {
                    owner == tokenOwner;
                });

                if(Principal.equal(owner, Option.get(ownersArraySearchResultAsOption, Principal.fromActor(this)))) {
                    let chunk = Trie.find(
                        token.nftData,
                        natKey(chunkKey),
                        Nat.equal
                    );

                    switch(chunk){
                        case null {
                            return #Err(#Other);
                        };
                        case (?result) {
                            return #Ok(result);
                        };
                    };
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
        let items = Trie.filter(nfts, func(key : Nat, token: Types.Nft) : Bool {
            let ownerPrincipal = Array.find(token.owners,  func (owner : Principal) : Bool {
                user == owner;
            });
            return Option.isSome(ownerPrincipal);
        });

        let itemsIter = Trie.iter(items);
        let ArrayBuffer = Buffer.Buffer<Types.TokenMetaData>(1);
        Iter.iterate<(Nat,Types.Nft)>(itemsIter, func(x :(Nat, Types.Nft), _index) {
            let nft = x.1;

            var numberOfCopiesOwnedByUser = 0;
            let ownersArrayIter = Iter.fromArray(nft.owners);
            Iter.iterate<Principal>(ownersArrayIter, func (principal : Principal, __index) {
                if(Principal.equal(principal, user)){
                    numberOfCopiesOwnedByUser += 1;
                }
            });

            let nft_Id = nft.id;
            let nftDataTree = nft.nftData;
            let nftFileType = nft.fileType;
            let nftDataTrieSize = Trie.size(nftDataTree);
            let numberOfCopiesOwned = numberOfCopiesOwnedByUser;
            let nftMetaDataInfo : Types.TokenMetaData = { 
                id = nft_Id; 
                nftDataTrieSize = nftDataTrieSize; 
                fileType = nftFileType; 
                numberOfCopiesOwned = numberOfCopiesOwned;
            };
            
            ArrayBuffer.add(nftMetaDataInfo);

        });
        let tokenIds = ArrayBuffer.toArray();
        return tokenIds;
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