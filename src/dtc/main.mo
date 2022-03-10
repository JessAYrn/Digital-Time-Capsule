import Ledger "canister:ledger";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Trie "mo:base/Trie";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal"; 
import Time "mo:base/Time";
import Journal "Journal";
import Cycles "mo:base/ExperimentalCycles";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Account "./Account";
import Bool "mo:base/Bool";

shared (msg) actor class User(){

    let callerId = msg.caller;

    type Profile = {
        journal : Journal.Journal;
        email: ?Text;
        userName: ?Text;
        id: Principal;
    };

    type ProfileInput = {
        userName: ?Text;
        email: ?Text;
    };

    type AmountAccepted = {
        accepted: Nat64
    };

    type EntryKey = {
        entryKey: Nat;
    };

    type JournalFile = {
        file1: ?Blob;
        file2: ?Blob;
    };

    type JournalEntry = {
        entryTitle: Text;
        text: Text;
        location: Text;
        date: Text;
        lockTime: Int;
        unlockTime: Int;
        sent: Bool;
        emailOne: Text;
        emailTwo: Text;
        emailThree: Text;
        file1ID: Text;
        file2ID: Text;
    };

    type JournalEntryInput = {
        entryTitle: Text;
        text: Text;
        location: Text;
        date: Text;
        lockTime: Int;
        emailOne: Text;
        emailTwo: Text;
        emailThree: Text;
        file1ID: Text;
        file2ID: Text;
    };

    type Bio = {
        name : Text;
        dob: Text;
        pob: Text;
        dedications: Text;
        preface: Text;
    };

    // This "Error" type is known as a varient. The attributes of varients are tagged with the hashtag and there is no need to specify the data type of the attribute because varients only attributes of a specific data type. 
    type Error ={
        #NotFound;
        #AlreadyExists;
        #NotAuthorized;
        #NoInputGiven;
        #InsufficientFunds;
        #TxFailed;
        #UserNameTaken;
    };

    //Application State
    //stable makes it so that the variable persists across updates to the canister
    //var refers to the data being a variable
    //profiles is the name of the variable
    //Trie.Trie is the data type. a Trie is a key/value map where Nat is the key and Profile is the data type
    // and it has been initialized as empty. hence the Trie.empty()

    private stable var profiles : Trie.Trie<Principal, Profile> = Trie.empty();

    private var Gas: Nat64 = 10000;
    
    private var Fee : Nat64 = 10000000 + Gas;

    private func isUserNameAvailable(userName: ?Text, callerId: Principal) : Bool {
        switch(userName){
            case null{
                true
            };
            case (? userNameValue){
                var index = 0;
                let numberOfProfiles = Trie.size(profiles);
                let profilesIter = Trie.iter(profiles);
                let profilesArray = Iter.toArray(profilesIter);
                let ArrayBuffer = Buffer.Buffer<(Principal,Profile)>(1);

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

    private func getAdminAccountId () : async Result.Result<Account.AccountIdentifier, Error> {
        var index = 0;
        let numberOfProfiles = Trie.size(profiles);
        let profilesIter = Trie.iter(profiles);
        let profilesArray = Iter.toArray(profilesIter);
        let AdminArrayBuffer = Buffer.Buffer<Blob>(1);

        while(index < numberOfProfiles){
            let userProfile = profilesArray[index];
            switch(userProfile.1.userName){
                case null{
                    index += 1;
                };
                case (? username){
                    if(username == "admin"){
                        let userJournal = userProfile.1.journal;
                        let userAccountId = await userJournal.canisterAccount();
                        AdminArrayBuffer.add(userAccountId);
                    };
                    index += 1;
                };
            };
        };

        
        if(AdminArrayBuffer.size() == 1){
            let AdminArray = AdminArrayBuffer.toArray();
            #ok(AdminArray[0]);
        } else {
            #err(#NotAuthorized);
        }

    };

    //Result.Result returns a varient type that has attributes from success case(the first input) and from your error case (your second input). both inputs must be varient types. () is a unit type.
    public shared(msg) func create () : async Result.Result<AmountAccepted,Error> {

        let callerId = msg.caller;

        //Reject Anonymous User
        //if(Principal.toText(msg.caller) == "2vxsx-fae"){
        //    return #err(#NotAuthorized);
        //};

        let existing = Trie.find(
            profiles,       //Target Trie
            key(callerId), //Key
            Principal.equal
        );

        // If there is an original value, do not update
        switch(existing) {
            case null {
                Cycles.add(100_000_000_000);
                let newUserJournal = await Journal.Journal(callerId);
                let amountAccepted = await newUserJournal.wallet_receive();

                let userProfile: Profile = {
                    journal = newUserJournal;
                    email = null;
                    userName = null;
                    id = callerId;
                };

                let (newProfiles, existingProfiles) = Trie.put(
                    profiles, 
                    key(callerId),
                    Principal.equal,
                    userProfile
                );

                profiles := newProfiles;
                //No need to write return when attribute of a varient is being returned
                return #ok(amountAccepted);
            };
            case ( ? v) {
                //No need to write return when attribute of a varient is being returned
                return #err(#AlreadyExists);
            }
        };
    };

    //read Journal
    public shared(msg) func readJournal () : async Result.Result<(
            {
                userJournalData : ([(Nat,JournalEntry)], Bio);
                email: ?Text;
                balance : Ledger.Tokens;
                address: [Nat8];
                userName: ?Text;
            }
        ), Error> {

        //Reject Anonymous User
        //if(Principal.toText(msg.caller) == "2vxsx-fae"){
        //    return #err(#NotAuthorized);
        //};

        let callerId = msg.caller;

        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                return #err(#NotFound);
            };
            case(? v){
                let journal = v.journal; 
                let userBalance = await journal.canisterBalance();
                let userAccountId = await journal.canisterAccount();
                let userJournalData = await journal.readJournal();
                
                return #ok({
                    userJournalData = userJournalData;
                    email = v.email;
                    balance = userBalance;
                    address = Blob.toArray(userAccountId);
                    userName = v.userName;
                });
                
            };
        };

        // need to replace Journal with Journal(callerId)
        
    };

    public shared(msg) func readEntry(entryKey: EntryKey) : async Result.Result<JournalEntry, Error> {

        //Reject Anonymous User
        //if(Principal.toText(msg.caller) == "2vxsx-fae"){
        //    return #err(#NotAuthorized);
        //};

        let callerId = msg.caller;

        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );
        switch(result){
            case null{
                #err(#NotAuthorized)
            };
            case(? v){
                let journal = v.journal;
                let entry = await journal.readJournalEntry(entryKey.entryKey);
                return entry;
            };
        };

    };

    public shared(msg) func readEntryFileChunk(fileId: Text, chunkId: Nat) : async Result.Result<(Blob),Error>{
        let callerId = msg.caller;

        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                #err(#NotFound);
            };
            case ( ? existingProfile){
                let userJournal = existingProfile.journal;
                let entryFile = await userJournal.readJournalFileChunk(fileId, chunkId);
                entryFile;
            };
        }
    };

    public shared(msg) func readEntryFileSize(fileId: Text) : async Result.Result<(Nat),Error>{
        let callerId = msg.caller;

        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                #err(#NotFound);
            };
            case ( ? existingProfile){
                let userJournal = existingProfile.journal;
                let entryFileSize = await userJournal.readJournalFileSize(fileId);
                entryFileSize;
            };
        }
    };

    public shared(msg) func updateBio(bio: Bio) : async Result.Result<(), Error> {
        let callerId = msg.caller;
        
        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                #err(#NotAuthorized);
            };
            case (? existingJournal){
                let journal = existingJournal.journal;
                let status = await journal.updateBio(bio);
                return status;
            };
        };
    };

    public shared(msg) func updateJournalEntry(entryKey : ?EntryKey, entry : ?JournalEntryInput) : async Result.Result<Trie.Trie<Nat,JournalEntry>, Error> {

        //Reject Anonymous User
        //if(Principal.toText(msg.caller) == "2vxsx-fae"){
        //    return #err(#NotAuthorized);
        //};

        let callerId = msg.caller;
        
        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                #err(#NotAuthorized);
            };
            case(?result){
                switch(entryKey){
                    case null{
                        switch(entry){
                            case null{
                                #err(#NoInputGiven)
                            };
                            case(?entryValue){
                                let journal = result.journal;
                                let status = await journal.createEntry(entryValue);
                                return status;
                            };
                        };
                    };
                    case (? entryKeyValue){
                        switch(entry){
                            case null {
                                let journal = result.journal;
                                let journalStatus = await journal.deleteJournalEntry(entryKeyValue.entryKey);
                                return journalStatus;
                            };
                            case (?entryValue){
                                let journal = result.journal;
                                let entryStatus = await journal.updateJournalEntry(entryKeyValue.entryKey, entryValue);

                                return entryStatus;
                            };
                        };
                    };
                };
            };
        };

     
    };

    public shared(msg) func createJournalEntryFile(fileId: Text, chunkId: Nat, blobChunk: Blob): async Result.Result<(), Error>{
        let callerId = msg.caller;

        let result = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                return #err(#NotFound)
            };
            case (? v){
                let journal = v.journal;
                let status = await journal.createFile(fileId,chunkId, blobChunk);
                return status;
            };
        };
    };

    //update profile
    public shared(msg) func updateProfile(profile: ProfileInput) : async Result.Result<(),Error> {
        
        //Reject Anonymous User
        //if(Principal.toText(msg.caller) == "2vxsx-fae"){
        //    return #err(#NotAuthorized)
        //};

        let callerId = msg.caller;

        let result = Trie.find(
            profiles,       //Target Trie
            key(callerId), //Key
            Principal.equal       //Equality Checker
        );

        switch (result){
            //Preventing updates to profiles that haven't been created yet
            case null {
                #err(#NotFound);
            };
            case(? v) {

                let userNameAvailable = isUserNameAvailable(profile.userName, callerId);
                if(userNameAvailable == true){
                    let userProfile : Profile = {
                        journal = v.journal;
                        email = profile.email;
                        userName = profile.userName;
                        id = callerId;
                    };

                    profiles := Trie.replace(
                        profiles,       //Target trie
                        key(callerId), //Key
                        Principal.equal,      //Equality Checker
                        ?userProfile        //The profile that you mean to use to overWrite the existing profile
                    ).0;                // The result is a tuple where the 0th entry is the resulting profiles trie
                    #ok(());
                } else {
                    #err(#UserNameTaken);
                }
            };
        };
    };

    //delete profile
    public shared(msg) func delete() : async Result.Result<(), Error> {
        
        let callerId = msg.caller;
        //Reject Anonymous User
        //if(Principal.toText(callerId) == "2vxsx-fae"){
        //    return #err(#NotAuthorized)
        //};

        let result = Trie.find(
            profiles,       //Target Trie
            key(callerId), //Key
            Principal.equal       //Equality Checker
        );

        switch (result){
            //Preventing updates to profiles that haven't been created yet
            case null {
                #err(#NotFound);
            };
            case(? v) {
                profiles := Trie.replace(
                    profiles,       //Target trie
                    key(callerId), //Key
                    Principal.equal,      //Equality Checker
                    null            //The profile that you mean to use to overWrite the existing profile
                ).0;                // The result is a tuple where the 0th entry is the resulting profiles trie
                #ok(());
            };
        };
    };

    public shared(msg) func getEntriesToBeSent() : async Result.Result<[(Text,[(Nat, JournalEntry)])], Error>{

        let callerId = msg.caller;
        
        let callerProfile = Trie.find(
            profiles,
            key(callerId), //Key
            Principal.equal 
        );

        switch(callerProfile){
            case null{
                #err(#NotFound)
            };
            case( ? profile){
                let callerUserName = profile.userName;
                switch(callerUserName){
                    case null {
                        #err(#NotFound)
                    };
                    case(? userName){
                        if(userName == "admin"){
                            var index = 0;
                            let numberOfProfiles = Trie.size(profiles);
                            let profilesIter = Trie.iter(profiles);
                            let profilesArray = Iter.toArray(profilesIter);
                            let AllEntriesToBeSentBuffer = Buffer.Buffer<(Text, [(Nat, JournalEntry)])>(1);

                            while(index < numberOfProfiles){
                                let userProfile = profilesArray[index];
                                switch(userProfile.1.email){
                                    case null{
                                        index += 1;
                                    };
                                    case (? email){
                                        let userEmail = email;
                                        let userJournal = userProfile.1.journal;
                                        let userEntriesToBeSent = await userJournal.getEntriesToBeSent();
                                        if(userEntriesToBeSent != []){
                                            AllEntriesToBeSentBuffer.add((userEmail, userEntriesToBeSent))
                                        };
                                        index += 1;
                                    };
                                };
                            };

                            return #ok(AllEntriesToBeSentBuffer.toArray());
                        } else {
                            #err(#NotAuthorized);
                        }
                    };

                };
            };
        };

    };

    func myAccountId() : Account.AccountIdentifier {
        Account.accountIdentifier(callerId, Account.defaultSubaccount())
    };

    public query func canisterAccount() : async Account.AccountIdentifier {
        myAccountId()
    };

    public func canisterBalance() : async Ledger.Tokens {
        await Ledger.account_balance({ account = myAccountId() })
    };

    public shared(msg) func transferICP(amount: Nat64, canisterAccountId: Account.AccountIdentifier) : async Result.Result<(), Error> {

        let callerId = msg.caller;
        let amountMinusFeeAndGas = amount - Fee - Gas;
        let feeMinusGas = Fee - Gas;

        let userProfile = Trie.find(
            profiles,
            key(callerId), //Key
            Principal.equal 
        );

        switch(userProfile) {
            case null{
                #err(#NotFound)
            }; 
            case (? profile){
                let userJournal = profile.journal;
                let userBalance = await userJournal.canisterBalance();
                if(userBalance.e8s >= amount){
                    let adminCanisterAccountIdVarient = await getAdminAccountId();
                    let adminCanisterAccountId = Result.toOption(adminCanisterAccountIdVarient);
                    switch(adminCanisterAccountId){
                        case (? adminAccountId){
                        
                            let statusForFeeCollection = await userJournal.transferICP(feeMinusGas, adminAccountId);
                            let statusForIcpTransfer = await userJournal.transferICP(amountMinusFeeAndGas, canisterAccountId);
                            if(statusForFeeCollection == true){
                               if(statusForIcpTransfer == true){
                                   #ok(());
                               } else {
                                    #err(#TxFailed)
                               }
                            } else {
                                #err(#TxFailed)
                            }
                        };
                        case null {
                            #err(#NotAuthorized);
                        };
                    };
                } else {
                    #err(#InsufficientFunds)
                }

            };
        };
    };

    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };
}