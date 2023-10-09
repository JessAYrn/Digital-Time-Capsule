export const PROPOSAL_ACTIONS = {
    AddAdmin: "AddAdmin",
    RemoveAdmin: "RemoveAdmin",
    DepositIcpToTreasury: "DepositIcpToTreasury",
    DepositIcpToNeuron: "DepositIcpToNeuron",
    UpgradeApp: "UpgradeApp",
    DissolveIcpNeuron: "DissolveIcpNeuron",
    FollowIcpNeuron: "FollowIcpNeuron",
    SpawnIcpNeuron: "SpawnIcpNeuron",
    DispurseIcpNeuron: "DispurseIcpNeuron",
    ToggleCyclesSaverMode: "ToggleCyclesSaverMode",
    PurchaseCycles: "PurchaseCycles"
};

export const PAYLOAD_DATA_TYPES = {
    text: "text",
    nat64: "nat64"
};

export const getProposalType = (action) => {
    for(const type in PROPOSAL_ACTIONS){
        if(type in action) return type;
    };
    return null;
};
