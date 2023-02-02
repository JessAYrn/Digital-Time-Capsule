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
import Text "mo:base/Text";
import Hash "mo:base/Hash";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Error "mo:base/Error";
import IC "../IC/ic.types";


module{

    private let ic : IC.Self = actor "aaaaa-aa";

    public func getPrincipalsList(
        callerId : Principal, 
        profiles : MainTypes.ProfilesTree, 
        canisterData: MainTypes.CanisterData
        ) : async [Principal] {

        let callerIdAsText = Principal.toText(callerId);
            
        if (callerIdAsText == canisterData.nftOwner) {

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
            throw Error.reject("Unauthorized access. Caller is not the owner.");

        }
        
    };

    public func updateOwner(ownerPrincipal: Principal, canisterData: MainTypes.CanisterData) : MainTypes.CanisterData {
        let callerIdAsText = Principal.toText(ownerPrincipal);
        let newCanisterData = {
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = callerIdAsText;
            acceptingRequests = canisterData.acceptingRequests;
            nftId = canisterData.nftId;
            lastRecordedTime = canisterData.lastRecordedTime;
        };
        return newCanisterData;

    };

    public func grantAccess( principal: Principal, requestsForAccess: MainTypes.RequestsForAccess) : 
    async Result.Result<(MainTypes.RequestsForAccess), JournalTypes.Error> {

        let principalAsText = Principal.toText(principal);
        let requestsForAccessSize = Iter.size(Iter.fromArray(requestsForAccess));
        let ArrayBuffer = Buffer.Buffer<(Text, MainTypes.Approved)>(1);
        var index = 0;
        var requestPresent = false;
        while(index < requestsForAccessSize){
            let (thisPrincipalAsText, approved) = requestsForAccess[index];
            if(thisPrincipalAsText == principalAsText){
                ArrayBuffer.add((thisPrincipalAsText, true));
                requestPresent := true;
            } else {
                ArrayBuffer.add((thisPrincipalAsText, approved));
            };
            index += 1;
        };
        if(requestPresent == false){
            ArrayBuffer.add((principalAsText, true));
        };
        return #ok(ArrayBuffer.toArray());
    };

    public func updateApprovalStatus( principal: Principal, profiles: MainTypes.ProfilesTree, newApprovalStatuse: Bool) : 
    async Result.Result<(MainTypes.ProfilesTree), JournalTypes.Error>{

        let userProfile = Trie.find(
            profiles,
            key(principal),
            Principal.equal
        );
        switch(userProfile){
            case null{
                return #err(#NotFound);
            };
            case(?profile){
                let updatedProfile : MainTypes.Profile = {
                    journal = profile.journal;
                    email = profile.email;
                    userName = profile.userName;
                    id = profile.id;
                    accountId = profile.accountId;
                    approved = ?newApprovalStatuse;
                    treasuryMember = profile.treasuryMember;
                    treasuryContribution = profile.treasuryContribution;
                    monthsSpentAsTreasuryMember = profile.monthsSpentAsTreasuryMember;
                };
                let (newTrie, oldValue) = Trie.put(
                    profiles,
                    key(principal),
                    Principal.equal,
                    updatedProfile
                );
                return #ok(newTrie);
            };
        };
    };

    public func removeFromRequestsList(
        principal: Principal, 
        requestsForAccess: MainTypes.RequestsForAccess
    ) : async MainTypes.RequestsForAccess {

        let principalAsText = Principal.toText(principal);
        let requestsForAccessSize = Iter.size(Iter.fromArray(requestsForAccess));
        let ArrayBuffer = Buffer.Buffer<(Text, MainTypes.Approved)>(1);
        var index = 0;
        while(index < requestsForAccessSize){
            let (thisPrincipalAsText, approved) = requestsForAccess[index];
            if(thisPrincipalAsText != principalAsText){
                ArrayBuffer.add((principalAsText, approved));
            };
            index += 1;
        };
        return ArrayBuffer.toArray();
    };

    private func addDefualtController(defaultControllers : [Principal], principal: Principal) : [Principal]{
        let arrayAsIter = Iter.fromArray(defaultControllers);
        let ArrayBuffer = Buffer.Buffer<(Principal)>(1);
        ArrayBuffer.add(principal);
        Iter.iterate<Principal>(arrayAsIter, func (x: Principal, index: Nat){
            ArrayBuffer.add(x);
        });
        let updatedDefualtControllersArray = ArrayBuffer.toArray();
        return updatedDefualtControllersArray;
    };

    public func configureApp( backEndPrincipal : Text, frontEndPrincipal : Text, nftId : Int,   canisterData : MainTypes.CanisterData) 
    : async (MainTypes.CanisterData,[Principal]) {

        let updatedDefaultControllers_0 = addDefualtController([] , Principal.fromText(backEndPrincipal));
        // let updatedDefaultControllers_1 = addDefualtController(updatedDefaultControllers_0 , Principal.fromText(upgradeCanisterId));

        let updatedCanisterData = {
            frontEndPrincipal = frontEndPrincipal;
            backEndPrincipal = backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            acceptingRequests = canisterData.acceptingRequests;
            nftId = nftId;
            lastRecordedTime = canisterData.lastRecordedTime;
        };

        return (updatedCanisterData,updatedDefaultControllers_0);
    };

    public func getCanisterCyclesBalances(backendCyclesBalance: Nat, canisterData: MainTypes.CanisterData) 
    : async  MainTypes.CanisterCyclesBalances {

        let frontendCyclesBalance = await getCyclesBalance(Principal.fromText(canisterData.frontEndPrincipal));
        return {frontendCyclesBalance = frontendCyclesBalance; backendCyclesBalance = backendCyclesBalance}
    };

    public func getCanisterData(callerId: Principal, 
        canisterData: MainTypes.CanisterData, 
        cyclesBalance_backend: Nat, 
        supportMode: Bool, 
        profiles : MainTypes.ProfilesTree
    ) : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {

        let profile = Trie.find(
            profiles,
            key(callerId),
            Principal.equal
        );

        switch(profile){
            case null{
                return #err(#NotAuthorized);
            };
            case ( ? existingProfile){

                let profilesApprovalStatus = getProfilesMetaData(profiles);
                let frontendPrincipal = Principal.fromText(canisterData.frontEndPrincipal);
                let cyclesBalance_frontend = await getCyclesBalance(frontendPrincipal);
                let isOwner = Principal.toText(callerId) == canisterData.nftOwner;
                let canisterDataPackagedForExport = {
                    journalCount = Trie.size(profiles);
                    frontEndPrincipal = canisterData.frontEndPrincipal;
                    backEndPrincipal = canisterData.backEndPrincipal;
                    lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
                    currentCyclesBalance_frontend = cyclesBalance_frontend;
                    currentCyclesBalance_backend = cyclesBalance_backend;
                    backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
                    nftOwner = canisterData.nftOwner;
                    acceptingRequests = canisterData.acceptingRequests;
                    nftId = canisterData.nftId;
                    lastRecordedTime = canisterData.lastRecordedTime;
                    profilesMetaData = profilesApprovalStatus;
                    isOwner = isOwner;
                    supportMode = supportMode
                };
                return #ok(canisterDataPackagedForExport);
            }
        }
    };

    public func setCyclesBurnRate(currentCylcesBalance: Nat, canisterData : MainTypes.CanisterData) : MainTypes.CanisterData{

        let cylesDecreased : Bool = Nat.less(currentCylcesBalance, canisterData.lastRecordedBackEndCyclesBalance);
        if(cylesDecreased == true){
            let cyclesBurned : Nat = canisterData.lastRecordedBackEndCyclesBalance - currentCylcesBalance;

            let updatedCanisterData = {
                frontEndPrincipal = canisterData.frontEndPrincipal;
                backEndPrincipal = canisterData.backEndPrincipal;
                lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
                backEndCyclesBurnRatePerDay = cyclesBurned;
                nftOwner = canisterData.nftOwner;
                nftId = canisterData.nftId;
                acceptingRequests = canisterData.acceptingRequests;
                lastRecordedTime = canisterData.lastRecordedTime;
            };
            return updatedCanisterData;
        } else {
            return canisterData
        };
    };

    public func setLastRecordedBackEndCyclesBalance(currentCylcesBalance: Nat, currentTime: Int, canisterData : MainTypes.CanisterData) : 
    MainTypes.CanisterData{

        let updatedCanisterData = {
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = currentCylcesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            nftId = canisterData.nftId;
            lastRecordedTime = currentTime;
            acceptingRequests = canisterData.acceptingRequests;
        };

        return updatedCanisterData;
    };

    public func toggleAcceptRequest(callerId: Principal, canisterData: MainTypes.CanisterData) : 
    Result.Result<(MainTypes.CanisterData), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){
            return #err(#NotAuthorized);
        } else {
            let updatedCanisterData = {
                frontEndPrincipal = canisterData.frontEndPrincipal;
                backEndPrincipal = canisterData.backEndPrincipal;
                lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
                backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
                nftOwner = canisterData.nftOwner;
                nftId = canisterData.nftId;
                lastRecordedTime = canisterData.lastRecordedTime;
                acceptingRequests = not canisterData.acceptingRequests;
            };

            return #ok(updatedCanisterData);
        };
    };

    public func installCode_journalCanisters( 
        callerId : Principal,  
        wasmModule: Blob, 
        profiles : MainTypes.ProfilesTree,
        canisterData : MainTypes.CanisterData
        ): async() {

        let callerIdAsText = Principal.toText(callerId);

        if (callerIdAsText == canisterData.nftOwner) {
            let profilesIter = Trie.iter(profiles);
            let profilesSize = Trie.size(profiles);
            let profilesArray = Iter.toArray(profilesIter);
            var index = 0;
            while(index < profilesSize){
                let (principal, profile ) = profilesArray[index];
                let userJournal = profile.journal;
                let journalCanisterId = Principal.fromActor(userJournal);
                let arg = principal;
                ignore installCode_(arg, wasmModule, journalCanisterId);
                index += 1;
            };
        } else {
            throw Error.reject("Unauthorized access. Caller is not the owner.");
        }
    };

    private func installCode_ (arg: Principal, wasmModule: Blob, canister_id: Principal) : async () {
        await ic.stop_canister({canister_id = canister_id});
        await ic.install_code({
            arg = to_candid(arg);
            wasm_module = wasmModule;
            mode = #upgrade;
            canister_id = canister_id;
        });
        await ic.start_canister({canister_id = canister_id});
    };

    private func getCyclesBalance(principal: Principal) : async Nat {
        let canisterStatus = await ic.canister_status({ canister_id = principal });
        let cyclesBalance = canisterStatus.cycles;
        return cyclesBalance;
    };

    public func getProfilesMetaData(profiles: MainTypes.ProfilesTree) : MainTypes.ProfilesApprovalStatuses {
        let profilesApprovalStatus = Trie.toArray<Principal, MainTypes.Profile, (Text, MainTypes.Approved)>(
            profiles,
            func (x: (Principal, MainTypes.Profile)) : (Text, MainTypes.Approved) {
                let (principal, profile) = x;
                let principalAsText = Principal.toText(principal);
                let isApproved = Option.get(profile.approved, false);
                return (principalAsText, isApproved);
            }
        );
        return profilesApprovalStatus;
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