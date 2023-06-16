import Trie "mo:base/Trie";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../Ledger/Account";
import JournalTypes "../Journal/journal.types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "../Main/types";
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
import Manager "../Manager/Manager";
import AssetCanister "../AssetCanister/AssetCanister";
import HashMap "mo:base/HashMap";
import AssetManagementFunctions "../AssetCanister/AssetManagementFunctions";
import WasmStore "../Manager/WasmStore";
import Hex "../Ledger/Hex";
import NftCollection "../NftCollection/NftCollection";
import Nat32 "mo:base/Nat32";
import Support "../SupportCanisterIds/SupportCanisterIds";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Int "mo:base/Int";

module{

    private let ic : IC.Self = actor "aaaaa-aa";

    private let nftCollection : NftCollection.Interface = actor(NftCollection.CANISTER_ID);

    private let nanosecondsInADay: Float = 86400000000000;

    private let nanosecondsInAMinute: Float = 60000000000;

    public func authorizePrinicpalToViewAssets(principal: Principal, frontendCanisterPrincipal: Principal) : async () {
        let assetCanister : AssetCanister.Interface = actor(Principal.toText(frontendCanisterPrincipal));
        let result = await assetCanister.authorize(principal);
    };

    public func getPrincipalsList( callerId : Principal, profilesMap : MainTypes.UserProfilesMap, canisterData: MainTypes.CanisterData): 
    async [Principal] {

        let callerIdAsText = Principal.toText(callerId);
            
        if (callerIdAsText == canisterData.nftOwner) {

            var index = 0;
            let numberOfProfiles = profilesMap.size();
            let profilesIter = profilesMap.entries();
            let profilesArray = Iter.toArray(profilesIter);
            let ArrayBuffer = Buffer.Buffer<(Principal)>(1);

            while(index < numberOfProfiles){
                let userProfile = profilesArray[index];
                let userPrincipal = userProfile.0;
                ArrayBuffer.add(userPrincipal);
                index += 1;
            };

            return ArrayBuffer.toArray();

        } else { throw Error.reject("Unauthorized access. Caller is not the owner."); }
        
    };

    public func updateOwner(ownerPrincipal: Principal, canisterData: MainTypes.CanisterData) : MainTypes.CanisterData {
        let callerIdAsText = Principal.toText(ownerPrincipal);
        let newCanisterData = {
            managerCanisterPrincipal = canisterData.managerCanisterPrincipal;
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = callerIdAsText;
            acceptingRequests = canisterData.acceptingRequests;
            nftId = canisterData.nftId;
            lastRecordedTime = canisterData.lastRecordedTime;
            cyclesSaveMode = canisterData.cyclesSaveMode;
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
            } else { ArrayBuffer.add((thisPrincipalAsText, approved)); };
            index += 1;
        };
        if(requestPresent == false){ ArrayBuffer.add((principalAsText, true)); };
        return #ok(ArrayBuffer.toArray());
    };

    public func updateApprovalStatus( principal: Principal, profilesMap: MainTypes.UserProfilesMap, newApprovalStatuse: Bool) : 
    async Result.Result<(), JournalTypes.Error>{

        let userProfile = profilesMap.get(principal);
        switch(userProfile){
            case null{ return #err(#NotFound); };
            case(?profile){
                let updatedProfile : MainTypes.UserProfile = {
                    canisterId = profile.canisterId;
                    email = profile.email;
                    userName = profile.userName;
                    userPrincipal = profile.userPrincipal;
                    accountId = profile.accountId;
                    approved = ?newApprovalStatuse;
                    treasuryMember = profile.treasuryMember;
                    treasuryContribution = profile.treasuryContribution;
                    monthsSpentAsTreasuryMember = profile.monthsSpentAsTreasuryMember;
                };
                profilesMap.put(principal, updatedProfile);
                return #ok();
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
            if(thisPrincipalAsText != principalAsText){ ArrayBuffer.add((principalAsText, approved)); };
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

        Cycles.add(1_000_000_000_000);
        let managerCanister = await Manager.Manager(Principal.fromText(backEndPrincipal));
        let amountAccepted = await managerCanister.wallet_receive();
        await managerCanister.initializeReleaseVersion();
        await managerCanister.loadNextRelease();
        let managerCanisterPrincipal = Principal.fromActor(managerCanister);

        let updatedDefaultControllers_0 = addDefualtController([] , Principal.fromText(backEndPrincipal));
        let updatedDefaultControllers_1 = addDefualtController(updatedDefaultControllers_0 ,managerCanisterPrincipal);

        let updatedCanisterData = {
            managerCanisterPrincipal = Principal.toText(managerCanisterPrincipal);
            frontEndPrincipal = frontEndPrincipal;
            backEndPrincipal = backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            acceptingRequests = canisterData.acceptingRequests;
            nftId = nftId;
            lastRecordedTime = canisterData.lastRecordedTime;
            cyclesSaveMode = canisterData.cyclesSaveMode;
        };

        return (updatedCanisterData,updatedDefaultControllers_1);
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
        profilesMap : MainTypes.UserProfilesMap
    ) : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {

        let profile = profilesMap.get(callerId);

        switch(profile){
            case null{ return #err(#NotAuthorized); };
            case ( ? existingProfile){
                let managerCanister : Manager.Manager = actor(canisterData.managerCanisterPrincipal);
                let profilesApprovalStatus = getProfilesMetaData(profilesMap);
                let frontendPrincipal = Principal.fromText(canisterData.frontEndPrincipal);
                let managerPrincipal = Principal.fromText(canisterData.managerCanisterPrincipal);
                let cyclesBalance_frontend = await getCyclesBalance(frontendPrincipal);
                let currentCyclesBalance_manager = await getCyclesBalance(managerPrincipal);
                let isOwner = Principal.toText(callerId) == canisterData.nftOwner;
                let currentVersion = await managerCanister.getCurrentReleaseVersion();

                let canisterDataPackagedForExport = {
                    journalCount = profilesMap.size();
                    managerCanisterPrincipal = canisterData.managerCanisterPrincipal;
                    frontEndPrincipal = canisterData.frontEndPrincipal;
                    backEndPrincipal = canisterData.backEndPrincipal;
                    lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
                    currentCyclesBalance_frontend = cyclesBalance_frontend;
                    currentCyclesBalance_backend = cyclesBalance_backend;
                    currentCyclesBalance_manager = currentCyclesBalance_manager;
                    backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
                    nftOwner = canisterData.nftOwner;
                    acceptingRequests = canisterData.acceptingRequests;
                    nftId = canisterData.nftId;
                    lastRecordedTime = canisterData.lastRecordedTime;
                    profilesMetaData = profilesApprovalStatus;
                    isOwner = isOwner;
                    supportMode = supportMode;
                    cyclesSaveMode = canisterData.cyclesSaveMode;
                    releaseVersion = currentVersion;
                };
                return #ok(canisterDataPackagedForExport);
            }
        }
    };

    private func refillCanisterCycles(canisterData: MainTypes.CanisterData, profilesMap : MainTypes.UserProfilesMap) : async () {
        let numberOfProfiles = profilesMap.size();
        let profilesIter = profilesMap.entries();
        let profilesArray = Iter.toArray(profilesIter);
        var index = 0;
        let frontendCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(canisterData.frontEndPrincipal) });
        let managerCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(canisterData.managerCanisterPrincipal)});
        if(frontendCanisterStatus.cycles < 2_000_000_000_000){
            await ic.provisional_top_up_canister({ 
                canister_id = Principal.fromText(canisterData.frontEndPrincipal);
                amount = 1_000_000_000_000
            });
        };
        if(managerCanisterStatus.cycles < 2_000_000_000_000) {
            await ic.provisional_top_up_canister({ 
                canister_id = Principal.fromText(canisterData.managerCanisterPrincipal);
                amount = 1_000_000_000_000
            });
        };
        while(index < numberOfProfiles){
            let (principal, profile) = profilesArray[index];
            let approved = Option.get(profile.approved, false);
            if(approved){
                Cycles.add(100_000_000_000);
                let userCanister : Journal.Journal = actor(Principal.toText(profile.canisterId));
                let amountAccepted = ignore userCanister.wallet_receive();
            };
            index += 1;
        };
    };

    public func heartBeat(currentCylcesBalance: Nat, canisterData : MainTypes.CanisterData, profilesMap: MainTypes.UserProfilesMap): 
    async MainTypes.CanisterData{

        let cyclesBurned : Float = Float.fromInt(canisterData.lastRecordedBackEndCyclesBalance - currentCylcesBalance);
        let timeLapsed : Float = Float.fromInt(Time.now() - canisterData.lastRecordedTime);
        let timeLapsedInDays : Float = timeLapsed / nanosecondsInADay;
        let dailyBurnRate : Nat = Int.abs(Float.toInt(cyclesBurned / timeLapsedInDays));
        if(timeLapsedInDays < 1){ return canisterData };
        ignore refillCanisterCycles(canisterData, profilesMap);
        let updatedCanisterData = {
            managerCanisterPrincipal = canisterData.managerCanisterPrincipal;
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = currentCylcesBalance;
            backEndCyclesBurnRatePerDay = dailyBurnRate;
            nftOwner = canisterData.nftOwner;
            nftId = canisterData.nftId;
            acceptingRequests = canisterData.acceptingRequests;
            lastRecordedTime = Time.now();
            cyclesSaveMode = canisterData.cyclesSaveMode;
        };
        return updatedCanisterData;
    };

    public func toggleAcceptRequest(callerId: Principal, canisterData: MainTypes.CanisterData) : 
    Result.Result<(MainTypes.CanisterData), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner){ return #err(#NotAuthorized);};
        let updatedCanisterData = {
            managerCanisterPrincipal = canisterData.managerCanisterPrincipal;
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            nftId = canisterData.nftId;
            lastRecordedTime = canisterData.lastRecordedTime;
            acceptingRequests = not canisterData.acceptingRequests;
            cyclesSaveMode = canisterData.cyclesSaveMode;
        };
        return #ok(updatedCanisterData);
    };

    public func toggleCyclesSaveMode(callerId: Principal, canisterData: MainTypes.CanisterData) : async MainTypes.CanisterData{
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != canisterData.nftOwner) { throw Error.reject("Unauthorized access. Caller is not the owner.") };
        let updatedCanisterData = {
            managerCanisterPrincipal = canisterData.managerCanisterPrincipal;
            frontEndPrincipal = canisterData.frontEndPrincipal;
            backEndPrincipal = canisterData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = canisterData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = canisterData.backEndCyclesBurnRatePerDay;
            nftOwner = canisterData.nftOwner;
            nftId = canisterData.nftId;
            lastRecordedTime = canisterData.lastRecordedTime;
            acceptingRequests = canisterData.acceptingRequests;
            cyclesSaveMode = not canisterData.cyclesSaveMode;
        };
        return updatedCanisterData;
    };

    public func installCode_managerCanister( canisterData: MainTypes.CanisterData ): async (){
        let {managerCanisterPrincipal; backEndPrincipal} = canisterData;
        let managerActor : Manager.Manager = actor(managerCanisterPrincipal);
        let wasmStoreCanister : WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let currentReleaseVersion = await managerActor.getCurrentReleaseVersion();
        let {wasmModule} = await wasmStoreCanister.getModule(currentReleaseVersion, WasmStore.wasmTypes.manager);
        let arg = Principal.fromText(backEndPrincipal);
        let managerPrincipal = Principal.fromText(managerCanisterPrincipal);
        await installCode_(arg, wasmModule, managerPrincipal);
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

    public func getProfilesMetaData(profilesMap: MainTypes.UserProfilesMap) : MainTypes.ProfilesMetaData {
        let profilesMapEntries = profilesMap.entries();
        let profilesMapEntriesArray = Iter.toArray(profilesMapEntries);
        let profilesApprovalStatus = Array.map<(Principal, MainTypes.UserProfile), MainTypes.ProfileMetaData>(
            profilesMapEntriesArray, 
            func (x: (Principal, MainTypes.UserProfile)) : MainTypes.ProfileMetaData {
                let (principal, {canisterId; approved}) = x;
                let isApproved = Option.get(approved, false);
                return {
                    approvalStatus = isApproved; 
                    userPrincipal = Principal.toText(principal); 
                    canisterId = Principal.toText(canisterId) 
                };
            }
        );
        return profilesApprovalStatus;
    };

    public func setToDefualtControllerSettings(canisterPrincipal: Principal, defaultControllers: [Principal]) : 
    async () {
        let canisterStatus = await ic.canister_status({canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let updatedSettings : IC.canister_settings = {
            controllers = ?defaultControllers;
            freezing_threshold = ?settings.freezing_threshold;
            memory_allocation = ?settings.memory_allocation;
            compute_allocation = ?settings.compute_allocation;
        };
        let result = await ic.update_settings({
            canister_id = canisterPrincipal;
            settings = updatedSettings;
        });
    };

    public func addController(principal: Text, canisterPrincipal: Principal, defaultControllers: [Principal]) : 
    async () {
        
        let canisterStatus = await ic.canister_status({canister_id = canisterPrincipal });
        let settings = canisterStatus.settings;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, defaultControllers);
        let principalAsBlob = Principal.fromText(principal);
        let ArrayBuffer = Buffer.Buffer<(Principal)>(1);
        let controllersIter = Iter.fromArray(controllers);
        ArrayBuffer.add(principalAsBlob);
        Iter.iterate<Principal>(controllersIter, func (x: Principal, index: Nat){
            ArrayBuffer.add(x);
        });
        controllers := ArrayBuffer.toArray();
        let updatedSettings : IC.canister_settings = {
            controllers = ?controllers;
            freezing_threshold = ?settings.freezing_threshold;
            memory_allocation = ?settings.memory_allocation;
            compute_allocation = ?settings.compute_allocation;
        };
        let result = await ic.update_settings({
            canister_id = canisterPrincipal;
            settings = updatedSettings;
        });
    };

    public func toggleSupportMode(
        caller: Principal, 
        canisterData: MainTypes.CanisterData, 
        supportMode: Bool, 
        defaultControllers: [Principal]
    ) : async Result.Result<(Bool),JournalTypes.Error>{
        let callerIdAsText = Principal.toText(caller);
        if(callerIdAsText != canisterData.nftOwner){ return #err(#NotAuthorized) };
        if(supportMode == false){
            let result1 = await addController(
                Support.TechSupportPrincipal1, 
                Principal.fromText(canisterData.backEndPrincipal), 
                defaultControllers
            );
            let result2 = await addController(
                Support.TechSupportPrincipal2, 
                Principal.fromText(canisterData.backEndPrincipal), 
                defaultControllers
            );
            let result3 = await addController(
                Support.TechSupportPrincipal1, 
                Principal.fromText(canisterData.managerCanisterPrincipal),
                defaultControllers
            );
            let result4 = await addController(
                Support.TechSupportPrincipal2, 
                Principal.fromText(canisterData.managerCanisterPrincipal),
                defaultControllers
            );
            let result5 = await addController(
                Support.TechSupportPrincipal1, 
                Principal.fromText(canisterData.frontEndPrincipal),
                defaultControllers
            );
            let result6 = await addController(
                Support.TechSupportPrincipal2, 
                Principal.fromText(canisterData.frontEndPrincipal),
                defaultControllers
            );
        } else {
            let result1 = await setToDefualtControllerSettings(
                Principal.fromText(canisterData.backEndPrincipal), 
                defaultControllers
            );
            let result2 = await setToDefualtControllerSettings(
                Principal.fromText(canisterData.managerCanisterPrincipal), 
                defaultControllers
            );
            let result3 = await setToDefualtControllerSettings(
                Principal.fromText(canisterData.frontEndPrincipal), 
                defaultControllers
            );
        };
        return #ok(not supportMode);
    };

    public func verifyOwnership( principal: Principal, canisterData: MainTypes.CanisterData ): async Bool {
        let accountIdBlob = Account.accountIdentifier(principal, Account.defaultSubaccount());
        let accountIdArray = Blob.toArray(accountIdBlob);
        let accountIdText = Hex.encode(accountIdArray);
        let tokens_ext_result = await nftCollection.tokens_ext(accountIdText);
        switch(tokens_ext_result){
            case(#ok(tokensOwned)){
                var index = 0;
                let tokensOwnedIter = Iter.fromArray(tokensOwned);
                let numberOfTokensOwned = Iter.size(tokensOwnedIter);
                while(index < numberOfTokensOwned){
                    let tokenData = tokensOwned[index];
                    let tokenIndex = tokenData.0;
                    var tokenIndexAsNat = Nat32.toNat(tokenIndex);
                    tokenIndexAsNat := tokenIndexAsNat + 1;
                    if(tokenIndexAsNat == canisterData.nftId){
                        return true;
                    };
                    index += 1;
                };
                return false;
            };
            case(#err(e)){
                return false;
            };
        };
            
    };

    public func registerOwner(isLocal: Bool, caller: Principal, canisterData: MainTypes.CanisterData, requestsForAccess: MainTypes.RequestsForAccess ): 
    async Result.Result<(MainTypes.CanisterData, MainTypes.RequestsForAccess), JournalTypes.Error> {
        var isOwner = false;
        if(isLocal == true){  isOwner := true;} 
        else { isOwner := await verifyOwnership(caller, canisterData); };
        if(isOwner == true){
            let canisterData_withOwner = updateOwner(caller, canisterData);
            let updatedRequestsForAccess = await grantAccess( caller, requestsForAccess );
            switch(updatedRequestsForAccess){
                case(#ok(requests)){ #ok((canisterData_withOwner, requests));};
                case(#err(e)){ return #err(e) };
            };
        } else { return #err(#NotAuthorized); };
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