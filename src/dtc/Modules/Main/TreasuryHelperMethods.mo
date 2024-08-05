import Principal "mo:base/Principal";
import Error "mo:base/Error";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import Treasury "../../Treasury";
import Nat64 "mo:base/Nat64";

module{

    public func depositIcpToTreasury(
        daoMetaData: MainTypes.DaoMetaData_V4,
        profiles: MainTypes.UserProfilesMap_V2,
        caller: Principal,
        amount: Nat64
    ) : async {blockIndex: Nat64} {
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let userCanister: Journal.Journal = actor(Principal.toText(userCanisterId));
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {subaccountId = userTreasurySubaccountId} = await treasury.getUserTreasuryData(caller);
        let {blockIndex} = await userCanister.transferICP( amount, #PrincipalAndSubaccount(Principal.fromText(daoMetaData.treasuryCanisterPrincipal), ?userTreasurySubaccountId ));
        ignore treasury.updateTokenBalances(#SubaccountId(userTreasurySubaccountId), #Icp);
        return {blockIndex};
    };

    public func withdrawIcpFromTreasury(
        daoMetaData: MainTypes.DaoMetaData_V4,
        profiles: MainTypes.UserProfilesMap_V2,
        caller: Principal,
        amount: Nat64
    ) : async {blockIndex: Nat64} {
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {subaccountId = userTreasurySubaccountId} = await treasury.getUserTreasuryData(caller);
        let treasuryFee = amount / 200;
        let withdrawelamount = amount - treasuryFee;
        ignore await treasury.transferICP(treasuryFee, #SubaccountId(userTreasurySubaccountId), Principal.fromText(daoMetaData.treasuryCanisterPrincipal));
        let {blockIndex = blockIndex_2} = await treasury.transferICP(withdrawelamount,#SubaccountId(userTreasurySubaccountId), userCanisterId);
        ignore treasury.updateTokenBalances(#SubaccountId(userTreasurySubaccountId), #Icp);
        return {blockIndex = Nat64.fromNat(blockIndex_2)};
    };    
}