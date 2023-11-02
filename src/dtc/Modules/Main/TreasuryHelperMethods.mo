import Result "mo:base/Result";
import Principal "mo:base/Principal";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import Treasury "../../Treasury";
import TreasuryTypes "../../Types/Treasury/types";
import Ledger "../../Ledger/Ledger";

module{    
    public func depositAssetToTreasury({
        depositorPrincipal: Text; 
        treasuryCanisterPrincipal: Text;
        amount: Nat64;
        currency : TreasuryTypes.SupportedCurrencies;
        profilesMap: MainTypes.UserProfilesMap;
    }) : async Result.Result<(Ledger.ICP), MainTypes.Error> {

        let userProfile = profilesMap.get(Principal.fromText(depositorPrincipal));
        let treasuryCanister : Treasury.Treasury = actor(treasuryCanisterPrincipal);
        switch(userProfile){
            case null {};
            case(?profile){
                let {canisterId} = profile;
                let userCanister : Journal.Journal = actor(Principal.toText(canisterId));
                let treasuryIcpAccountId = await treasuryCanister.canisterAccount();
                let trasnferCompleted = await userCanister.transferICP(amount, treasuryIcpAccountId);
                if(trasnferCompleted) {
                    let result = treasuryCanister.updateUserTreasruyContributions({
                        userPrincipal = depositorPrincipal;
                        increase = true;
                        currency;
                        amount;
                    });
                } else return #err(#InsufficientFunds);
            };
        };
        let updatedBalance = await treasuryCanister.canisterBalance();
        return #ok(updatedBalance);
    };
}