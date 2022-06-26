import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Trie "mo:base/Trie";
import Principal "mo:base/Principal";

module {
    public type Dip721NonFungibleToken = {
        logo: LogoResult;
        name: Text;
        symbol: Text;
        maxLimit : Nat16;
        collectionIndex : Nat;
        creatorOfCollection: Principal;
    };

    public type Dip721NonFungibleTokenInput = {
        logo: LogoResult;
        name: Text;
        symbol: Text;
        maxLimit : Nat16;
        collectionIndex : Nat;
    };

    public type ApiError = {
    #Unauthorized;
    #InvalidTokenId;
    #ZeroAddress;
    #Other;
    };

    public type Result<S, E> = {
    #Ok : S;
    #Err : E;
    };

    public type OwnerResult = Result<[Principal], ApiError>;
    public type TxReceipt = Result<Nat, ApiError>;

    public type TransactionId = Nat;
    public type TokenId = Nat64;

    public type InterfaceId = {
    #Approval;
    #TransactionHistory;
    #Mint;
    #Burn;
    #TransferNotification;
    };

    public type LogoResult = {
    logo_type: Text;
    data: Text;
    };

    public type Nft = {
        owners: [Principal];
        id: TokenId;
        fileType: Text;
        nftData: Trie.Trie<Nat, Blob>;
    };

    public type ExtendedMetadataResult = Result<{
    metadata_desc: MetadataDesc;
    token_id: TokenId;
    }, ApiError>;

    public type MetadataResult = Result<Blob, ApiError>;

    public type MetadataDesc = [MetadataPart];

    public type MetadataPart = {
    purpose: MetadataPurpose;
    key_val_data: [MetadataKeyVal];
    data: Blob;
    };

    public type MetadataPurpose = {
    #Preview;
    #Rendered;
    };

    public type MetadataKeyVal = {
    key: Nat;
    val: Blob;
    };

    public type MetadataVal = {
    #TextContent : Text;
    #BlobContent : Blob;
    #NatContent : Nat;
    #Nat8Content: Nat8;
    #Nat16Content: Nat16;
    #Nat32Content: Nat32;
    #Nat64Content: Nat64;
    };

    public type TokenMetaData = {
        id: TokenId;
        nftDataTrieSize: Nat;
        fileType: Text;
        numberOfCopiesOwned: Nat;
    };

    public type MintReceipt = Result<MintReceiptPart, ApiError>;

    public type MintReceiptPart = {
    token_id: TokenId;
    id: Nat;
    };
}