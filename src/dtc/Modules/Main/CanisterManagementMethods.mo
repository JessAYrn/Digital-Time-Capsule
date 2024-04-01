import Trie "mo:base/Trie";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../../Serializers/Account";
import JournalTypes "../../Types/Journal/types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import Ledger "../../NNS/Ledger";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Hash "mo:base/Hash";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Error "mo:base/Error";
import IC "../../Types/IC/types";
import Manager "../../Manager";
import AssetCanister "../../Types/AssetCanister/types";
import HashMap "mo:base/HashMap";
import AssetManagementFunctions "../../Modules/AssetCanister/AssetManagementFunctions";
import WasmStore "../../Types/WasmStore/types";
import Hex "../../Serializers/Hex";
import NftCollection "../../Types/NftCollection/types";
import Nat32 "mo:base/Nat32";
import Support "../../SupportCanisterIds/SupportCanisterIds";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Timer "mo:base/Timer";
import Treasury "../../Treasury";
import GovernanceHelperMethods "GovernanceHelperMethods";
import TreasuryTypes "../../Types/Treasury/types";
import NnsCyclesMinting "../../NNS/NnsCyclesMinting";

module{

    private let ic : IC.Self = actor "aaaaa-aa";

    private let nftCollection : NftCollection.Interface = actor(NftCollection.CANISTER_ID);

    private let nanosecondsInADay: Float = 86400000000000;

    private let nanosecondsInAMinute: Float = 60000000000;

    public func getPrincipalsList( profilesMap : MainTypes.UserProfilesMap): 
    async [Principal] {
        var index = 0;
        let numberOfProfiles = profilesMap.size();
        let profilesIter = profilesMap.entries();
        let profilesArray = Iter.toArray(profilesIter);
        let ArrayBuffer = Buffer.Buffer<(Principal)>(1);
        while(index < numberOfProfiles){
            let (userPrincipal, profile) = profilesArray[index];
            ArrayBuffer.add(userPrincipal);
            index += 1;
        };
        return ArrayBuffer.toArray();
    };

    public func grantAccess( principals: [Text], daoMetaData: MainTypes.DaoMetaData_V3) : 
    async Result.Result<(MainTypes.DaoMetaData_V3), JournalTypes.Error> {
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
        let updatedDaoMetaData: MainTypes.DaoMetaData_V3 = { daoMetaData with requestsForAccess = newRequestsArray; }; 
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

    public func requestApproval (caller: Principal, daoMetaData:  MainTypes.DaoMetaData_V3) : 
    Result.Result<MainTypes.DaoMetaData_V3, JournalTypes.Error>{
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
        let updatedDaoMetaData : MainTypes.DaoMetaData_V3 = { daoMetaData with requestsForAccess = newRequestsArray;};
        return #ok(updatedDaoMetaData);
    };

    public func removeFromRequestsList( principals: [Text], daoMetaData: MainTypes.DaoMetaData_V3) : 
    async MainTypes.DaoMetaData_V3 {
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
        let updatedDaoMetaData: MainTypes.DaoMetaData_V3 = { daoMetaData with requestsForAccess = newRequestsArray; }; 
        return updatedDaoMetaData;
    };

    public func canConfigureApp(daoMetaData: MainTypes.DaoMetaData_V3) : Bool {
        if(
            daoMetaData.backEndPrincipal == "Null" or
            daoMetaData.frontEndPrincipal == "Null" or 
            daoMetaData.managerCanisterPrincipal == "Null" or 
            daoMetaData.treasuryCanisterPrincipal == "Null" 
        ) return true;
        return false;
    };

    public func createManagerCanister(daoMetaData: MainTypes.DaoMetaData_V3) : async {managerCanisterPrincipal: Text} {
        if(daoMetaData.managerCanisterPrincipal == "Null"){ 
            Cycles.add(1_000_000_000_000);
            let managerCanister = await Manager.Manager(Principal.fromText(daoMetaData.backEndPrincipal));
            let amountAccepted = await managerCanister.wallet_receive();
            ignore addControllers([Principal.toText(Principal.fromActor(managerCanister))], Principal.fromActor(managerCanister));
            let managerCanisterPrincipal = Principal.toText(Principal.fromActor(managerCanister));
            return {managerCanisterPrincipal};
        };
        return {managerCanisterPrincipal = daoMetaData.managerCanisterPrincipal};
    };
    
    public func createTreasuryCanister(daoMetaData: MainTypes.DaoMetaData_V3 ) : async {treasuryCanisterPrincipal: Text} {
        if(daoMetaData.treasuryCanisterPrincipal == "Null"){
            Cycles.add(1_000_000_000_000);
            let treasuryCanister = await Treasury.Treasury(Principal.fromText(daoMetaData.backEndPrincipal));
            let amountAccepted = await treasuryCanister.wallet_receive();
            let treasuryCanisterPrincipal_ = Principal.fromActor(treasuryCanister);
            ignore addControllers([daoMetaData.managerCanisterPrincipal], treasuryCanisterPrincipal_);
            let treasuryCanisterPrincipal = Principal.toText(treasuryCanisterPrincipal_);
            return {treasuryCanisterPrincipal};
        };
        return {treasuryCanisterPrincipal = daoMetaData.treasuryCanisterPrincipal};
    };

    public func createUiCanister(daoMetaData: MainTypes.DaoMetaData_V3): async {frontEndPrincipal: Text} {
        if(daoMetaData.frontEndPrincipal == "Null"){
            let settings = ?{
                controllers = ?[
                    Principal.fromText(daoMetaData.backEndPrincipal), 
                    Principal.fromText(daoMetaData.managerCanisterPrincipal)
                ];
                freezing_threshold = ?2_592_000;
                memory_allocation = ?0;
                compute_allocation = ?0;
            };
            Cycles.add(1_000_000_000_000);
            let {canister_id} = await ic.create_canister({settings = settings; sender_canister_version = null;});
            let {setTimer} = Timer;
            let timerId = setTimer(#seconds(60 * 3), func (): async (){ await installUiModuleAndAssets({daoMetaData with frontEndPrincipal = Principal.toText(canister_id)}); });
            return {frontEndPrincipal = Principal.toText(canister_id)};
        };
        return {frontEndPrincipal = daoMetaData.frontEndPrincipal};
    };

    private func installUiModuleAndAssets(daoMetaData: MainTypes.DaoMetaData_V3): async () {
        let backendCanisterId = Principal.fromText(daoMetaData.backEndPrincipal);
        let managerCanisterId = Principal.fromText(daoMetaData.managerCanisterPrincipal);
        let managerCanister: Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
        let operations = await managerCanister.installCode_frontendCanister(daoMetaData, #install);
        let uiCanister: AssetCanister.Interface = actor(daoMetaData.frontEndPrincipal);
        ignore uiCanister.authorize(backendCanisterId);
        ignore uiCanister.grant_permission({ to_principal = backendCanisterId; permission = #Commit; });
        ignore uiCanister.grant_permission({ to_principal = backendCanisterId; permission = #ManagePermissions; });
        ignore uiCanister.grant_permission({ to_principal = backendCanisterId; permission = #Prepare; });
        ignore uiCanister.grant_permission({ to_principal = managerCanisterId; permission = #Commit; });
        ignore uiCanister.grant_permission({ to_principal = managerCanisterId; permission = #ManagePermissions; });
        ignore uiCanister.grant_permission({ to_principal = managerCanisterId; permission = #Prepare; });
    };

    public func getCanisterData(
        callerId: Principal, 
        daoMetaData: MainTypes.DaoMetaData_V3, 
        cyclesBalance_backend: Nat, 
        profilesMap : MainTypes.UserProfilesMap,
        proposals : MainTypes.ProposalsMap
    ) : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {

        let profile = profilesMap.get(callerId);
        
        switch(profile){
            case null{ return #err(#NotAuthorized); };
            case ( ? existingProfile){
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
                let neuronsDataArray = await treasuryCanister.getNeuronsDataArray();
                let managerCanister : Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
                let profilesApprovalStatus = getProfilesMetaData(profilesMap);
                let frontendPrincipal = Principal.fromText(daoMetaData.frontEndPrincipal);
                let managerPrincipal = Principal.fromText(daoMetaData.managerCanisterPrincipal);
                let cyclesBalance_frontend = await getCyclesBalance(frontendPrincipal);
                let currentCyclesBalance_manager = await getCyclesBalance(managerPrincipal);
                let isAdmin = getIsAdmin(callerId, daoMetaData);
                let currentVersion = await managerCanister.getCurrentVersions();
                let canisterDataPackagedForExport = {
                    daoMetaData with 
                    proposals = GovernanceHelperMethods.tallyAllProposalVotes({proposals; neuronsDataArray});
                    journalCount = profilesMap.size();
                    currentCyclesBalance_frontend = cyclesBalance_frontend;
                    currentCyclesBalance_backend = cyclesBalance_backend;
                    currentCyclesBalance_manager = currentCyclesBalance_manager;
                    profilesMetaData = profilesApprovalStatus;
                    isAdmin;
                    releaseVersionInstalled = currentVersion.currentVersionInstalled.number;
                    releaseVersionLoaded = currentVersion.currentVersionLoaded.number;
                };
                return #ok(canisterDataPackagedForExport);
            }
        }
    };

    private func refillCanisterCycles(daoMetaData: MainTypes.DaoMetaData_V3, profilesMap : MainTypes.UserProfilesMap) : async () {
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

    public func heartBeat(currentCylcesBalance: Nat, daoMetaData : MainTypes.DaoMetaData_V3, profilesMap: MainTypes.UserProfilesMap): 
    async MainTypes.DaoMetaData_V3{
        let managerCanister : Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
        ignore managerCanister.notifyNextStableRelease();
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

    public func installCode_managerCanister( canisterData: {managerCanisterPrincipal: Text; backEndPrincipal: Text} ): async (){
        let {managerCanisterPrincipal; backEndPrincipal} = canisterData;
        let managerActor : Manager.Manager = actor(managerCanisterPrincipal);
        let {wasmModule} = await managerActor.getReleaseModule(WasmStore.wasmTypes.manager);
        let arg = Principal.fromText(backEndPrincipal);
        let managerPrincipal = Principal.fromText(managerCanisterPrincipal);
        await installCode_(?arg, wasmModule, managerPrincipal, #upgrade(?{skip_pre_upgrade = ?false}));
    };

    private func installCode_ (
        argument: ?Principal, 
        wasm_module: Blob, 
        canister_id: Principal, 
        mode: {#upgrade: ?{skip_pre_upgrade: ?Bool}; #install; #reinstall}
    ) : async () {
        var arg = to_candid(null);
        switch(argument){ case null {}; case (?argument_){ arg := to_candid(argument_); } };
        await ic.stop_canister({canister_id});
        await ic.install_code({
            arg;
            wasm_module;
            mode;
            canister_id;
            sender_canister_version = null;
        });
        await ic.start_canister({canister_id});
    };

    public func getCyclesBalance(principal: Principal) : async Nat {
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
            sender_canister_version = null;
        });
    };

    public func addControllers(principals: [Text], canisterPrincipal: Principal) : 
    async () {
        
        let canisterStatus = await ic.canister_status({canister_id = canisterPrincipal });
        let { settings } = canisterStatus;
        let { controllers } = settings;
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
        let updatedControllers = Buffer.toArray(ArrayBuffer);
        let updatedSettings  = { 
            controllers = ?updatedControllers;
            freezing_threshold = ?settings.freezing_threshold;
            memory_allocation = ?settings.memory_allocation;
            compute_allocation = ?settings.compute_allocation;
        };
        let result = await ic.update_settings({ canister_id = canisterPrincipal; settings = updatedSettings; sender_canister_version = null;});
    };

    public func toggleSupportMode(daoMetaData: MainTypes.DaoMetaData_V3) : 
    async MainTypes.DaoMetaData_V3{

        let { 
            supportMode; backEndPrincipal; defaultControllers; managerCanisterPrincipal; frontEndPrincipal; treasuryCanisterPrincipal
        } = daoMetaData;
        let supportMode_updated = not supportMode;
        if(supportMode_updated){
            let techSupportPrincipals = [ Support.TechSupportPrincipal1, Support.TechSupportPrincipal2 ];
            let result1 = ignore addControllers( techSupportPrincipals, Principal.fromText(backEndPrincipal) );
            let result2 = ignore addControllers( techSupportPrincipals, Principal.fromText(managerCanisterPrincipal) );
            let result3 = ignore addControllers( techSupportPrincipals, Principal.fromText(treasuryCanisterPrincipal) );
            let result4 = ignore addControllers( techSupportPrincipals, Principal.fromText(frontEndPrincipal) );
        } else {
            let result1 = ignore setToDefualtControllerSettings( Principal.fromText(backEndPrincipal), defaultControllers );
            let result2 = ignore setToDefualtControllerSettings( Principal.fromText(managerCanisterPrincipal), defaultControllers );
            let result3 = ignore setToDefualtControllerSettings( Principal.fromText(treasuryCanisterPrincipal), defaultControllers );
            let result4 = ignore setToDefualtControllerSettings( Principal.fromText(frontEndPrincipal), defaultControllers );
        };
        let updatedDaoMetaData: MainTypes.DaoMetaData_V3 = { daoMetaData with supportMode = supportMode_updated; };
        return updatedDaoMetaData;
    };

    public func getAdminMap(daoMetaData: MainTypes.DaoMetaData_V3) : HashMap.HashMap<Text, MainTypes.AdminData>{
        let adminList = HashMap.fromIter<Text, MainTypes.AdminData>(
            Iter.fromArray(daoMetaData.admin), 
            Iter.size(Iter.fromArray(daoMetaData.admin)), 
            Text.equal,
            Text.hash
        );
        return adminList;
    };

    public func addAdmin(principal: Principal, daoMetaData: MainTypes.DaoMetaData_V3) : MainTypes.DaoMetaData_V3 {
        let {admin} = daoMetaData;
        let adminHashMap = HashMap.fromIter<Text, MainTypes.AdminData>(
            Iter.fromArray(admin), 
            Iter.size(Iter.fromArray(admin)), 
            Text.equal,
            Text.hash
        );
        adminHashMap.put(Principal.toText(principal), {percentage = 0});
        return {daoMetaData with admin = Iter.toArray(adminHashMap.entries())};
    };

    public func removeAdmin(principal: Principal, daoMetaData: MainTypes.DaoMetaData_V3) : MainTypes.DaoMetaData_V3 {
        let {admin} = daoMetaData;
        let adminHashMap = HashMap.fromIter<Text, MainTypes.AdminData>(
            Iter.fromArray(admin), 
            Iter.size(Iter.fromArray(admin)), 
            Text.equal,
            Text.hash
        );
        adminHashMap.delete(Principal.toText(principal));
        return {daoMetaData with admin = Iter.toArray(adminHashMap.entries())};
    };

    public func getIsAdmin(princiapl: Principal, daoMetaData: MainTypes.DaoMetaData_V3) : Bool {
        let adminMap = getAdminMap(daoMetaData);
        let adminData = adminMap.get(Principal.toText(princiapl));
        if(adminData == null){ return false; };
        return true;
    };

    public func verifyUserHasAdminNft( principal: Principal, daoMetaData: MainTypes.DaoMetaData_V3 ): async Bool {
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
                    let (tokenIndex, _, _) = tokenData;
                    var tokenIndexAsNat = Nat32.toNat(tokenIndex);
                    tokenIndexAsNat += 1;
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