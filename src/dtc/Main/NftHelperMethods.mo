import Trie "mo:base/Trie";
import Types "types";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Journal/journal.types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "types";
import Journal "../Journal/Journal";
import Ledger "../Ledger/Ledger";
import Blob "mo:base/Blob";
import DIP721Types "../NFT/dip721.types";
import NFT "../NFT/Dip-721-NFT-Container";



module{

    public func createNFTCollection( 
        callerId: Principal, 
        mainCanisterPrincipal: Principal, 
        profilesMap: MainTypes.ProfilesMap, 
        initInput: DIP721Types.Dip721NonFungibleTokenInput,
        nftCollectionIndex: Nat
    ) : async Result.Result<(MainTypes.Nft, MainTypes.AmountAccepted), JournalTypes.Error> {

        let result = profilesMap.get(callerId);

        switch(result){
            case null{
                #err(#NotFound);
            };
            case (? existingProfile){
                Cycles.add(1_000_000_000_000);
                let newNftCollection = await NFT.Dip721NFT( mainCanisterPrincipal );
                let amountAccepted = await newNftCollection.wallet_receive();

                let init = {
                    logo = initInput.logo;
                    name = initInput.name;
                    symbol = initInput.symbol;
                    maxLimit = initInput.maxLimit;
                    collectionIndex = nftCollectionIndex;
                    creatorOfCollection = callerId;
                };

                let initResult = await newNftCollection.setInitArgs(init);
                let collection : MainTypes.Nft = {
                    nftCollection = newNftCollection
                };
                #ok((collection, amountAccepted));
            }; 
        };
                
    };

    public func mintNft( 
        callerId: Principal, 
        profilesMap: MainTypes.ProfilesMap, 
        nftCollections: MainTypes.NftCollectionsTree,
        nftCollectionIndex: Nat, 
        file_type: Text, 
        numberOfCopies: Nat
    ) : async DIP721Types.MintReceipt {

        let userAccount = profilesMap.get(callerId);

        switch(userAccount){
            case null{
                #Err(#Unauthorized);
            };  
            case(? exisitingAccount){
                let result = Trie.find(
                    nftCollections,
                    natKey(nftCollectionIndex),
                    Nat.equal
                );

                switch(result){
                    case null{
                        #Err(#Other);
                    };
                    case(? existingCollection){
                        let collection = existingCollection.nftCollection;
                        let receipt = await collection.mintNft(callerId, file_type, numberOfCopies);
                        return receipt;
                    };
                };
            };
        };
    };

    public func uploadNftChunk(
    callerId: Principal, 
    profilesMap: MainTypes.ProfilesMap,
    nftCollections: MainTypes.NftCollectionsTree,
    nftCollectionIndex : Nat, 
    chunkId: Nat, 
    blobChunk: Blob) : async Result.Result<(), DIP721Types.ApiError>{

        let userAccount = profilesMap.get(callerId);

        switch(userAccount){
            case null{
                #err(#Unauthorized);
            };  
            case(? exisitingAccount){
                let result = Trie.find(
                    nftCollections,
                    natKey(nftCollectionIndex),
                    Nat.equal
                );

                switch(result){
                    case null{
                        #err(#Other);
                    };
                    case(? existingCollection){
                        let collection = existingCollection.nftCollection;
                        let receipt = await collection.uploadNftChunk(chunkId, blobChunk);
                        return receipt;
                    };
                };
            };
        };

    };

    public func safeTransferNFT( 
    callerId: Principal, 
    profilesMap: MainTypes.ProfilesMap, 
    nftCollections:MainTypes.NftCollectionsTree, 
    nftCollectionIndex: Nat, 
    to: Principal, 
    token_id: DIP721Types.TokenId) : async DIP721Types.TxReceipt{

        let userProfile = profilesMap.get(callerId);
        switch(userProfile){
            case null{
                return #Err(#ZeroAddress);
            };
            case(? existingProfile){
                let recipient = profilesMap.get(to);
                switch(recipient){
                    case null{
                        return #Err(#ZeroAddress);
                    };
                    case (? existingRecipient){
                        let nftCollection = Trie.find(
                            nftCollections,
                            natKey(nftCollectionIndex),
                            Nat.equal
                        );
                        switch(nftCollection){
                            case null{
                                return #Err(#Other);
                            }; 
                            case (? existingNftCollection){
                                let collection = existingNftCollection.nftCollection;
                                let result = await collection.safeTransferFromDip721(callerId, to, token_id);
                                return result;
                            };
                        };
                    };
                };
            };
        };

    };

    public func getUserNFTsInfo(
    callerId: Principal,
    profilesMap: MainTypes.ProfilesMap, 
    nftCollections: MainTypes.NftCollectionsTree) : 
    async Result.Result<[({nftCollectionKey: Nat}, DIP721Types.TokenMetaData)], JournalTypes.Error> {

        let userProfile = profilesMap.get(callerId);

        switch(userProfile){
            case null{
                #err(#NotFound);
            };
            case (? existingProfile){
                let nftCollectionsTrieSize = Trie.size(nftCollections);
                let nftCollectionsIter = Trie.iter(nftCollections);
                let nftCollectionsArray = Iter.toArray(nftCollectionsIter);
                let ArrayBuffer = Buffer.Buffer<({nftCollectionKey: Nat}, DIP721Types.TokenMetaData)>(1);

                var index = 0;

                while(index < nftCollectionsTrieSize){
                    let collectionAndKey = nftCollectionsArray[index];
                    let collectionKey = collectionAndKey.0;
                    let collectionObject = collectionAndKey.1;
                    let collection = collectionObject.nftCollection;
                    let tokenMetadataInfoArray = await collection.getTokenMetadataInfo(callerId);
                    let tokenIdsCount = Iter.size(Iter.fromArray(tokenMetadataInfoArray));

                    var index_1 = 0;
                    
                    while(index_1 < tokenIdsCount){
                        let tokenMetadataInfo = tokenMetadataInfoArray[index_1];
                        ArrayBuffer.add(({ nftCollectionKey = collectionKey; }, tokenMetadataInfo));
                        index_1 += 1;
                    };
                    index += 1;
                };

                return #ok(ArrayBuffer.toArray());
            };
        };
    };

    public func getNftChunk( 
    callerId: Principal,
    nftCollections: MainTypes.NftCollectionsTree,
    nftCollectionKey : Nat, 
    tokenId: Nat64, 
    chunkKey: Nat) : 
    async DIP721Types.MetadataResult {

        let result = Trie.find(
            nftCollections,
            natKey(nftCollectionKey),
            Nat.equal
        );
        switch(result){
            case null{
                #Err(#Other);
            };
            case (? nftCollection){
                let collection = nftCollection.nftCollection;
                let nftChunk = await collection.getMetadataDip721Chunk(callerId, chunkKey, tokenId);
                return nftChunk;
            };
        };
    };



    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

}