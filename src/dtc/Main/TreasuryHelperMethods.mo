import Result "mo:base/Result";
import Principal "mo:base/Principal";
import MainTypes "types";
import Journal "../Journal/Journal";
import Treasury "../Treasury/Treasury";
import TreasuryTypes "../Treasury/treasury.types";

module{    
    public func depositAssetToTreasury({
        depositorPrincipal: Text; 
        treasuryCanisterPrincipal: Text;
        amount: Nat64;
        currency : TreasuryTypes.SupportedCurrencies;
        profilesMap: MainTypes.UserProfilesMap;
    }) : async () {

        let userProfile = profilesMap.get(Principal.fromText(depositorPrincipal));
        switch(userProfile){
            case null {};
            case(?profile){
                let {canisterId} = profile;
                let userCanister : Journal.Journal = actor(Principal.toText(canisterId));
                let treasuryCanister : Treasury.Treasury = actor(treasuryCanisterPrincipal);
                let treasuryIcpAccountId = await treasuryCanister.canisterAccount();
                let trasnferCompleted = await userCanister.transferICP(amount, treasuryIcpAccountId);
                if(trasnferCompleted) {
                    let result = treasuryCanister.updateUserTreasruyContributions({
                        userPrincipal = depositorPrincipal;
                        increase = true;
                        currency;
                        amount;
                    });
                }
            };
        }
    };
}