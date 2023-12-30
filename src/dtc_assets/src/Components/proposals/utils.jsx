export const PROPOSAL_ACTIONS = {
    AddAdmin: "AddAdmin",
    RemoveAdmin: "RemoveAdmin",
    UpgradeApp: "UpgradeApp",
    DissolveIcpNeuron: "DissolveIcpNeuron",
    FollowIcpNeuron: "FollowIcpNeuron",
    SpawnIcpNeuron: "SpawnIcpNeuron",
    DispurseIcpNeuron: "DispurseIcpNeuron",
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
