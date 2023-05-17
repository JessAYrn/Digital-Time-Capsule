import JournalTypes "../Journal/journal.types";
import MainTypes "types";
import Manager "../Manager/Manager";
import WasmStore "../Manager/WasmStore";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

module{

    // public func getNewlyUnlockedJournalEntries() : async [Notification]{};

    public func notifyOfNewStableRelease(canisterData: MainTypes.CanisterData, notifications: MainTypes.Notifications): 
    async [MainTypes.Notification]{
        let managerCanister : Manager.Manager = actor(canisterData.managerCanisterPrincipal);
        let wasmStore: WasmStore.Interface = actor(WasmStore.wasmStoreCanisterId);
        let currentReleaseVersion = await managerCanister.getCurrentReleaseVersion();
        let nextStableVersion = await wasmStore.getNextStableRelease(currentReleaseVersion);
        let buffer = Buffer.fromArray<MainTypes.Notification>(notifications);
        if(nextStableVersion > nextStableVersion){
            let text = Text.concat("New Stable Version Availabe: Version #", Nat.toText(nextStableVersion));
            buffer.insert(0, {text});
        };
        return buffer.toArray();
    };

};