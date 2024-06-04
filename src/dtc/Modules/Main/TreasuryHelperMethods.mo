import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Float "mo:base/Float";
import Int64 "mo:base/Int64";
import Int "mo:base/Int";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import Treasury "../../Treasury";
import TreasuryTypes "../../Types/Treasury/types";
import Ledger "../../NNS/Ledger";
import Account "../../Serializers/Account";

module{

    public func depositIcpToTreasury(
        daoMetaData: MainTypes.DaoMetaData_V3,
        profiles: MainTypes.UserProfilesMap,
        caller: Principal,
        amount: Nat64
    ) : async {blockIndex: Nat64} {
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let userCanister: Journal.Journal = actor(Principal.toText(userCanisterId));
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let treasuryAccountId = await treasury.canisterAccountId();
        let {blockIndex} = await userCanister.transferICP(amount, treasuryAccountId);
        await treasury.creditUserIcpDeposits(caller, amount);
        return {blockIndex};
    };

    public func withdrawIcpFromTreasury(
        daoMetaData: MainTypes.DaoMetaData_V3,
        profiles: MainTypes.UserProfilesMap,
        caller: Principal,
        amount: Nat64
    ) : async {blockIndex: Nat64} {
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let userCanister: Journal.Journal = actor(Principal.toText(userCanisterId));
        let userAccountId = await userCanister.canisterAccount();
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {icp = userIcpDeposits} = await treasury.getUserTreasuryData(caller);
        if(userIcpDeposits.e8s < amount) {throw Error.reject("Insufficient funds");};
        let withdrawelamount = Int64.toNat64(Float.toInt64(Float.trunc(Float.fromInt64(Int64.fromNat64(amount)) * 0.995)));
        let {blockIndex} = await treasury.transferICP(withdrawelamount,userAccountId);
        await treasury.debitUserIcpDeposits(caller, amount);
        return {blockIndex};
    };
    
}