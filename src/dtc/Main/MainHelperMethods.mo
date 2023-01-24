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

module{

    public func create (
        callerId: Principal, 
        requestsForAccess: MainTypes.RequestsForAccess, 
        profilesTree: MainTypes.ProfilesTree, 
        isLocal: Bool
    ) : async Result.Result<(MainTypes.ProfilesTree, MainTypes.AmountAccepted), JournalTypes.Error> {

        if(not isLocal and Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let callerIdAsText = Principal.toText(callerId);
        let isApprovedOption = Array.find(
            requestsForAccess, func (x: (Text, MainTypes.Approved)) : Bool {
                let (principalAsText, approved) = x;
                if(principalAsText == callerIdAsText and approved == true){
                    return true;
                } else {
                    false
                };
            }
        );

        if(Option.isNull(isApprovedOption) == true){
            return #err(#NotAuthorized);
        };

        let existing = Trie.find(
            profilesTree,       //Target Trie
            key(callerId), //Key
            Principal.equal
        );

        // If there is an original value, do not update
        switch(existing) {
            case null {
                Cycles.add(1_000_000_000_000);
                let newUserJournal = await Journal.Journal(callerId);
                let amountAccepted = await newUserJournal.wallet_receive();
                let settingMainCanister = await newUserJournal.setMainCanisterPrincipalId();
                let userAccountId = await newUserJournal.canisterAccount();
                let userProfile: MainTypes.Profile = {
                    journal = newUserJournal;
                    email = null;
                    userName = null;
                    id = callerId;
                    accountId = ?userAccountId;
                    approved = ?true;
                    treasuryMember = ?false;
                    treasuryContribution = ?0;
                    monthsSpentAsTreasuryMember = ?0;
                };
                let (newProfiles, oldValueForThisKey) = Trie.put(
                    profilesTree, 
                    key(callerId),
                    Principal.equal,
                    userProfile
                );
                
                return #ok((newProfiles, amountAccepted));
            };
            case ( ? v) {
                return #err(#AlreadyExists);
            }
        };
    };

    public func updateProfile(callerId: Principal, profilesTree: MainTypes.ProfilesTree, profile: MainTypes.ProfileInput) : 
    async Result.Result<MainTypes.ProfilesTree, JournalTypes.Error> {

        let result = Trie.find(
            profilesTree,       //Target Trie
            key(callerId), //Key
            Principal.equal      //Equality Checker
        );

        switch (result){
            //Preventing updates to profiles that haven't been created yet
            case null {
                #err(#NotFound);
            };
            case(? v) {

                let userNameAvailable = isUserNameAvailable(profile.userName, callerId, profilesTree);
                if(userNameAvailable == true){
                    let userProfile : MainTypes.Profile = {
                        journal = v.journal;
                        email = profile.email;
                        userName = profile.userName;
                        id = callerId;
                        accountId = v.accountId;
                        approved = ?true;
                        treasuryMember = ?false;
                        treasuryContribution = ?0;
                        monthsSpentAsTreasuryMember = ?0;

                    };

                    let newTree = Trie.replace(
                        profilesTree,       //Target trie
                        key(callerId), //Key
                        Principal.equal,      //Equality Checker
                        ?userProfile        //The profile that you mean to use to overWrite the existing profile
                    ).0;                // The result is a tuple where the 0th entry is the resulting profiles trie
                    #ok(newTree);
                } else {
                    #err(#UserNameTaken);
                }
            };
        };
    };


    public func delete(callerId: Principal, profilesTree: MainTypes.ProfilesTree) : 
    async Result.Result<MainTypes.ProfilesTree, JournalTypes.Error> {

        let result = Trie.find(
            profilesTree,       //Target Trie
            key(callerId), //Key
            Principal.equal       //Equality Checker
        );

        switch (result){
            //Preventing updates to profiles that haven't been created yet
            case null {
                #err(#NotFound);
            };
            case(? v) {

                let newTree = Trie.replace(
                    profilesTree,
                    key(callerId),
                    Principal.equal,
                    null
                ).0;    
                #ok(newTree);
            };
        };
    };

    public func isUserNameAvailable(userName: ?Text, callerId: Principal, profilesTree: MainTypes.ProfilesTree) : Bool {
        switch(userName){
            case null{
                true
            };
            case (? userNameValue){
                var index = 0;
                let numberOfProfiles = Trie.size(profilesTree);
                let profilesIter = Trie.iter(profilesTree);
                let profilesArray = Iter.toArray(profilesIter);
                let ArrayBuffer = Buffer.Buffer<(Principal,Types.Profile)>(1);

                while(index < numberOfProfiles){
                    let userProfile = profilesArray[index];
                    switch(userProfile.1.userName){
                        case null{
                            index += 1;
                        };
                        case (? username){
                            if((username == userNameValue)){
                                if(userProfile.1.id != callerId){
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

    public func refillCanisterCycles(profilesTree : MainTypes.ProfilesTree) : async () {
        let numberOfProfiles = Trie.size(profilesTree);
        let profilesIter = Trie.iter(profilesTree);
        let profilesArray = Iter.toArray(profilesIter);
        var index = 0;
        while(index < numberOfProfiles){
            let (principal, profile) = profilesArray[index];
            let approved = Option.get(profile.approved, false);
            if(approved){
                Cycles.add(100_000_000_000);
                let amountAccepted = ignore profile.journal.wallet_receive();
            };
            index += 1;
        };
    };

    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };
}