import Trie "mo:base/Trie";
import Types "/types";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Journal/journal.types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "/types";
import Journal "../Journal/Journal";
import Ledger "../Ledger/Ledger";
import Blob "mo:base/Blob";
import DIP721Types "../NFT/dip721.types";



module{

    public func createNFTCollection( 
        callerId: Principal, 
        mainCanisterPrincipal: Principal, 
        profilesTree: MainTypes.ProfilesTree, 
        initInput: DIP721Types.Dip721NonFungibleTokenInput
    ) : async Result.Result<(MainTypes.Nft, MainTypes.AmountAccepted), JournalTypes.Error> {

        let result = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

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
                    collectionIndex = initInput.collectionIndex;
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
            profilesTree: MainTypes.ProfilesTree, 
            nftCollections: MainTypes.NftCollectionsTree,
            nftCollectionIndex: Nat, 
            file_type: Text, 
            numberOfCopies: Nat
        ) : async DIP721Types.MintReceipt {

        let userAccount = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

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


    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

}