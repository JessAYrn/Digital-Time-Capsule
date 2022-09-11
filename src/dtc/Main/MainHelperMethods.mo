import Trie "mo:base/Trie";
import Types "/types";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Journal/journal.types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "/types";
import Journal "../Journal/Journal";

module{

    public func create (callerId: Principal, profilesTree: MainTypes.ProfilesTree) : 
    async Result.Result<(MainTypes.ProfilesTree, MainTypes.AmountAccepted), JournalTypes.Error> {

        if(Principal.toText(callerId) == "2vxsx-fae"){
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

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

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

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized)
        };

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

    public func refillCanisterCycles(callerId : Principal, profilesTree : MainTypes.ProfilesTree ) : 
    async Result.Result<((Nat,[Nat64])), JournalTypes.Error> {
        let result = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                #err(#NotAuthorized);
            };
            case(? profile){
                switch(profile.userName){
                    case null{
                        #err(#NotAuthorized);
                    };
                    case (? existingUserName){
                        if(existingUserName == "admin"){
                            var index = 0;
                            let numberOfProfiles = Trie.size(profilesTree);
                            let profilesIter = Trie.iter(profilesTree);
                            let profilesArray = Iter.toArray(profilesIter);
                            let AmountAcceptedArrayBuffer = Buffer.Buffer<Nat64>(1);

                            while(index < numberOfProfiles){
                                let userProfile = profilesArray[index];
                                Cycles.add(100_000_000_000);
                                let amountAccepted = await userProfile.1.journal.wallet_receive();
                                AmountAcceptedArrayBuffer.add(amountAccepted.accepted);

                                index += 1;
                            };

                            #ok(Cycles.balance(), AmountAcceptedArrayBuffer.toArray());

                        } else {
                            #err(#NotAuthorized);
                        }
                    };
                };
            };
        };
    };

    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };
}