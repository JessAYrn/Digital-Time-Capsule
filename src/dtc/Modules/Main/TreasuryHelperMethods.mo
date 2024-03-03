import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import Treasury "../../Treasury";
import TreasuryTypes "../../Types/Treasury/types";
import Ledger "../../NNS/Ledger";
import Account "../../Serializers/Account";

module{

    public func depositIcpToTreasury(
        daoMetaData: MainTypes.DaoMetaData_V2,
        profiles: MainTypes.UserProfilesMap,
        caller: Principal,
        amount: Nat64,
        recipientAddress: Account.AccountIdentifier
    ) : async {blockIndex: Nat64} {
        let ?userProfile = profiles.get(caller) else { throw Error.reject("User not found") };
        let userCanisterId = userProfile.canisterId;
        let userCanister: Journal.Journal = actor(Principal.toText(userCanisterId));
        let treasury: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let {blockIndex} = await userCanister.transferICP(amount, recipientAddress);
        await treasury.creditUserIcpDeposits(caller, amount);
        return {blockIndex};
    };
    
}