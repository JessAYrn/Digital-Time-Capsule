import Trie "mo:base/Trie";
import Types "types";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Journal/journal.types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "types";
import Array "mo:base/Array";
import Journal "../Journal/Journal";
import CanisterManagementMethods "../Main/CanisterManagementMethods";
import HashMap "mo:base/HashMap";
import AssetCanister "../AssetCanister/AssetCanister";
import Manager "../Manager/Manager";
import IC "../IC/ic.types";

module{

    private let ic : IC.Self = actor "aaaaa-aa";

    public func create (
        callerId: Principal, 
        profilesMap: MainTypes.UserProfilesMap, 
        appMetaData: MainTypes.AppMetaData
    ) : async Result.Result<MainTypes.AmountAccepted, JournalTypes.Error> {

        if(Principal.toText(callerId) == "2vxsx-fae"){ return #err(#NotAuthorized);};

        let callerIdAsText = Principal.toText(callerId);
        let requestForAccess = Array.find(
            appMetaData.requestsForAccess, func (x: (Text, MainTypes.Approved)) : Bool {
                let (principalAsText, approved) = x;
                if(principalAsText == callerIdAsText and approved){ return true;}
                else { false };
            }
        );
        if(Option.isNull(requestForAccess)) { return #err(#NotAuthorized);};

        let ?(principal, isApproved) = requestForAccess;
        if(not isApproved){ return #err(#NotAuthorized);};

        let existing = profilesMap.get(callerId);

        // If there is an original value, do not update
        switch(existing) {
            case null {
                Cycles.add(1_000_000_000_000);
                let newUserJournal = await Journal.Journal(callerId);
                let amountAccepted = await newUserJournal.wallet_receive();
                ignore CanisterManagementMethods.addController(
                    appMetaData.managerCanisterPrincipal,
                    Principal.fromActor(newUserJournal),
                    appMetaData.defaultControllers
                );
                let settingMainCanister = await newUserJournal.setMainCanisterPrincipalId();
                let userAccountId = await newUserJournal.canisterAccount();
                let userProfile: MainTypes.UserProfile = {
                    canisterId = Principal.fromActor(newUserJournal);
                    email = null;
                    userName = null;
                    userPrincipal = callerId;
                    accountId = ?userAccountId;
                    approved = ?true;
                    treasuryMember = ?false;
                    treasuryContribution = ?0;
                    monthsSpentAsTreasuryMember = ?0;
                };
                profilesMap.put(callerId, userProfile);
                
                return #ok(amountAccepted);
            };
            case ( ? v) { return #err(#AlreadyExists); }
        };
    };

    public func updateProfile(callerId: Principal, profilesMap: MainTypes.UserProfilesMap, profile: MainTypes.ProfileInput) : 
    async Result.Result<(), JournalTypes.Error> {
        let result = profilesMap.get(callerId);
        switch (result){
            case null { return #err(#NotFound); };
            case(? v) {
                let userNameAvailable = isUserNameAvailable(profile.userName, callerId, profilesMap);
                if(not userNameAvailable){ return #err(#UserNameTaken); };
                let userProfile : MainTypes.UserProfile = {
                    canisterId = v.canisterId;
                    email = profile.email;
                    userName = profile.userName;
                    userPrincipal = callerId;
                    accountId = v.accountId;
                    approved = ?true;
                    treasuryMember = ?false;
                    treasuryContribution = ?0;
                    monthsSpentAsTreasuryMember = ?0;
                };
                let newProfile = profilesMap.replace(callerId, userProfile);            
                return #ok(());
            };
        };
    };


    public func delete(callerId: Principal, profilesMap: MainTypes.UserProfilesMap) : 
    async Result.Result<(), JournalTypes.Error> {
        let result = profilesMap.get(callerId);
        switch (result){
            case null { #err(#NotFound); };
            case(? v) {
                let newProfile = profilesMap.delete(callerId);
                #ok(());
            };
        };
    };

    public func isUserNameAvailable(userName: ?Text, callerId: Principal, profilesMap: MainTypes.UserProfilesMap) : Bool {
        switch(userName){
            case null{
                true
            };
            case (? userNameValue){
                var index = 0;
                let numberOfProfiles = profilesMap.size();
                let profilesIter = profilesMap.entries();
                let profilesArray = Iter.toArray(profilesIter);
                let ArrayBuffer = Buffer.Buffer<(Principal,Types.UserProfile)>(1);

                while(index < numberOfProfiles){
                    let userProfile = profilesArray[index];
                    switch(userProfile.1.userName){
                        case null{
                            index += 1;
                        };
                        case (? username){
                            if((username == userNameValue)){
                                if(userProfile.1.userPrincipal != callerId){
                                    ArrayBuffer.add(userProfile);
                                };
                            };
                            index += 1;
                        };
                    };
                };

                if(ArrayBuffer.size() > 0){
                    false
                } else {
                    true
                }
            };
        };
    };

    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };
}