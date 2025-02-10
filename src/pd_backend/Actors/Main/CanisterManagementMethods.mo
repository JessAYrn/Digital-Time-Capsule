import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import MainTypes "/types";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import IC "../../Types/IC/types";
import Manager "../Manager/Actor";
import AssetCanister "../../Types/AssetCanister/types";
import HashMap "mo:base/HashMap";
import Support "../../SupportCanisterIds/SupportCanisterIds";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Debug "mo:base/Debug";
import Nat64 "mo:base/Nat64";
import Treasury "../Treasury/Actor";
import FloatX "../../MotokoNumbers/FloatX";
import Account "../../Serializers/Account";
import Ledger "../../NNS/Ledger";

module{

    private let ic : IC.Self = actor "aaaaa-aa";

    private let nanosecondsInADay: Nat64 = 86400000000000;

    public func grantAccess( principals: [Text], requestsForAccessMap: MainTypes.RequestsForAccessMap) : () {
        label looping for(principal in Iter.fromArray(principals)){ 
            let ?request = requestsForAccessMap.get(principal) else continue looping; 
            requestsForAccessMap.put(principal, {request with approved = true});
        };
    };

    public func updateApprovalStatus( principals: [Text], profilesMap: MainTypes.UserProfilesMap_V2, newApprovalStatuse: Bool) : (){
        label looping for(principal in Iter.fromArray(principals)){
            let ?profile = profilesMap.get(Principal.fromText(principal)) else continue looping;
            let updatedProfile : MainTypes.UserProfile_V2 = { profile with approved = ?newApprovalStatuse; };
            profilesMap.put(Principal.fromText(principal), updatedProfile);
        };
    };

    public func newUserIsPermittedToEnterDao(principal: Principal, thisCanisterId: Principal, costToEnterDao: Nat64, daoMetaData: MainTypes.DaoMetaData_V4, requestsForAccessMap: MainTypes.RequestsForAccessMap): 
    async {approved: Bool; paidEntryCost: Bool} {

        if(Principal.toText(principal) == "2vxsx-fae") return {approved = false; paidEntryCost = false };
        if(daoMetaData.founder == "Null") return {approved = true; paidEntryCost = true };

        switch(requestsForAccessMap.get(Principal.toText(principal))){ 

            case null{ return {approved = false; paidEntryCost = false } }; 
            case(?{approved; escrowSubaccountId}){ 
                let ledger: Ledger.Interface = actor(Ledger.CANISTER_ID);
                let newUserBalance = Nat64.fromNat(await ledger.icrc1_balance_of({owner = thisCanisterId; subaccount = ?escrowSubaccountId}));
                let paidEntryCost = newUserBalance >= costToEnterDao;
                return { approved; paidEntryCost };

            }; 

        };
    };

    public func requestEntryToDao (caller: Principal, daoIsPublic: Bool, thisCanisterId: Principal, costToEnterDao: Nat64, daoMetaData: MainTypes.DaoMetaData_V4, requestsForAccessMap: MainTypes.RequestsForAccessMap) : 
    async {approved: Bool; paidEntryCost: Bool} { 
        switch(requestsForAccessMap.get(Principal.toText(caller))){
            case null { 
                let request = {approved = daoIsPublic; escrowSubaccountId = await Account.getRandomSubaccount(); };
                requestsForAccessMap.put(Principal.toText(caller), request); 
            };
            case(?_){ };
        };
        return await newUserIsPermittedToEnterDao(caller, thisCanisterId, costToEnterDao, daoMetaData, requestsForAccessMap);
    };

    public func removeFromRequestsList( principals: [Text], requestsForAccessMap:  MainTypes.RequestsForAccessMap, apiCanisterPrincipal: Principal, treasuryCanisterPrincipal: Principal) : async () { 
        let ledger: Ledger.Interface = actor(Ledger.CANISTER_ID);
        let {transfer_fee} = await ledger.transfer_fee({});
        
        func removeRequest(principal: Text): async () {
            let ?{escrowSubaccountId; } = requestsForAccessMap.get(principal) else return;
            let newUserDepositBalance = await ledger.icrc1_balance_of({owner = apiCanisterPrincipal; subaccount = ?escrowSubaccountId});
            if(newUserDepositBalance > Nat64.toNat(transfer_fee.e8s)){
                ignore ledger.icrc1_transfer({
                    to = {owner = treasuryCanisterPrincipal; subaccount = null};
                    fee = ?Nat64.toNat(transfer_fee.e8s);
                    memo = null;
                    from_subaccount = ?escrowSubaccountId;
                    created_at_time = ?Int64.toNat64(Int64.abs(Int64.fromInt(Time.now())));
                    amount = newUserDepositBalance - Nat64.toNat(transfer_fee.e8s);
                });
            };
            requestsForAccessMap.delete(principal); 
        };

        for(principal in Iter.fromArray(principals)){ await removeRequest(principal); }; 
    };

    public func canConfigureApp(daoMetaData: MainTypes.DaoMetaData_V4) : Bool {
        if(
            daoMetaData.backEndPrincipal == "Null" or
            daoMetaData.frontEndPrincipal == "Null" or 
            daoMetaData.managerCanisterPrincipal == "Null" or 
            daoMetaData.treasuryCanisterPrincipal == "Null" or 
            daoMetaData.founder == "Null"
        ) return true;
        return false;
    };

    public func createManagerCanister(daoMetaData: MainTypes.DaoMetaData_V4) : async {managerCanisterPrincipal: Text} {
        let managerCanisterPrincipal = switch(daoMetaData.managerCanisterPrincipal == "Null"){
            case true {
                Cycles.add<system>(3_000_000_000_000);
                let managerCanister = await Manager.Manager(Principal.fromText(daoMetaData.backEndPrincipal));
                Principal.toText(Principal.fromActor(managerCanister));
            };
            case false { daoMetaData.managerCanisterPrincipal };
        };
        let managerCanister: Manager.Manager = actor(managerCanisterPrincipal);
        try{
            ignore await managerCanister.wallet_receive();
            ignore addControllers([Principal.toText(Principal.fromActor(managerCanister))], Principal.fromActor(managerCanister));
            return {managerCanisterPrincipal};
        }catch(_) { return {managerCanisterPrincipal} };
    };
    
    public func createTreasuryCanister(daoMetaData: MainTypes.DaoMetaData_V4 ) : async {treasuryCanisterPrincipal: Text} {
        if(daoMetaData.backEndPrincipal == "Null" or daoMetaData.managerCanisterPrincipal == "Null" ){ Debug.trap("backend or manager canister not created") };

        let treasuryCanisterPrincipal = switch(daoMetaData.treasuryCanisterPrincipal == "Null"){
            case true {
                Cycles.add<system>(3_000_000_000_000);
                let treasuryCanister = await Treasury.Treasury(Principal.fromText(daoMetaData.backEndPrincipal));
                Principal.toText(Principal.fromActor(treasuryCanister));
            };
            case false { daoMetaData.treasuryCanisterPrincipal };
        };
        let treasuryCanister: Treasury.Treasury = actor(treasuryCanisterPrincipal);
        try{
            ignore await treasuryCanister.wallet_receive();
            ignore treasuryCanister.configureTreasuryCanister();
            ignore addControllers([daoMetaData.managerCanisterPrincipal], Principal.fromActor(treasuryCanister));
            return {treasuryCanisterPrincipal};
        }catch(_) { return {treasuryCanisterPrincipal} };

    };

    public func createUiCanister(daoMetaData: MainTypes.DaoMetaData_V4): async {frontEndPrincipal: Text} {
        if(daoMetaData.backEndPrincipal == "Null" or daoMetaData.managerCanisterPrincipal == "Null" ){ Debug.trap("backend or manager canister not created") };

        let frontEndPrincipal = switch(daoMetaData.frontEndPrincipal == "Null"){
            case true{
                let settings = ?{
                    controllers = ?[
                        Principal.fromText(daoMetaData.backEndPrincipal), 
                        Principal.fromText(daoMetaData.managerCanisterPrincipal)
                    ];
                    freezing_threshold = ?2_592_000;
                    memory_allocation = ?0;
                    compute_allocation = ?0;
                };
                Cycles.add<system>(3_000_000_000_000);
                let {canister_id} = await ic.create_canister({settings; sender_canister_version = null;});
                Principal.toText(canister_id);
            }; 
            case false{ daoMetaData.frontEndPrincipal };
        };

        try{
            let backendCanisterId = Principal.fromText(daoMetaData.backEndPrincipal);
            let managerCanisterId = Principal.fromText(daoMetaData.managerCanisterPrincipal);
            let managerCanister: Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
            let frontendWasmModule = await managerCanister.getReleaseModule(#Frontend);
            await installCode_(null, frontendWasmModule, Principal.fromText(frontEndPrincipal), #install);
            let uiCanister: AssetCanister.Interface = actor(frontEndPrincipal);

            await uiCanister.grant_permission({ to_principal = managerCanisterId; permission = #Commit; });
            await uiCanister.grant_permission({ to_principal = managerCanisterId; permission = #ManagePermissions; });
            await uiCanister.grant_permission({ to_principal = managerCanisterId; permission = #Prepare; });

            ignore managerCanister.uploadAssetsToFrontendCanister(frontEndPrincipal);
            ignore uiCanister.authorize(backendCanisterId);
            ignore uiCanister.grant_permission({ to_principal = backendCanisterId; permission = #Commit; });
            ignore uiCanister.grant_permission({ to_principal = backendCanisterId; permission = #ManagePermissions; });
            ignore uiCanister.grant_permission({ to_principal = backendCanisterId; permission = #Prepare; });
            return {frontEndPrincipal};
        } catch(_){ return {frontEndPrincipal}; };
    };

    private func refillCanisterCycles(daoMetaData: MainTypes.DaoMetaData_V4, profilesMap : MainTypes.UserProfilesMap_V2) : async () {
        var index = 0;
        let frontendCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData.frontEndPrincipal) });
        let managerCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData.managerCanisterPrincipal)});
        let treasuryCanisterStatus = await ic.canister_status({ canister_id = Principal.fromText(daoMetaData.treasuryCanisterPrincipal)});
        if(frontendCanisterStatus.cycles < 5_000_000_000_000){
            Cycles.add<system>(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(daoMetaData.frontEndPrincipal); });
        };
        if(managerCanisterStatus.cycles < 10_000_000_000_000) {
            Cycles.add<system>(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(daoMetaData.managerCanisterPrincipal); });
        };
        if(treasuryCanisterStatus.cycles < 10_000_000_000_000) {
            Cycles.add<system>(1_000_000_000_000);
            ignore ic.deposit_cycles({ canister_id = Principal.fromText(daoMetaData.treasuryCanisterPrincipal); });
        };
        for((_, {canisterId; approved; }) in profilesMap.entries()){
            let approved_ = switch(approved){ case(?true){ true }; case(_){ false } };
            let {cycles;} = await ic.canister_status({ canister_id = canisterId });
            if(approved_ and cycles < 1_000_000_000_000){
                Cycles.add<system>(250_000_000_000);
                ignore ic.deposit_cycles({ canister_id = canisterId });
            };
            index += 1;
        };
    };

    public func heartBeat(currentCyclesBalance: Nat, daoMetaData : MainTypes.DaoMetaData_V4, profilesMap: MainTypes.UserProfilesMap_V2): 
    async MainTypes.DaoMetaData_V4{
        let managerCanister : Manager.Manager = actor(daoMetaData.managerCanisterPrincipal);
        ignore managerCanister.checkForNewRelease();
        if(currentCyclesBalance > 20_000_000_000_000){ ignore refillCanisterCycles(daoMetaData, profilesMap); };
        let timeLapsed =Time.now() - daoMetaData.lastRecordedTime;
        let timeLapsedInDays : Float = FloatX.divideInt64(Int64.fromInt(timeLapsed), Int64.fromNat64(nanosecondsInADay));
        if(timeLapsedInDays < 1){ return daoMetaData };
        let cyclesBurned : Float = Float.fromInt(daoMetaData.lastRecordedBackEndCyclesBalance - currentCyclesBalance);
        let dailyBurnRate : Nat = Int.abs(Int.max(Float.toInt(cyclesBurned / timeLapsedInDays), 0));
        let updatedCanisterData = {
            daoMetaData with 
            lastRecordedBackEndCyclesBalance = currentCyclesBalance;
            backEndCyclesBurnRatePerDay = dailyBurnRate;
            lastRecordedTime = Time.now();
        };
        return updatedCanisterData;
    };

    public func installCode_ (
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

    public func getProfilesMetaData(profilesMap: MainTypes.UserProfilesMap_V2) : MainTypes.ProfilesMetaData {
        let profilesMapEntries = profilesMap.entries();
        let profilesMapEntriesArray = Iter.toArray(profilesMapEntries);
        let profilesApprovalStatus = Array.map<(Principal, MainTypes.UserProfile_V2), MainTypes.ProfileMetaData>(
            profilesMapEntriesArray, 
            func (x: (Principal, MainTypes.UserProfile_V2)) : MainTypes.ProfileMetaData {
                let (principal, {canisterId; approved; userName}) = x;
                let isApproved = Option.get(approved, false);
                return {
                    approvalStatus = isApproved; 
                    userPrincipal = Principal.toText(principal); 
                    canisterId = Principal.toText(canisterId);
                    userName;
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
        await ic.update_settings({
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
        await ic.update_settings({ canister_id = canisterPrincipal; settings = updatedSettings; sender_canister_version = null;});
    };

    public func toggleSupportMode(daoMetaData: MainTypes.DaoMetaData_V4) : 
    async MainTypes.DaoMetaData_V4{

        let { 
            supportMode; backEndPrincipal; managerCanisterPrincipal; frontEndPrincipal; treasuryCanisterPrincipal
        } = daoMetaData;
        let defaultControllers = [Principal.fromText(backEndPrincipal), Principal.fromText(managerCanisterPrincipal)];
        let supportMode_updated = not supportMode;
        if(supportMode_updated){
            let techSupportPrincipals = [ Support.TechSupportPrincipal1, Support.TechSupportPrincipal2 ];
            ignore addControllers( techSupportPrincipals, Principal.fromText(backEndPrincipal) );
            ignore addControllers( techSupportPrincipals, Principal.fromText(managerCanisterPrincipal) );
            ignore addControllers( techSupportPrincipals, Principal.fromText(treasuryCanisterPrincipal) );
            ignore addControllers( techSupportPrincipals, Principal.fromText(frontEndPrincipal) );
        } else {
            ignore setToDefualtControllerSettings( Principal.fromText(backEndPrincipal), defaultControllers );
            ignore setToDefualtControllerSettings( Principal.fromText(managerCanisterPrincipal), defaultControllers );
            ignore setToDefualtControllerSettings( Principal.fromText(treasuryCanisterPrincipal), defaultControllers );
            ignore setToDefualtControllerSettings( Principal.fromText(frontEndPrincipal), defaultControllers );
        };
        let updatedDaoMetaData: MainTypes.DaoMetaData_V4 = { daoMetaData with supportMode = supportMode_updated; };
        return updatedDaoMetaData;
    };

    public func getAdminMap(daoMetaData: MainTypes.DaoMetaData_V4) : HashMap.HashMap<Text, MainTypes.AdminData>{
        let adminList = HashMap.fromIter<Text, MainTypes.AdminData>(
            Iter.fromArray(daoMetaData.admin), 
            Iter.size(Iter.fromArray(daoMetaData.admin)), 
            Text.equal,
            Text.hash
        );
        return adminList;
    };

    public func addAdmin(principal: Principal, daoMetaData: MainTypes.DaoMetaData_V4) : MainTypes.DaoMetaData_V4 {
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

    public func removeAdmin(principal: Principal, daoMetaData: MainTypes.DaoMetaData_V4) : MainTypes.DaoMetaData_V4 {
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

    public func getIsAdmin(princiapl: Principal, daoMetaData: MainTypes.DaoMetaData_V4) : Bool {
        let adminMap = getAdminMap(daoMetaData);
        let adminData = adminMap.get(Principal.toText(princiapl));
        if(adminData == null){ return false; };
        return true;
    };
}