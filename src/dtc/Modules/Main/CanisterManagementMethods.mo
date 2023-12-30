import Trie "mo:base/Trie";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Account "../../Ledger/Account";
import JournalTypes "../../Types/Journal/types";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "../../Types/Main/types";
import Journal "../../Journal";
import Ledger "../../Ledger/Ledger";
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
import Hex "../../Ledger/Hex";
import NftCollection "../../Types/NftCollection/types";
import Nat32 "mo:base/Nat32";
import Support "../../SupportCanisterIds/SupportCanisterIds";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Treasury "../../Treasury";
import GovernanceHelperMethods "GovernanceHelperMethods";
import TreasuryTypes "../../Types/Treasury/types";
import NnsCyclesMinting "../../Ledger/NnsCyclesMinting";

module{

    private let ic : IC.Self = actor "aaaaa-aa";

    private let nftCollection : NftCollection.Interface = actor(NftCollection.CANISTER_ID);

    private let nanosecondsInADay: Float = 86400000000000;

    private let nanosecondsInAMinute: Float = 60000000000;

    public func authorizePrinicpalToViewAssets(principal: Text, frontendCanisterPrincipal: Text) : async () {
        let assetCanister : AssetCanister.Interface = actor(frontendCanisterPrincipal);
        let result = await assetCanister.authorize(Principal.fromText(principal));
    };

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

    public func grantAccess( principals: [Text], daoMetaData: MainTypes.DaoMetaData_V2) : 
    async Result.Result<(MainTypes.DaoMetaData_V2), JournalTypes.Error> {
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
        let updatedDaoMetaData: MainTypes.DaoMetaData_V2 = { daoMetaData with requestsForAccess = newRequestsArray; }; 
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

    public func requestApproval (caller: Principal, daoMetaData:  MainTypes.DaoMetaData_V2) : 
    Result.Result<MainTypes.DaoMetaData_V2, JournalTypes.Error>{
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
        let updatedDaoMetaData : MainTypes.DaoMetaData_V2 = { daoMetaData with requestsForAccess = newRequestsArray;};
        return #ok(updatedDaoMetaData);
    };

    public func removeFromRequestsList( principals: [Text], daoMetaData: MainTypes.DaoMetaData_V2) : 
    async MainTypes.DaoMetaData_V2 {
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
        let updatedDaoMetaData: MainTypes.DaoMetaData_V2 = { daoMetaData with requestsForAccess = newRequestsArray; }; 
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

    public func canConfigureApp(daoMetaData: MainTypes.DaoMetaData_V2) : Bool {
        if(
            daoMetaData.frontEndPrincipal == "Null" or 
            daoMetaData.managerCanisterPrincipal == "Null" or 
            daoMetaData.treasuryCanisterPrincipal == "Null" or
            daoMetaData.admin.size() == 0
        ) return true;
        return false;
    };

    public func configureApp( 
        backEndPrincipal : Text, 
        frontEndPrincipal : Text, 
        adminPrincipal : Text,
        metaData : MainTypes.DaoMetaData_V2) 
    : async (MainTypes.DaoMetaData_V2) {

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

        let result = await authorizePrinicpalToViewAssets(backEndPrincipal, frontEndPrincipal);
        let admin = [(adminPrincipal, {percentage = 100})];

        let updatedMetaData = {
            metaData with
            admin;
            managerCanisterPrincipal;
            treasuryCanisterPrincipal;
            frontEndPrincipal;
            backEndPrincipal;
            defaultControllers = updatedDefaultControllers_1;
        };

        return (updatedMetaData);
    };

    public func getCanisterData(
        callerId: Principal, 
        daoMetaData: MainTypes.DaoMetaData_V2, 
        cyclesBalance_backend: Nat, 
        profilesMap : MainTypes.UserProfilesMap,
        proposals : MainTypes.ProposalsMap
    ) : async Result.Result<(MainTypes.CanisterDataExport), JournalTypes.Error> {

        let profile = profilesMap.get(callerId);
        
        switch(profile){
            case null{ return #err(#NotAuthorized); };
            case ( ? existingProfile){
                let cyclesMintingCanister: NnsCyclesMinting.Interface = actor(NnsCyclesMinting.NnsCyclesMintingCanisterID);
                let {data} = await cyclesMintingCanister.get_icp_xdr_conversion_rate();
                let {xdr_permyriad_per_icp} = data;
                let treasuryCanister: Treasury.Treasury = actor(daoMetaData.treasuryCanisterPrincipal);
                let treasuryCollateralArray = await treasuryCanister.getTreasuryCollateralArray();
                let managerCanister : Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
                let profilesApprovalStatus = getProfilesMetaData(profilesMap);
                let frontendPrincipal = Principal.fromText(daoMetaData.frontEndPrincipal);
                let managerPrincipal = Principal.fromText(daoMetaData.managerCanisterPrincipal);
                let cyclesBalance_frontend = await getCyclesBalance(frontendPrincipal);
                let currentCyclesBalance_manager = await getCyclesBalance(managerPrincipal);
                let isAdmin = getIsAdmin(callerId, daoMetaData);
                let currentVersion = await managerCanister.getCurrentReleaseVersion();
                let canisterDataPackagedForExport = {
                    daoMetaData with 
                    proposals = GovernanceHelperMethods.tallyAllProposalVotes({proposals; treasuryCollateralArray; xdr_permyriad_per_icp});
                    journalCount = profilesMap.size();
                    currentCyclesBalance_frontend = cyclesBalance_frontend;
                    currentCyclesBalance_backend = cyclesBalance_backend;
                    currentCyclesBalance_manager = currentCyclesBalance_manager;
                    profilesMetaData = profilesApprovalStatus;
                    isAdmin;
                    releaseVersion = currentVersion.number;
                };
                return #ok(canisterDataPackagedForExport);
            }
        }
    };

    private func refillCanisterCycles(daoMetaData: MainTypes.DaoMetaData_V2, profilesMap : MainTypes.UserProfilesMap) : async () {
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

    public func heartBeat(currentCylcesBalance: Nat, daoMetaData : MainTypes.DaoMetaData_V2, profilesMap: MainTypes.UserProfilesMap): 
    async MainTypes.DaoMetaData_V2{
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
            mode = #upgrade(?{skip_pre_upgrade = ?false});
            canister_id = canister_id;
            sender_canister_version = null;
        });
        await ic.start_canister({canister_id = canister_id});
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

    public func addControllers(principals: [Text], canisterPrincipal: Principal, defaultControllers: [Principal]) : 
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
        let updatedControllers = ArrayBuffer.toArray();
        let updatedSettings  = { 
            controllers = ?updatedControllers;
            freezing_threshold = ?settings.freezing_threshold;
            memory_allocation = ?settings.memory_allocation;
            compute_allocation = ?settings.compute_allocation;
        };
        let result = await ic.update_settings({ canister_id = canisterPrincipal; settings = updatedSettings; sender_canister_version = null;});
    };

    public func toggleSupportMode( caller: Principal, daoMetaData: MainTypes.DaoMetaData_V2) : 
    async MainTypes.DaoMetaData_V2{

        let { 
            supportMode; backEndPrincipal; defaultControllers; managerCanisterPrincipal; frontEndPrincipal; treasuryCanisterPrincipal
        } = daoMetaData;
        let supportMode_updated = not supportMode;
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
        let updatedDaoMetaData: MainTypes.DaoMetaData_V2 = { daoMetaData with supportMode = supportMode_updated; };
        return updatedDaoMetaData;
    };

    public func getAdminMap(daoMetaData: MainTypes.DaoMetaData_V2) : HashMap.HashMap<Text, MainTypes.AdminData>{
        let adminList = HashMap.fromIter<Text, MainTypes.AdminData>(
            Iter.fromArray(daoMetaData.admin), 
            Iter.size(Iter.fromArray(daoMetaData.admin)), 
            Text.equal,
            Text.hash
        );
        return adminList;
    };

    public func addAdmin(principal: Principal, daoMetaData: MainTypes.DaoMetaData_V2) : MainTypes.DaoMetaData_V2 {
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

    public func removeAdmin(principal: Principal, daoMetaData: MainTypes.DaoMetaData_V2) : MainTypes.DaoMetaData_V2 {
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

    public func getIsAdmin(princiapl: Principal, daoMetaData: MainTypes.DaoMetaData_V2) : Bool {
        let adminMap = getAdminMap(daoMetaData);
        let adminData = adminMap.get(Principal.toText(princiapl));
        if(adminData == null){ return false; };
        return true;
    };

    // public func verifyOwnership( principal: Principal, daoMetaData: MainTypes.DaoMetaData ): async Bool {
    //     let accountIdBlob = Account.accountIdentifier(principal, Account.defaultSubaccount());
    //     let accountIdArray = Blob.toArray(accountIdBlob);
    //     let accountIdText = Hex.encode(accountIdArray);
    //     let tokens_ext_result = await nftCollection.tokens_ext(accountIdText);
    //     switch(tokens_ext_result){
    //         case(#ok(tokensOwned)){
    //             var index = 0;
    //             let tokensOwnedIter = Iter.fromArray(tokensOwned);
    //             let numberOfTokensOwned = Iter.size(tokensOwnedIter);
    //             while(index < numberOfTokensOwned){
    //                 let tokenData = tokensOwned[index];
    //                 let tokenIndex = tokenData.0;
    //                 var tokenIndexAsNat = Nat32.toNat(tokenIndex);
    //                 tokenIndexAsNat := tokenIndexAsNat + 1;
    //                 if(tokenIndexAsNat == daoMetaData.nftId){
    //                     return true;
    //                 };
    //                 index += 1;
    //             };
    //             return false;
    //         };
    //         case(#err(e)){ return false; };
    //     };  
    // };

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