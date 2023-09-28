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
import Treasury "../Treasury/Treasury";

module{

    private let ic : IC.Self = actor "aaaaa-aa";

    private let nftCollection : NftCollection.Interface = actor(NftCollection.CANISTER_ID);

    private let nanosecondsInADay: Float = 86400000000000;

    private let nanosecondsInAMinute: Float = 60000000000;

    public func authorizePrinicpalToViewAssets(principal: Principal, frontendCanisterPrincipal: Principal) : async () {
        let assetCanister : AssetCanister.Interface = actor(Principal.toText(frontendCanisterPrincipal));
        let result = await assetCanister.authorize(principal);
    };

    public func getPrincipalsList( callerId : Principal, profilesMap : MainTypes.UserProfilesMap, canisterData: MainTypes.DaoMetaData): 
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

    public func updateOwner(ownerPrincipal: Principal, metaData: MainTypes.DaoMetaData) : MainTypes.DaoMetaData {
        let callerIdAsText = Principal.toText(ownerPrincipal);
        let newCanisterData = { metaData with nftOwner = callerIdAsText;};
        return newCanisterData;

    };

    public func grantAccess( principals: [Text], daoMetaData: MainTypes.DaoMetaData) : 
    async Result.Result<(MainTypes.DaoMetaData), JournalTypes.Error> {
        let { requestsForAccess; } = daoMetaData;

        var index = 0;
        let principalsArraySize = principals.size();
        let requestsHashMap : HashMap.HashMap<Text, Bool> = HashMap.fromIter<Text, Bool>(
            Iter.fromArray(requestsForAccess), 
            Iter.size(Iter.fromArray(requestsForAccess)), 
            Text.equal,
            Text.hash
        );

        while(index < principalsArraySize){
            let principal = principals[index];
            requestsHashMap.put(principal, true);
            index += 1;
        };
        let newRequestsArray = Iter.toArray(requestsHashMap.entries());
        let updatedDaoMetaData: MainTypes.DaoMetaData = { daoMetaData with requestsForAccess = newRequestsArray; }; 
        return #ok(updatedDaoMetaData);
    };

    public func updateApprovalStatus( principals: [Text], profilesMap: MainTypes.UserProfilesMap, newApprovalStatuse: Bool) : (){

        var index = 0;
        while(index < principals.size()){
            let principal = Principal.fromText(principals[index]);
            let userProfile = profilesMap.get(principal);
            switch(userProfile){
                case null{};
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
                };
            };
            index += 1;
        };
    };

    public func requestApproval (caller: Principal, daoMetaData:  MainTypes.DaoMetaData) : 
    Result.Result<MainTypes.DaoMetaData, JournalTypes.Error>{
        if(daoMetaData.acceptingRequests == false){ return #err(#NotAcceptingRequests); };
        let{ requestsForAccess; } = daoMetaData;
        let callerIdAsText = Principal.toText(caller);

        let requestsHashMap : HashMap.HashMap<Text, Bool> = HashMap.fromIter<Text, Bool>(
            Iter.fromArray(requestsForAccess), 
            Iter.size(Iter.fromArray(requestsForAccess)), 
            Text.equal,
            Text.hash
        );

        requestsHashMap.put(callerIdAsText, false);
        let newRequestsArray = Iter.toArray(requestsHashMap.entries());
        let updatedDaoMetaData : MainTypes.DaoMetaData = { daoMetaData with requestsForAccess = newRequestsArray;};
        return #ok(updatedDaoMetaData);
    };

    public func removeFromRequestsList( principals: [Text], daoMetaData: MainTypes.DaoMetaData) : 
    async MainTypes.DaoMetaData {
        let { requestsForAccess; } = daoMetaData;
        
        var index = 0;
        let principalsArraySize = principals.size();
        let requestsHashMap : HashMap.HashMap<Text, Bool> = HashMap.fromIter<Text, Bool>(
            Iter.fromArray(requestsForAccess), 
            Iter.size(Iter.fromArray(requestsForAccess)), 
            Text.equal,
            Text.hash
        );

        while(index < principalsArraySize){
            let principal = principals[index];
            requestsHashMap.delete(principal);
            index += 1;
        };
        let newRequestsArray = Iter.toArray(requestsHashMap.entries());
        let updatedDaoMetaData: MainTypes.DaoMetaData = { daoMetaData with requestsForAccess = newRequestsArray; }; 
        return updatedDaoMetaData;
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

    public func configureApp( backEndPrincipal : Text, frontEndPrincipal : Text, nftId : Int,   metaData : MainTypes.DaoMetaData) 
    : async (MainTypes.DaoMetaData) {
        var managerCanisterPrincipal = metaData.managerCanisterPrincipal;
        var treasuryCanisterPrincipal = metaData.treasuryCanisterPrincipal;
        //initializing manager canister
        if(managerCanisterPrincipal == "Null"){
            Cycles.add(1_000_000_000_000);
            let managerCanister = await Manager.Manager(Principal.fromText(backEndPrincipal));
            let amountAccepted_manager = await managerCanister.wallet_receive();
            await managerCanister.loadRelease();
            managerCanisterPrincipal := Principal.toText(Principal.fromActor(managerCanister));
        };

        //initializing treasury canister
        if(treasuryCanisterPrincipal == "Null"){
            Cycles.add(1_000_000_000_000);
            let treasuryCanister = await Treasury.Treasury(Principal.fromText(backEndPrincipal));
            let amountAccepted_treasury = await treasuryCanister.wallet_receive();
            treasuryCanisterPrincipal := Principal.toText(Principal.fromActor(treasuryCanister));
        };

        let updatedDefaultControllers_0 = addDefualtController([] , Principal.fromText(backEndPrincipal));
        let updatedDefaultControllers_1 = addDefualtController(updatedDefaultControllers_0 ,Principal.fromText(managerCanisterPrincipal));

        let updatedMetaData = {
            metaData with
            managerCanisterPrincipal = managerCanisterPrincipal;
            treasuryCanisterPrincipal = treasuryCanisterPrincipal;
            frontEndPrincipal = frontEndPrincipal;
            backEndPrincipal = backEndPrincipal;
            nftId = nftId;
            defaultControllers = updatedDefaultControllers_1;
        };

        return (updatedMetaData);
    };

    public func getCanisterCyclesBalances(backendCyclesBalance: Nat, canisterData: MainTypes.DaoMetaData) 
    : async  MainTypes.CanisterCyclesBalances {

        let frontendCyclesBalance = await getCyclesBalance(Principal.fromText(canisterData.frontEndPrincipal));
        return {frontendCyclesBalance = frontendCyclesBalance; backendCyclesBalance = backendCyclesBalance}
    };

    public func getCanisterData(callerId: Principal, 
        daoMetaData: MainTypes.DaoMetaData, 
        cyclesBalance_backend: Nat, 
        profilesMap : MainTypes.UserProfilesMap
    ) : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {

        let profile = profilesMap.get(callerId);

        switch(profile){
            case null{ return #err(#NotAuthorized); };
            case ( ? existingProfile){
                let managerCanister : Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
                let profilesApprovalStatus = getProfilesMetaData(profilesMap);
                let frontendPrincipal = Principal.fromText(daoMetaData.frontEndPrincipal);
                let managerPrincipal = Principal.fromText(daoMetaData.managerCanisterPrincipal);
                let cyclesBalance_frontend = await getCyclesBalance(frontendPrincipal);
                let currentCyclesBalance_manager = await getCyclesBalance(managerPrincipal);
                let isOwner = Principal.toText(callerId) == daoMetaData.nftOwner;
                let currentVersion = await managerCanister.getCurrentReleaseVersion();
                let canisterDataPackagedForExport = {
                    daoMetaData with 
                    journalCount = profilesMap.size();
                    currentCyclesBalance_frontend = cyclesBalance_frontend;
                    currentCyclesBalance_backend = cyclesBalance_backend;
                    currentCyclesBalance_manager = currentCyclesBalance_manager;
                    profilesMetaData = profilesApprovalStatus;
                    isOwner = isOwner;
                    releaseVersion = currentVersion.number;
                };
                return #ok(canisterDataPackagedForExport);
            }
        }
    };

    private func refillCanisterCycles(daoMetaData: MainTypes.DaoMetaData, profilesMap : MainTypes.UserProfilesMap) : async () {
        let numberOfProfiles = profilesMap.size();
        let profilesIter = profilesMap.entries();
        let profilesArray = Iter.toArray(profilesIter);
        var index = 0;
        let frontendCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData.frontEndPrincipal) });
        let managerCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData.managerCanisterPrincipal)});
        let treasuryCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData.treasuryCanisterPrincipal)});
        if(frontendCanisterStatus.cycles < 2_000_000_000_000){
            Cycles.add(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(daoMetaData.frontEndPrincipal); });
        };
        if(managerCanisterStatus.cycles < 2_000_000_000_000) {
            Cycles.add(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(daoMetaData.managerCanisterPrincipal); });
        };
        if(treasuryCanisterStatus.cycles < 2_000_000_000_000) {
            Cycles.add(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(daoMetaData.treasuryCanisterPrincipal); });
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

    public func heartBeat(currentCylcesBalance: Nat, daoMetaData : MainTypes.DaoMetaData, profilesMap: MainTypes.UserProfilesMap): 
    async MainTypes.DaoMetaData{
        ignore refillCanisterCycles(daoMetaData, profilesMap);
        let timeLapsed : Float = Float.fromInt(Time.now() - daoMetaData.lastRecordedTime);
        let timeLapsedInDays : Float = timeLapsed / nanosecondsInADay;
        if(timeLapsedInDays < 1){ return daoMetaData };
        let cyclesBurned : Float = Float.fromInt(daoMetaData.lastRecordedBackEndCyclesBalance - currentCylcesBalance);
        let dailyBurnRate : Nat = Int.abs(Float.toInt(cyclesBurned / timeLapsedInDays));
        let updatedCanisterData = {
            daoMetaData with 
            lastRecordedBackEndCyclesBalance = currentCylcesBalance;
            backEndCyclesBurnRatePerDay = dailyBurnRate;
            lastRecordedTime = Time.now();
        };
        return updatedCanisterData;
    };

    public func toggleAcceptRequest(callerId: Principal, daoMetaData: MainTypes.DaoMetaData) : 
    Result.Result<(MainTypes.DaoMetaData), JournalTypes.Error>{
        let callerIdAsText = Principal.toText(callerId);
        if(callerIdAsText != daoMetaData.nftOwner){ return #err(#NotAuthorized);};
        let updatedMetaData = { daoMetaData with acceptingRequests = not daoMetaData.acceptingRequests; };
        return #ok(updatedMetaData);
    };

    public func installCode_managerCanister( canisterData: MainTypes.DaoMetaData ): async (){
        let {managerCanisterPrincipal; backEndPrincipal} = canisterData;
        let managerActor : Manager.Manager = actor(managerCanisterPrincipal);
        let wasmStoreCanister : WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let currentReleaseVersion = await managerActor.getCurrentReleaseVersion();
        let {wasmModule} = await wasmStoreCanister.getModule(currentReleaseVersion.number, WasmStore.wasmTypes.manager);
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

    public func addControllers(principals: [Text], canisterPrincipal: Principal, defaultControllers: [Principal]) : 
    async () {
        
        let canisterStatus = await ic.canister_status({canister_id = canisterPrincipal });
        let { settings } = canisterStatus;
        let controllersOption = settings.controllers;
        var controllers = Option.get(controllersOption, defaultControllers);
        let ArrayBuffer = Buffer.Buffer<(Principal)>(1);
        let controllersIter = Iter.fromArray(controllers);
        var index = 0;
        let principalsArrayLegth = principals.size();
        while(index < principalsArrayLegth){
            let principalAsBlob = Principal.fromText(principals[index]);
            ArrayBuffer.add(principalAsBlob);
            index += 1;
        };
        Iter.iterate<Principal>(controllersIter, func (x: Principal, index: Nat){ ArrayBuffer.add(x); });
        controllers := ArrayBuffer.toArray();
        let updatedSettings  = { 
            controllers = ?controllers;
            freezing_threshold = ?settings.freezing_threshold;
            memory_allocation = ?settings.memory_allocation;
            compute_allocation = ?settings.compute_allocation;
        };
        let result = await ic.update_settings({ canister_id = canisterPrincipal; settings = updatedSettings; });
    };

    public func toggleSupportMode( caller: Principal, daoMetaData: MainTypes.DaoMetaData) : 
    async Result.Result<(MainTypes.DaoMetaData),JournalTypes.Error>{
        let callerIdAsText = Principal.toText(caller);
        let { supportMode; nftOwner; backEndPrincipal; defaultControllers; managerCanisterPrincipal; frontEndPrincipal; treasuryCanisterPrincipal} = daoMetaData;
        let supportMode_updated = not supportMode;
        if(callerIdAsText != nftOwner){ return #err(#NotAuthorized) };
        if(supportMode_updated){
            let techSupportPrincipals = [ Support.TechSupportPrincipal1, Support.TechSupportPrincipal2 ];
            let result1 = ignore addControllers( techSupportPrincipals, Principal.fromText(backEndPrincipal), defaultControllers );
            let result2 = ignore addControllers( techSupportPrincipals, Principal.fromText(backEndPrincipal), defaultControllers );
            let result3 = ignore addControllers( techSupportPrincipals, Principal.fromText(managerCanisterPrincipal), defaultControllers );
            let result4 = ignore addControllers( techSupportPrincipals, Principal.fromText(managerCanisterPrincipal), defaultControllers );
            let result5 = ignore addControllers( techSupportPrincipals, Principal.fromText(treasuryCanisterPrincipal), defaultControllers );
            let result6 = ignore addControllers( techSupportPrincipals, Principal.fromText(treasuryCanisterPrincipal), defaultControllers );
            let result7 = ignore addControllers( techSupportPrincipals, Principal.fromText(frontEndPrincipal), defaultControllers );
            let result8 = ignore addControllers( techSupportPrincipals, Principal.fromText(frontEndPrincipal), defaultControllers );
        } else {
            let result1 = ignore setToDefualtControllerSettings( Principal.fromText(backEndPrincipal), defaultControllers );
            let result2 = ignore setToDefualtControllerSettings( Principal.fromText(managerCanisterPrincipal), defaultControllers );
            let result3 = ignore setToDefualtControllerSettings( Principal.fromText(treasuryCanisterPrincipal), defaultControllers );
            let result4 = ignore setToDefualtControllerSettings( Principal.fromText(frontEndPrincipal), defaultControllers );
        };
        let updatedDaoMetaData: MainTypes.DaoMetaData = { daoMetaData with supportMode = supportMode_updated; };
        return #ok(updatedDaoMetaData);
    };

    public func verifyOwnership( principal: Principal, daoMetaData: MainTypes.DaoMetaData ): async Bool {
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
                    if(tokenIndexAsNat == daoMetaData.nftId){
                        return true;
                    };
                    index += 1;
                };
                return false;
            };
            case(#err(e)){ return false; };
        };  
    };

    public func registerOwner(caller: Principal, metaData: MainTypes.DaoMetaData ): 
    async Result.Result<(MainTypes.DaoMetaData), JournalTypes.Error> {
        let isOwner = await verifyOwnership(caller, metaData);
        if(not isOwner){ return #err(#NotAuthorized);};
        let metaData_withOwner = updateOwner(caller, metaData);
        let updatedDaoMetaData = await grantAccess( [Principal.toText(caller)], metaData_withOwner );
        switch(updatedDaoMetaData){
            case(#ok(daoMetaData)){ #ok((daoMetaData))};
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