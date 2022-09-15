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
import Ledger "../Ledger/Ledger";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Hash "mo:base/Hash";
import Option "mo:base/Option";
import Error "mo:base/Error";
import IC "../IC/ic.types";


module{

    private let ic : IC.Self = actor "aaaaa-aa";

    public func getPrincipalsList(callerId : Principal, profiles : MainTypes.ProfilesTree) : async [Principal] {

        let profile = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(profile){
            case null{
                throw Error.reject("Unauthorized access. Caller is not an admin.");
            };
            case ( ? existingProfile){

                if (Option.get(existingProfile.userName, "null") == "admin") {

                    var index = 0;
                    let numberOfProfiles = Trie.size(profiles);
                    let profilesIter = Trie.iter(profiles);
                    let profilesArray = Iter.toArray(profilesIter);
                    let ArrayBuffer = Buffer.Buffer<(Principal)>(1);

                    while(index < numberOfProfiles){
                        let userProfile = profilesArray[index];
                        let userPrincipal = userProfile.0;
                        ArrayBuffer.add(userPrincipal);
                        index += 1;
                    };

                    return ArrayBuffer.toArray();

                } else {
                    throw Error.reject("Unauthorized access. Caller is not an admin.");

                }

            };
        };
    };

    public func addApprovedUser(callerId : Principal, principal: Text, canisterData : MainTypes.CanisterData) : async MainTypes.CanisterData {
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            throw Error.reject("Unauthorized access.");
        };

        let approvedUsersTrie = canisterData.approvedUsers;
        let permissions : MainTypes.UserPermissions = {
            approved = true;
        };
        let (newApprovedUsersTrie, oldValueForThisKey) = Trie.put(
            approvedUsersTrie,
            textKey(principal),
            Text.equal,
            permissions
        );

        let updatedCanisterData = {
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            approvedUsers = newApprovedUsersTrie;
        };

        return updatedCanisterData;
    };

    public func removeApprovedUser(callerId: Principal, principal: Text, canisterData : MainTypes.CanisterData) : async MainTypes.CanisterData {
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            throw Error.reject("Unauthorized access.");
        };

        let approvedUsersTrie = canisterData.approvedUsers;

        let (newApprovedUsersTrie, oldValueForThisKey) = Trie.remove(
            approvedUsersTrie,
            textKey(principal),
            Text.equal
        );

        let updatedCanisterData = {
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            approvedUsers = newApprovedUsersTrie;
        };

        return updatedCanisterData;
    };

    public func setPrincipalIds( callerId: Principal, backEndPrincipal : Text, frontEndPrincipal : Text,  canisterData : MainTypes.CanisterData) 
    : async MainTypes.CanisterData {

        let callerIdAsText = Principal.toText(callerId);

        if(callerIdAsText != canisterData.nftOwner){
            throw Error.reject("Unauthorized access");
        };

        let updatedCanisterData = {
            frontEndPrincipal = frontEndPrincipal;
            backEndPrincipal = backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            approvedUsers = canisterData.approvedUsers;
        };

        return updatedCanisterData;
    };

    public func getCanisterData(callerId: Principal, canisterData: MainTypes.CanisterData) : async MainTypes.CanisterDataExport {
        let callerIdAsText = Principal.toText(callerId);

        if(callerIdAsText != canisterData.nftOwner){
            throw Error.reject("Unauthorized access");
        };

        let approvedUsersList = canisterData.approvedUsers;
        let approvedUsersListAsIter = Trie.iter(approvedUsersList);
        let approvedUsersListAsArray = Iter.toArray(approvedUsersListAsIter);

        let canisterDataPackagedForExport = {
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            approvedUsers = approvedUsersListAsArray;
        };

        return canisterDataPackagedForExport;
    };

    public func setCyclesBurnRate(currentCylcesBalance: Nat, canisterData : MainTypes.CanisterData) : async MainTypes.CanisterData{
        let cyclesBurned = currentCylcesBalance - canisterData.lastRecordedBackEndCyclesBalance;

        let updatedCanisterData = {
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = cyclesBurned;
            nftOwner = canisterData.nftOwner;
            approvedUsers = canisterData.approvedUsers;
        };
        return updatedCanisterData;
    };

    public func setLastRecordedBackEndCyclesBalance(currentCylcesBalance: Nat, canisterData : MainTypes.CanisterData) : 
    async MainTypes.CanisterData{

        let updatedCanisterData = {
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = currentCylcesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            approvedUsers = canisterData.approvedUsers;
        };

        return updatedCanisterData;
    };

    public func installCode( 
        callerId : Principal, 
        userPrincipal: Principal, 
        args: Blob, 
        wasmModule: Blob, 
        profiles : MainTypes.ProfilesTree
        ): async() {

        let profile = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(profile){
            case null{
                throw Error.reject("Unauthorized access. Caller is not an admin.");
            };
            case ( ? existingProfile){

                if (Option.get(existingProfile.userName, "null") == "admin") {

                    let theUserProfile = Trie.find(
                        profiles,
                        key(userPrincipal),
                        Principal.equal
                    );

                    switch(theUserProfile){
                        case null{
                            throw Error.reject("No profile for this principal.");
                        };
                        case ( ? existingProfile){
                            let userJournal = existingProfile.journal;
                            let journalCanisterId = Principal.fromActor(userJournal);
                            await ic.stop_canister({canister_id = journalCanisterId});
                            await ic.install_code({
                                arg = args;
                                wasm_module = wasmModule;
                                mode = #upgrade;
                                canister_id = journalCanisterId;
                            });
                            await ic.start_canister({canister_id = journalCanisterId});

                        };
                    };

                } else {
                    throw Error.reject("Unauthorized access. Caller is not an admin.");

                }

            };

        };
    };



    private  func key(x: Principal) : Trie.Key<Principal> {
        return {key = x; hash = Principal.hash(x)};
    };

    private func natKey(x: Nat) : Trie.Key<Nat> {
        return {key = x; hash = Hash.hash(x)}
    };

    private func textKey(x: Text) : Trie.Key<Text> {
        return {key = x; hash = Text.hash(x)}
    };

}