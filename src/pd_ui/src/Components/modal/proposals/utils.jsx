export const PROPOSAL_ACTIONS = {
    AddAdmin: "AddAdmin" ,
    RemoveAdmin: "RemoveAdmin" ,
    InstallUpgrades: "InstallUpgrades",
    CreateFundingCampaign: "CreateFundingCampaign",
    CancelFundingCampaign: "CancelFundingCampaign",
    CreateNeuron: "CreateNeuron",
    IncreaseNeuron: "IncreaseNeuron",
    PurchaseCycles: "PurchaseCycles",
    SpawnNeuron: "SpawnNeuron",
    DisburseNeuron: "DisburseNeuron",
    DissolveNeuron: "DissolveNeuron",
    IncreaseDissolveDelay: "IncreaseDissolveDelay",
    FollowNeuron: "FollowNeuron",
    ToggleSupportMode: "ToggleSupportMode",
    WithdrawFromMultiSigWallet: "WithdrawFromMultiSigWallet",
    SetCostToEnterDao: "SetCostToEnterDao",
    TogglePrivacySetting: "TogglePrivacySetting"
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
