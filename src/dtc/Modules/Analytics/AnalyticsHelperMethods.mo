import MainTypes "../../Types/Main/types";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Journal "../../Journal";
import Treasury "../../Treasury";
import AnalyticsTypes "../../Types/Analytics/types";

module{

    public func saveCurrentBalances(userProfilesMap: MainTypes.UserProfilesMap, daoMetaData: MainTypes.DaoMetaData_V2): async (){
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        ignore treasuryCanister.saveCurrentBalances();
        let userProfilesArray = Iter.toArray(userProfilesMap.entries());
        var index = 0;
        while(index < userProfilesArray.size()){
            let (principal, profile) = userProfilesArray[index];
            let{canisterId} = profile;
            let userCansiter : Journal.Journal = actor(Principal.toText(canisterId));
            ignore userCansiter.saveCurrentBalances();
            index += 1;
        }
    };

    public func retrieveUserBalances(callerId: Principal, userProfilesMap: MainTypes.UserProfilesMap) : 
    async AnalyticsTypes.BalancesArray {
        let userProfile = userProfilesMap.get(callerId);
        switch(userProfile){
            case null { throw Error.reject("No profile found for this principal")};
            case(?profile) {
                let userCanister : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let balancesHistory = await userCanister.readBalancesHistory();
                return balancesHistory;
            };
        };
    };

    public func retrieveTreasuryBalances(daoMetaData: MainTypes.DaoMetaData_V2) :  
    async AnalyticsTypes.BalancesArray {
        let treasuryCanister : Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
        let balancesHistory = await treasuryCanister.readBalancesHistory();
        return balancesHistory;
    };

}