import Trie "mo:base/Trie";
import Types "types";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Journal/journal.types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "types";
import Journal "../Journal/Journal";
import Ledger "../Ledger/Ledger";
import Blob "mo:base/Blob";


module{

    private let oneICP : Nat64 = 100_000_000;

    public func readJournal (callerId: Principal, profilesTree: MainTypes.ProfilesTree) : async Result.Result<({
    userJournalData : ([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio); email: ?Text; userName: ?Text;}), 
    JournalTypes.Error> {

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                return #err(#NotFound);
            };
            case(? v){
                let journal = v.journal; 
                let userJournalData = await journal.readJournal();
                
                return #ok({
                    userJournalData = userJournalData;
                    email = v.email;
                    userName = v.userName;
                });
                
            };
        };   

    };

    public func readWalletData(callerId: Principal, profilesTree: MainTypes.ProfilesTree) : 
    async Result.Result<({ balance : Ledger.ICP; address: [Nat8]; } ), JournalTypes.Error> {

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
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
                
                return #ok({
                    balance = userBalance;
                    address = Blob.toArray(userAccountId);
                });
                
            };
        };
    };

    public func readEntry(callerId: Principal, profilesTree: MainTypes.ProfilesTree, entryKey: JournalTypes.EntryKey) : async Result.Result<JournalTypes.JournalEntry, JournalTypes.Error> {
        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
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

    public func readEntryFileChunk(callerId: Principal, profilesTree: MainTypes.ProfilesTree, fileId: Text, chunkId: Nat) : async Result.Result<(Blob),JournalTypes.Error>{

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
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
        };

    };

    public func readEntryFileSize(callerId: Principal, profilesTree: MainTypes.ProfilesTree,fileId: Text) : 
    async Result.Result<(Nat),JournalTypes.Error>{

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
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
        };

    };

    public func updateBio(callerId: Principal, profilesTree: MainTypes.ProfilesTree, bio: JournalTypes.Bio) : 
    async Result.Result<(), JournalTypes.Error> {
        
        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
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

    public func updateJournalEntry(
        callerId: Principal, 
        profilesTree: MainTypes.ProfilesTree, 
        entryKey : ?JournalTypes.EntryKey, 
        entry : ?JournalTypes.JournalEntryInput
    ) : 
    async Result.Result<([(Nat,JournalTypes.JournalEntry)], JournalTypes.Bio), JournalTypes.Error> {
        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                #err(#NotAuthorized);
            };
            case(?result){
                let journal = result.journal;
                switch(entry){
                    case null{
                        switch(entryKey){
                            case null{
                                #err(#NoInputGiven);
                            };
                            case(? entryKeyValue){
                                let journalStatus = await journal.deleteJournalEntry(entryKeyValue.entryKey);
                                return journalStatus;
                            };
                        };
                    };
                    case(? entryValue){
                        switch(entryKey){
                            case null {
                                let status = await journal.createEntry(entryValue);
                                return status;
                            };
                            case (? entryKeyValue){
                                let entryStatus = await journal.updateJournalEntry(entryKeyValue.entryKey, entryValue);
                                return entryStatus;
                            };
                        };
                    };
                }
            };
        };
    };

    public func submitFiles(callerId: Principal, profilesTree: MainTypes.ProfilesTree) : 
    async Result.Result<(), JournalTypes.Error> {

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                return #err(#NotFound)
            };
            case (? v){
                let journal = v.journal;
                let result = await journal.submitFiles();
                return result;
            };
        };
    };

    public func clearUnsubmittedFiles(callerId: Principal, profilesTree: MainTypes.ProfilesTree): 
    async Result.Result<(), JournalTypes.Error>{

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                return #err(#NotFound)
            };
            case (? v){
                let journal = v.journal;
                let result = journal.clearUnsubmittedFiles();
                #ok(());
            };
        };
    };

    public func uploadJournalEntryFile(callerId: Principal, profilesTree: MainTypes.ProfilesTree,fileId: Text, chunkId: Nat, blobChunk: Blob): 
    async Result.Result<(Text), JournalTypes.Error>{

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let result = Trie.find(
            profilesTree,
            key(callerId),
            Principal.equal
        );

        switch(result){
            case null{
                return #err(#NotFound)
            };
            case (? v){
                let journal = v.journal;
                let status = await journal.uploadFileChunk(fileId: Text, chunkId, blobChunk);
                return status;
            };
        };
        
    };

    public func getEntriesToBeSent(callerId: Principal, profilesTree: MainTypes.ProfilesTree) : 
    async Result.Result<[(Text,[(Nat, JournalTypes.JournalEntry)])], JournalTypes.Error>{

        if(Principal.toText(callerId) == "2vxsx-fae"){
           return #err(#NotAuthorized);
        };

        let callerProfile = Trie.find(
            profilesTree,
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
                            let numberOfProfiles = Trie.size(profilesTree);
                            let profilesIter = Trie.iter(profilesTree);
                            let profilesArray = Iter.toArray(profilesIter);
                            let AllEntriesToBeSentBuffer = Buffer.Buffer<(Text, [(Nat, JournalTypes.JournalEntry)])>(1);

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




    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

}