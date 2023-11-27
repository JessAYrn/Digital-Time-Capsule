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
}