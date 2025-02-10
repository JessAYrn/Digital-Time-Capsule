import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import MainTypes "types";
import User "../User/Actor";
import CanisterManagementMethods "CanisterManagementMethods";
import Treasury "../Treasury/Actor";

module{

    public func create (
        callerId: Principal, 
        userName: Text,
        profilesMap: MainTypes.UserProfilesMap_V2, 
        daoMetaData: MainTypes.DaoMetaData_V4,
        subnetType: MainTypes.SubnetType
    ) : async MainTypes.AmountAccepted {

        // If there is an original value, do not update
        switch(profilesMap.get(callerId)) {
            case null {
                if(not isUserNameAvailable(userName, profilesMap)){ throw Error.reject("The selected user name has already been taken") };
                let amountOfCyclesToSend = switch(subnetType){ case(#Fiduciary){ 2_500_000_000_000 }; case(#Application){ 1_250_000_000_000}};
                Cycles.add<system>(amountOfCyclesToSend);
                let newUserJournal = await User.User();
                let amountAccepted = await newUserJournal.wallet_receive();
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
                ignore treasuryCanister.createTreasuryData(callerId);
                ignore CanisterManagementMethods.addControllers( [daoMetaData.managerCanisterPrincipal], Principal.fromActor(newUserJournal) );
                ignore newUserJournal.setMainCanisterPrincipalId();
                let userAccountId = await newUserJournal.canisterAccount();
                let userProfile: MainTypes.UserProfile_V2 = {
                    canisterId = Principal.fromActor(newUserJournal);
                    email = null;
                    userName;
                    userPrincipal = callerId;
                    accountId = ?userAccountId;
                    approved = ?true;
                };
                profilesMap.put(callerId, userProfile);
                
                return amountAccepted
            };
            case (_) { return throw Error.reject("A profile already exists for this principal ID"); }
        };
    };

    public func isUserNameAvailable(userName: Text, profilesMap: MainTypes.UserProfilesMap_V2) : Bool {
        label lopp_ for((_, userProfile) in profilesMap.entries()){ 
            let inputUserName_ = Text.toLowercase(userName) else continue lopp_;
            let userProfileUserName_ = Text.toLowercase(userProfile.userName) else continue lopp_;
            if((inputUserName_ == userProfileUserName_)){ return false; }; 
        };
        return true;
    };
}