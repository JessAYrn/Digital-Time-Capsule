import Principal "mo:base/Principal";
import Error "mo:base/Error";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import Treasury "../../Treasury";
import Nat64 "mo:base/Nat64";
import TreasuryTypes "../../Types/Treasury/types";

module{

    public func depositIcpToTreasury(
        daoMetaData: MainTypes.DaoMetaData_V4,
        profiles: MainTypes.UserProfilesMap_V2,
        caller: Principal,
        amount: Nat64
    ) : async {amountSent: Nat64} {
        if(amount < 10_000){ return {amountSent: Nat64 = 0}; };
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let userCanister: Journal.Journal = actor(Principal.toText(userCanisterId));
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {subaccountId = userTreasurySubaccountId} = await treasury.getUserTreasuryData(caller);
        let {amountSent} = await userCanister.transferICP( amount, #PrincipalAndSubaccount(Principal.fromText(daoMetaData.treasuryCanisterPrincipal), ?userTreasurySubaccountId ));
        ignore treasury.updateTokenBalances(#SubaccountId(userTreasurySubaccountId), #Icp, #UserTreasuryData);
        return {amountSent};
    };

    public func withdrawIcpFromTreasury(
        daoMetaData: MainTypes.DaoMetaData_V4,
        profiles: MainTypes.UserProfilesMap_V2,
        caller: Principal,
        amount: Nat64
    ) : async {amountSent: Nat64} {
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {subaccountId = userTreasurySubaccountId} = await treasury.getUserTreasuryData(caller);
        let treasuryFee = amount / 200;
        let withdrawelamount = amount - treasuryFee;
        if(treasuryFee < 10_000 or withdrawelamount < 10_000){ return {amountSent: Nat64 = 0}; };
        ignore await treasury.transferICP(
            treasuryFee, {identifier = #SubaccountId(userTreasurySubaccountId); accountType = #UserTreasuryData}, 
            {owner = Principal.fromText(daoMetaData.treasuryCanisterPrincipal); subaccount = null; accountType = #MultiSigAccount});
        let {amountSent} = await treasury.transferICP(
            withdrawelamount,
            {identifier = #SubaccountId(userTreasurySubaccountId); accountType = #UserTreasuryData}, 
            {owner = userCanisterId; subaccount = null; accountType = #ExternalAccount}
        );
        return {amountSent};
    };    

    public func contributeToFundingCampaign(contributor: Principal, campaignId: Nat, amount: Nat64, daoMetaData: MainTypes.DaoMetaData_V4, profilesMap: MainTypes.UserProfilesMap_V2) 
    : async TreasuryTypes.FundingCampaignsArray {
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {balances = userBalances} = await treasury.getUserTreasuryData(contributor);
        if(userBalances.icp.e8s < amount) { 
            let txFee: Nat64 = 10_000;
            let amountToDepositToTreasury = amount - userBalances.icp.e8s + txFee;
            try{ignore await depositIcpToTreasury(daoMetaData, profilesMap, contributor, amountToDepositToTreasury);}
            catch(_){};
        };
        await treasury.contributeToFundingCampaign(Principal.toText(contributor), campaignId, amount);
    };
}