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

    public func getPrincipalsList( callerId : Principal, profilesMap : MainTypes.UserProfilesMap, canisterData: MainTypes.AppMetaData): 
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

    public func updateOwner(ownerPrincipal: Principal, metaData: MainTypes.AppMetaData) : MainTypes.AppMetaData {
        let callerIdAsText = Principal.toText(ownerPrincipal);
        let newCanisterData = {
            managerCanisterPrincipal = metaData.managerCanisterPrincipal;
            frontEndPrincipal = metaData.frontEndPrincipal;
            backEndPrincipal = metaData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = metaData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = metaData.backEndCyclesBurnRatePerDay;
            nftOwner = callerIdAsText;
            acceptingRequests = metaData.acceptingRequests;
            nftId = metaData.nftId;
            lastRecordedTime = metaData.lastRecordedTime;
            cyclesSaveMode = metaData.cyclesSaveMode;
            supportMode = metaData.supportMode;
            requestsForAccess = metaData.requestsForAccess;
            defaultControllers = metaData.defaultControllers;

        };
        return newCanisterData;

    };

    public func grantAccess( principal: Principal, appMetaData: MainTypes.AppMetaData) : 
    async Result.Result<(MainTypes.AppMetaData), JournalTypes.Error> {
        let {
            requestsForAccess; defaultControllers; supportMode; cyclesSaveMode;
            lastRecordedTime; acceptingRequests; nftId; nftOwner; backEndCyclesBurnRatePerDay;
            lastRecordedBackEndCyclesBalance; backEndPrincipal; frontEndPrincipal; managerCanisterPrincipal;
        } = appMetaData;

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
        let updatedAppMetaData: MainTypes.AppMetaData = {
            requestsForAccess = ArrayBuffer.toArray(); defaultControllers; supportMode;
            cyclesSaveMode; lastRecordedTime; acceptingRequests; nftId; nftOwner; backEndCyclesBurnRatePerDay;
            lastRecordedBackEndCyclesBalance; backEndPrincipal; frontEndPrincipal; managerCanisterPrincipal;
        }; 
        return #ok(updatedAppMetaData);
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

    public func requestApproval (caller: Principal, appMetaData:  MainTypes.AppMetaData) : 
    Result.Result<MainTypes.AppMetaData, JournalTypes.Error>{
        if(appMetaData.acceptingRequests == false){ return #err(#NotAcceptingRequests); };
        let{
            requestsForAccess; defaultControllers; supportMode; cyclesSaveMode;
            lastRecordedTime; acceptingRequests; nftId; nftOwner; backEndCyclesBurnRatePerDay;
            lastRecordedBackEndCyclesBalance; backEndPrincipal; frontEndPrincipal; managerCanisterPrincipal;
        } = appMetaData;
        let callerIdAsText = Principal.toText(caller);
        let ArrayBuffer = Buffer.Buffer<(Text, MainTypes.Approved)>(1);
        var inListAlready = false;
        let requestsForAccessIter = Iter.fromArray(requestsForAccess);
        Iter.iterate<(Text, MainTypes.Approved)>(requestsForAccessIter, func (x : (Text, MainTypes.Approved), index: Nat){
            let (principalAsText, approved) = x;
            if(principalAsText == callerIdAsText){ inListAlready := true };
            ArrayBuffer.add((principalAsText, approved));
        });
        if(inListAlready == false){ ArrayBuffer.add((callerIdAsText, false)); };
        let updatedAppMetaData : MainTypes.AppMetaData = {
            requestsForAccess = ArrayBuffer.toArray(); defaultControllers; supportMode;
            cyclesSaveMode; lastRecordedTime; acceptingRequests; nftId; nftOwner; backEndCyclesBurnRatePerDay;
            lastRecordedBackEndCyclesBalance; backEndPrincipal; frontEndPrincipal; managerCanisterPrincipal;
        };
        return #ok(updatedAppMetaData);
    };

    public func removeFromRequestsList( principal: Principal, appMetaData: MainTypes.AppMetaData) : 
    async MainTypes.AppMetaData {
        let {
            requestsForAccess; defaultControllers; supportMode; cyclesSaveMode;
            lastRecordedTime; acceptingRequests; nftId; nftOwner; backEndCyclesBurnRatePerDay;
            lastRecordedBackEndCyclesBalance; backEndPrincipal; frontEndPrincipal; managerCanisterPrincipal;
        } = appMetaData;
        let principalAsText = Principal.toText(principal);
        let requestsForAccessSize = Iter.size(Iter.fromArray(requestsForAccess));
        let ArrayBuffer = Buffer.Buffer<(Text, MainTypes.Approved)>(1);
        var index = 0;
        while(index < requestsForAccessSize){
            let (thisPrincipalAsText, approved) = requestsForAccess[index];
            if(thisPrincipalAsText != principalAsText){ ArrayBuffer.add((principalAsText, approved)); };
            index += 1;
        };
        let updatedAppMetaData : MainTypes.AppMetaData = {
            requestsForAccess = ArrayBuffer.toArray(); defaultControllers; supportMode;
            cyclesSaveMode; lastRecordedTime; acceptingRequests; nftId; nftOwner; backEndCyclesBurnRatePerDay;
            lastRecordedBackEndCyclesBalance; backEndPrincipal; frontEndPrincipal; managerCanisterPrincipal;
        };
        return updatedAppMetaData;
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

    public func configureApp( backEndPrincipal : Text, frontEndPrincipal : Text, nftId : Int,   metaData : MainTypes.AppMetaData) 
    : async (MainTypes.AppMetaData) {

        Cycles.add(1_000_000_000_000);
        let managerCanister = await Manager.Manager(Principal.fromText(backEndPrincipal));
        let amountAccepted = await managerCanister.wallet_receive();
        await managerCanister.initializeReleaseVersion();
        await managerCanister.loadNextRelease();
        let managerCanisterPrincipal = Principal.fromActor(managerCanister);

        let updatedDefaultControllers_0 = addDefualtController([] , Principal.fromText(backEndPrincipal));
        let updatedDefaultControllers_1 = addDefualtController(updatedDefaultControllers_0 ,managerCanisterPrincipal);

        let updatedMetaData = {
            managerCanisterPrincipal = Principal.toText(managerCanisterPrincipal);
            frontEndPrincipal = frontEndPrincipal;
            backEndPrincipal = backEndPrincipal;
            lastRecordedBackEndCyclesBalance = metaData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = metaData.backEndCyclesBurnRatePerDay;
            nftOwner = metaData.nftOwner;
            acceptingRequests = metaData.acceptingRequests;
            nftId = nftId;
            lastRecordedTime = metaData.lastRecordedTime;
            cyclesSaveMode = metaData.cyclesSaveMode;
            supportMode = metaData.supportMode;
            requestsForAccess = metaData.requestsForAccess;
            defaultControllers = updatedDefaultControllers_1;
        };

        return (updatedMetaData);
    };

    public func getCanisterCyclesBalances(backendCyclesBalance: Nat, canisterData: MainTypes.AppMetaData) 
    : async  MainTypes.CanisterCyclesBalances {

        let frontendCyclesBalance = await getCyclesBalance(Principal.fromText(canisterData.frontEndPrincipal));
        return {frontendCyclesBalance = frontendCyclesBalance; backendCyclesBalance = backendCyclesBalance}
    };

    public func getCanisterData(callerId: Principal, 
        appMetaData: MainTypes.AppMetaData, 
        cyclesBalance_backend: Nat, 
        profilesMap : MainTypes.UserProfilesMap
    ) : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {

        let profile = profilesMap.get(callerId);

        switch(profile){
            case null{ return #err(#NotAuthorized); };
            case ( ? existingProfile){
                let managerCanister : Manager.Manager = actor(appMetaData.managerCanisterPrincipal);
                let profilesApprovalStatus = getProfilesMetaData(profilesMap);
                let frontendPrincipal = Principal.fromText(appMetaData.frontEndPrincipal);
                let managerPrincipal = Principal.fromText(appMetaData.managerCanisterPrincipal);
                let cyclesBalance_frontend = await getCyclesBalance(frontendPrincipal);
                let currentCyclesBalance_manager = await getCyclesBalance(managerPrincipal);
                let isOwner = Principal.toText(callerId) == appMetaData.nftOwner;
                let currentVersion = await managerCanister.getCurrentReleaseVersion();

                let canisterDataPackagedForExport = {
                    journalCount = profilesMap.size();
                    managerCanisterPrincipal = appMetaData.managerCanisterPrincipal;
                    frontEndPrincipal = appMetaData.frontEndPrincipal;
                    backEndPrincipal = appMetaData.backEndPrincipal;
                    lastRecordedBackEndCyclesBalance = appMetaData.lastRecordedBackEndCyclesBalance;
                    currentCyclesBalance_frontend = cyclesBalance_frontend;
                    currentCyclesBalance_backend = cyclesBalance_backend;
                    currentCyclesBalance_manager = currentCyclesBalance_manager;
                    backEndCyclesBurnRatePerDay = appMetaData.backEndCyclesBurnRatePerDay;
                    nftOwner = appMetaData.nftOwner;
                    acceptingRequests = appMetaData.acceptingRequests;
                    nftId = appMetaData.nftId;
                    lastRecordedTime = appMetaData.lastRecordedTime;
                    profilesMetaData = profilesApprovalStatus;
                    isOwner = isOwner;
                    supportMode = appMetaData.supportMode;
                    cyclesSaveMode = appMetaData.cyclesSaveMode;
                    releaseVersion = currentVersion;
                };
                return #ok(canisterDataPackagedForExport);
            }
        }
    };

    private func refillCanisterCycles(appMetaData: MainTypes.AppMetaData, profilesMap : MainTypes.UserProfilesMap) : async () {
        let numberOfProfiles = profilesMap.size();
        let profilesIter = profilesMap.entries();
        let profilesArray = Iter.toArray(profilesIter);
        var index = 0;
        let frontendCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(appMetaData.frontEndPrincipal) });
        let managerCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(appMetaData.managerCanisterPrincipal)});
        if(frontendCanisterStatus.cycles < 2_000_000_000_000){
            Cycles.add(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(appMetaData.frontEndPrincipal); });
        };
        if(managerCanisterStatus.cycles < 2_000_000_000_000) {
            Cycles.add(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(appMetaData.managerCanisterPrincipal); });
        };
        while(index < numberOfProfiles){
            let (principal, {canisterId; approved; }) = profilesArray[index];
            let approved_ = Option.get(approved, false);
            let {cycles;} = await ic.canister_status({ canister_id = canisterId });
            if(approved_ and cycles < 1_000_000_000_000){
                Cycles.add(250_000_000_000);
                ignore ic.deposit_cycles({ canister_id = canisterId });
            };
            index += 1;
        };
    };

    public func heartBeat(currentCylcesBalance: Nat, appMetaData : MainTypes.AppMetaData, profilesMap: MainTypes.UserProfilesMap): 
    async MainTypes.AppMetaData{
        ignore refillCanisterCycles(appMetaData, profilesMap);
        let timeLapsed : Float = Float.fromInt(Time.now() - appMetaData.lastRecordedTime);
        let timeLapsedInDays : Float = timeLapsed / nanosecondsInADay;
        if(timeLapsedInDays < 1){ return appMetaData };
        let cyclesBurned : Float = Float.fromInt(appMetaData.lastRecordedBackEndCyclesBalance - currentCylcesBalance);
        let dailyBurnRate : Nat = Int.abs(Float.toInt(cyclesBurned / timeLapsedInDays));
        let updatedCanisterData = {
            managerCanisterPrincipal = appMetaData.managerCanisterPrincipal;
            frontEndPrincipal = appMetaData.frontEndPrincipal;
            backEndPrincipal = appMetaData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = currentCylcesBalance;
            backEndCyclesBurnRatePerDay = dailyBurnRate;
            nftOwner = appMetaData.nftOwner;
            nftId = appMetaData.nftId;
            acceptingRequests = appMetaData.acceptingRequests;
            lastRecordedTime = Time.now();
            cyclesSaveMode = appMetaData.cyclesSaveMode;
            supportMode = appMetaData.supportMode;
            requestsForAccess = appMetaData.requestsForAccess;
            defaultControllers = appMetaData.defaultControllers;
        };
        return updatedCanisterData;
    };

    public func toggleAcceptRequest(callerId: Principal, appMetaData: MainTypes.AppMetaData) : 
    Result.Result<(MainTypes.AppMetaData), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != appMetaData.nftOwner){ return #err(#NotAuthorized);};
        let updatedMetaData = {
            managerCanisterPrincipal = appMetaData.managerCanisterPrincipal;
            frontEndPrincipal = appMetaData.frontEndPrincipal;
            backEndPrincipal = appMetaData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = appMetaData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = appMetaData.backEndCyclesBurnRatePerDay;
            nftOwner = appMetaData.nftOwner;
            nftId = appMetaData.nftId;
            lastRecordedTime = appMetaData.lastRecordedTime;
            acceptingRequests = not appMetaData.acceptingRequests;
            cyclesSaveMode = appMetaData.cyclesSaveMode;
            supportMode = appMetaData.supportMode;
            requestsForAccess = appMetaData.requestsForAccess;
            defaultControllers = appMetaData.defaultControllers;
        };
        return #ok(updatedMetaData);
    };

    public func toggleCyclesSaveMode(callerId: Principal, appMetaData: MainTypes.AppMetaData) : async MainTypes.AppMetaData{
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != appMetaData.nftOwner) { throw Error.reject("Unauthorized access. Caller is not the owner.") };
        let updatedMetaData = {
            managerCanisterPrincipal = appMetaData.managerCanisterPrincipal;
            frontEndPrincipal = appMetaData.frontEndPrincipal;
            backEndPrincipal = appMetaData.backEndPrincipal;
            lastRecordedBackEndCyclesBalance = appMetaData.lastRecordedBackEndCyclesBalance;
            backEndCyclesBurnRatePerDay = appMetaData.backEndCyclesBurnRatePerDay;
            nftOwner = appMetaData.nftOwner;
            nftId = appMetaData.nftId;
            lastRecordedTime = appMetaData.lastRecordedTime;
            acceptingRequests = appMetaData.acceptingRequests;
            cyclesSaveMode = not appMetaData.cyclesSaveMode;
            supportMode = appMetaData.supportMode;
            requestsForAccess = appMetaData.requestsForAccess;
            defaultControllers = appMetaData.defaultControllers;
        };
        return updatedMetaData;
    };

    public func installCode_managerCanister( canisterData: MainTypes.AppMetaData ): async (){
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
        appMetaData: MainTypes.AppMetaData
    ) : async Result.Result<(MainTypes.AppMetaData),JournalTypes.Error>{
        let callerIdAsText = Principal.toText(caller);
        let { 
            supportMode; backEndPrincipal; managerCanisterPrincipal; frontEndPrincipal; nftOwner; 
            acceptingRequests; backEndCyclesBurnRatePerDay; cyclesSaveMode; defaultControllers;
            lastRecordedBackEndCyclesBalance; lastRecordedTime; nftId; requestsForAccess;
        } = appMetaData;
        if(callerIdAsText != nftOwner){ return #err(#NotAuthorized) };
        if(supportMode == false){
            let result1 = await addController(
                Support.TechSupportPrincipal1, 
                Principal.fromText(backEndPrincipal), 
                defaultControllers
            );
            let result2 = await addController(
                Support.TechSupportPrincipal2, 
                Principal.fromText(backEndPrincipal), 
                defaultControllers
            );
            let result3 = await addController(
                Support.TechSupportPrincipal1, 
                Principal.fromText(managerCanisterPrincipal),
                defaultControllers
            );
            let result4 = await addController(
                Support.TechSupportPrincipal2, 
                Principal.fromText(managerCanisterPrincipal),
                defaultControllers
            );
            let result5 = await addController(
                Support.TechSupportPrincipal1, 
                Principal.fromText(frontEndPrincipal),
                defaultControllers
            );
            let result6 = await addController(
                Support.TechSupportPrincipal2, 
                Principal.fromText(frontEndPrincipal),
                defaultControllers
            );
        } else {
            let result1 = await setToDefualtControllerSettings(
                Principal.fromText(backEndPrincipal), 
                defaultControllers
            );
            let result2 = await setToDefualtControllerSettings(
                Principal.fromText(managerCanisterPrincipal), 
                defaultControllers
            );
            let result3 = await setToDefualtControllerSettings(
                Principal.fromText(frontEndPrincipal), 
                defaultControllers
            );
        };
        let updatedAppMetaData: MainTypes.AppMetaData = { 
            supportMode = not supportMode; backEndPrincipal; managerCanisterPrincipal; frontEndPrincipal; nftOwner; 
            acceptingRequests; backEndCyclesBurnRatePerDay; cyclesSaveMode; defaultControllers;
            lastRecordedBackEndCyclesBalance; lastRecordedTime; nftId; requestsForAccess;
        };
        return #ok(updatedAppMetaData);
    };

    public func verifyOwnership( principal: Principal, appMetaData: MainTypes.AppMetaData ): async Bool {
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
                    if(tokenIndexAsNat == appMetaData.nftId){
                        return true;
                    };
                    index += 1;
                };
                return false;
            };
            case(#err(e)){ return false; };
        };  
    };

    public func registerOwner(caller: Principal, metaData: MainTypes.AppMetaData ): 
    async Result.Result<(MainTypes.AppMetaData), JournalTypes.Error> {
        let isOwner = await verifyOwnership(caller, metaData);
        if(not isOwner){ return #err(#NotAuthorized);};
        let metaData_withOwner = updateOwner(caller, metaData);
        let updatedAppMetaData = await grantAccess( caller, metaData_withOwner );
        switch(updatedAppMetaData){
            case(#ok(appMetaData)){ #ok((appMetaData))};
            case(#err(e)){ return #err(e) };
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