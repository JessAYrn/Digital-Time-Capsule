import Principal "mo:base/Principal";
import Error "mo:base/Error";
import MainTypes "types";
import User "../User/Actor";
import Treasury "../Treasury/Actor";
import Nat64 "mo:base/Nat64";
import TreasuryTypes "../Treasury/types";
import NatX "../../MotokoNumbers/NatX";

module{

    public func depositIcpToTreasury(
        daoMetaData: MainTypes.DaoMetaData_V4,
        profiles: MainTypes.UserProfilesMap_V2,
        caller: Principal,
        amount: Nat64
    ) : async {amountSent: Nat64} {
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let userCanister: User.User = actor(Principal.toText(userCanisterId));
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
        let {subaccountId = userTreasurySubaccountId; balances} = await treasury.getUserTreasuryData(caller);
        let withdrawelamount = Nat64.min(amount, balances.icp.e8s);
        let treasuryFee: Nat64 = switch(Principal.toText(caller) == daoMetaData.founder){
            case true { 0 };
            case false { NatX.nat64ComputeFractionMultiplication({factor = withdrawelamount; numerator = 1; denominator = 200}); };
        };

        if(withdrawelamount < 1_000_000){ return {amountSent: Nat64 = 0}; };
        
        ignore await treasury.transferICP(
            treasuryFee, {identifier = #SubaccountId(userTreasurySubaccountId); accountType = #UserTreasuryData}, 
            {owner = Principal.fromText(daoMetaData.treasuryCanisterPrincipal); subaccount = null; accountType = #MultiSigAccount}
        );

        let {amountSent} = await treasury.transferICP(
            withdrawelamount - treasuryFee,
            {identifier = #SubaccountId(userTreasurySubaccountId); accountType = #UserTreasuryData}, 
            {owner = userCanisterId; subaccount = null; accountType = #ExternalAccount}
        );
        
        return {amountSent};
    };    

    public func contributeToFundingCampaign(contributor: Principal, campaignId: Nat, amount: Nat64, daoMetaData: MainTypes.DaoMetaData_V4, profilesMap: MainTypes.UserProfilesMap_V2) 
    :async TreasuryTypes.FundingCampaignsArray {
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {balances = userBalances} = await treasury.getUserTreasuryData(contributor);
        if(userBalances.icp.e8s < amount) { 
            let amountToDepositToTreasury = amount - userBalances.icp.e8s;
            try{ignore await depositIcpToTreasury(daoMetaData, profilesMap, contributor, amountToDepositToTreasury);}
            catch(_){};
        };
        await treasury.contributeToFundingCampaign(Principal.toText(contributor), campaignId, amount);
    };

    public func repayFundingCampaign(contributor: Principal, campaignId: Nat, amount: Nat64, daoMetaData: MainTypes.DaoMetaData_V4, profilesMap: MainTypes.UserProfilesMap_V2)
    : async TreasuryTypes.FundingCampaignsArray {
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {balances = userBalances} = await treasury.getUserTreasuryData(contributor);
        if(userBalances.icp.e8s < amount) { 
            let amountToDepositToTreasury = amount - userBalances.icp.e8s;
            try{ignore await depositIcpToTreasury(daoMetaData, profilesMap, contributor, amountToDepositToTreasury);}
            catch(_){};
        };
        await treasury.repayFundingCampaign(Principal.toText(contributor), campaignId, amount);
    };
}