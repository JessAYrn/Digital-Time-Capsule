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

export const CYCLES_COSTS_ASSOCIATED_WITH_ACTIONS = [
    PROPOSAL_ACTIONS.FollowNeuron,
    PROPOSAL_ACTIONS.IncreaseNeuron,
    PROPOSAL_ACTIONS.SpawnNeuron,
    PROPOSAL_ACTIONS.DisburseNeuron,
    PROPOSAL_ACTIONS.DissolveNeuron,
    PROPOSAL_ACTIONS.IncreaseDissolveDelay,
    PROPOSAL_ACTIONS.FollowNeuron,
    PROPOSAL_ACTIONS.CreateNeuron,
];

export const VOTING_POWER_REDISTRIBUTION_ACTIONS = [
    PROPOSAL_ACTIONS.IncreaseNeuron,
    PROPOSAL_ACTIONS.IncreaseDissolveDelay,
    PROPOSAL_ACTIONS.CreateNeuron

];

export const getProposalType = (action) => {
    for(const type in PROPOSAL_ACTIONS){
        if(type in action) return type;
    };
    return null;
};

export const MAX_DISSOLVE_DELAY_IN_SECONDS = 252288000;

export const MIN_DISSOLVE_DELAY_FOR_REWARDS_IN_SECONDS = 15768000;

export const MAX_AGE_BONUS_SECONDS = 126230400;

export const getHypotheticalVotingPowerIncreaseFromStake = (neuronData, stakeIncrease, recipient) => {
    let additionalVotingPower = stakeIncrease;
    if(!neuronData) return [[recipient, {additionalVotingPower}]];
    const [_, {neuronInfo}] = neuronData;
    let {stake_e8s: neuronTotalStake, voting_power: neuronTotalVotingPower} = neuronInfo;
    const votingPowerBonusMultipllier = neuronTotalVotingPower / neuronTotalStake;
    additionalVotingPower *= votingPowerBonusMultipllier;
    return [[recipient, {additionalVotingPower}]]
};

export const getHypotheticalVotingPowerIncreaseFromIncreasedDissolveDelay = (neuronData, additionalDissolveDelaySeconds = 0) => {
    const {contributions, neuronInfo} = neuronData;
    const {dissolve_delay_seconds, age_seconds} = neuronInfo;
    let hypotheticalVotingPowerBonusMultipllier = 1
    const ageBonus = 1 + 0.25 * parseInt(age_seconds) / MAX_AGE_BONUS_SECONDS;
    let hypotheticalDissolveDelay = parseInt(dissolve_delay_seconds) + parseInt(additionalDissolveDelaySeconds);
    let rewardsMultiplierRange = MAX_DISSOLVE_DELAY_IN_SECONDS - MIN_DISSOLVE_DELAY_FOR_REWARDS_IN_SECONDS;
    let hypotheticalElibleSecondsWithinRange = hypotheticalDissolveDelay - MIN_DISSOLVE_DELAY_FOR_REWARDS_IN_SECONDS;
    let hypotheticalDissolveDelayBonusMultiplier = 1 + (hypotheticalElibleSecondsWithinRange / rewardsMultiplierRange);
    if(hypotheticalElibleSecondsWithinRange > 0) hypotheticalVotingPowerBonusMultipllier =  hypotheticalDissolveDelayBonusMultiplier * ageBonus;
    const additionalVotingPowersArray = contributions.map(([recipient, {stake_e8s, voting_power}]) => {
        const additionalVotingPower = parseInt(stake_e8s) * hypotheticalVotingPowerBonusMultipllier - parseInt(voting_power);
        return [recipient, {additionalVotingPower}];
    });
    return additionalVotingPowersArray
}
