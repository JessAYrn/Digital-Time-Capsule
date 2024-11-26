import Nat64 "mo:base/Nat64";
module{

    public let NnsCyclesMintingCanisterID = "rkp4c-7iaaa-aaaaa-aaaca-cai";

    public let One_Hundred_Million: Nat64 = 100_000_000;

    public type E8S = Nat64;
    
    public type XDR = Nat64;

    public type IcpXdrConversionRate = {
        xdr_permyriad_per_icp : Nat64;
        timestamp_seconds : Nat64;
    };

    public type IcpXdrConversionRateCertifiedResponse =  {
        certificate : [Nat8];
        data : IcpXdrConversionRate;
        hash_tree : [Nat8];
    };

    public type Interface = actor {
        get_icp_xdr_conversion_rate : query () -> async (IcpXdrConversionRateCertifiedResponse);
    };
};