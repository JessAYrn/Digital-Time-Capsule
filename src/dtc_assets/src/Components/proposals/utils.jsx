export const PROPOSAL_ACTIONS = {
    AddAdmin: "AddAdmin" ,
    RemoveAdmin: "RemoveAdmin" ,
    LoadUpgrades: "LoadUpgrades",
    InstallUpgrades: "InstallUpgrades",
    CreateNeuron: "CreateNeuron",
    IncreaseNeuron: "IncreaseNeuron",
    PurchaseCycles: "PurchaseCycles",
    SplitNeuron: "SplitNeuron",
    SpawnNeuron: "SpawnNeuron",
    DisburseNeuron: "DisburseNeuron",
    DissolveNeuron: "DissolveNeuron",
    IncreaseDissolveDelay: "IncreaseDissolveDelay",
    FollowNeuron: "FollowNeuron",
    ToggleSupportMode: "ToggleSupportMode",
};

export const TREASURY_ACTIONS = {
    DepositIcpToTreasury: "DepositIcpToTreasury",
    WithdrawIcpFromTreasury: "WithdrawIcpFromTreasury"
};

export const PAYLOAD_DATA_TYPES = {
    principal: "principal",
    nat: "nat"
};

export const getProposalType = (action) => {
    for(const type in PROPOSAL_ACTIONS){
        if(type in action) return type;
    };
    return null;
};
