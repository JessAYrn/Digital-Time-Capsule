import React, {useState, useContext} from "react";
import MenuField from "../Fields/MenuField";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { PAYLOAD_DATA_TYPES, PROPOSAL_ACTIONS } from "./utils";
import { daysToMonths, hoursToDays, isANumber, principalHasProperFormat, round2Decimals, secondsToHours, toE8s, fromE8s  } from "../../functionsAndConstants/Utils";
import { homePageTypes } from "../../reducers/homePageReducer";
import InputBox from "../Fields/InputBox";
import { Typography } from "@mui/material";
import ButtonField from "../Fields/Button";
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DoneIcon from '@mui/icons-material/Done';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";
import { AppContext } from "../../Context";
import DataField from "../Fields/DataField";

export const NEURON_TOPICS = {
        // The `Unspecified` topic is used as a fallback when
        // following. That is, if no followees are specified for a given
        // topic, the followees for this topic are used instead.
        unspecificed: 0,
        // A special topic by means of which a neuron can be managed by the
        // followees for this topic (in this case, there is no fallback to
        // 'unspecified'). Votes on this topic are not included in the
        // voting history of the neuron (cf., `recent_ballots` in `Neuron`).
        //
        // For proposals on this topic, only followees on the 'neuron
        // management' topic of the neuron that the proposals pertains to
        // are allowed to vote.
        //
        // As the set of eligible voters on this topic is restricted,
        // proposals on this topic have a *short voting period*.
        neuronManagement: 1,
        // All proposals that provide “real time” information about the
        // value of ICP, as measured by an IMF SDR, which allows the NNS to
        // convert ICP to cycles (which power computation) at a rate which
        // keeps their real world cost constant. Votes on this topic are not
        // included in the voting history of the neuron (cf.,
        // `recent_ballots` in `Neuron`).
        //
        // Proposals on this topic have a *short voting period* due to their
        // frequency.
        exchangeRate: 2,
        // All proposals that administer network economics, for example,
        // determining what rewards should be paid to node operators.
        networkEconomics: 3,
        // All proposals that administer governance, for example to freeze
        // malicious canisters that are harming the network.
        governance: 4,
        // All proposals that administer node machines, including, but not
        // limited to, upgrading or configuring the OS, upgrading or
        // configuring the virtual machine framework and upgrading or
        // configuring the node replica software.
        nodeAdmin: 5,
        // All proposals that administer network participants, for example,
        // granting and revoking DCIDs (data center identities) or NOIDs
        // (node operator identities).
        participantManagement: 6,
        // All proposals that administer network subnets, for example
        // creating new subnets, adding and removing subnet nodes, and
        // splitting subnets.
        subnetManagement: 7,
        // Installing and upgrading “system” canisters that belong to the network.
        // For example, upgrading the NNS.
        networkCanisterManagement: 8,
        // Proposals that update KYC information for regulatory purposes,
        // for example during the initial Genesis distribution of ICP in the
        // form of neurons.
        kyc: 9,
        // Topic for proposals to reward node providers.
        nodeProviderRewards: 10,
        // Superseded by SNS_COMMUNITY_FUND.
        //
        // TODO(NNS1-1787): Delete this. In addition to clients wiping this from their
        // memory, I think we'll need Candid support in order to safely delete
        // this. There is no rush to delete this though.
        snsDecentralizationSale: 11,
        // Proposals handling updates of a subnet's replica version.
        // The only proposal in this topic is UpdateSubnetReplicaVersion.
        subnetReplicaVersionManagement: 12,
        // All proposals dealing with blessing and retirement of replica versions.
        replicaVersionManagement: 13,
        // Proposals related to SNS and Community Fund.
        snsAndCommunityFund: 14,
        // Proposals related to the management of API Boundary Nodes
        apiBoundaryNodeManagement: 15,

}

const NEURON_ID_REQUIRED_ACTIONS =[
    PROPOSAL_ACTIONS.SpawnNeuron,
    PROPOSAL_ACTIONS.DisburseNeuron,
    PROPOSAL_ACTIONS.DissolveNeuron,
    PROPOSAL_ACTIONS.FollowNeuron,
    PROPOSAL_ACTIONS.IncreaseDissolveDelay,
    PROPOSAL_ACTIONS.IncreaseNeuron
];

const PRINCIPAL_REQUIRED_ACTIONS = [
    PROPOSAL_ACTIONS.AddAdmin,
    PROPOSAL_ACTIONS.RemoveAdmin,
];

const AMOUNT_PAYLOAD_REQUIRED_ACTIONS = [
    PROPOSAL_ACTIONS.PurchaseCycles,
    PROPOSAL_ACTIONS.CreateNeuron,
    PROPOSAL_ACTIONS.IncreaseNeuron,
];

const PERCENTAGE_PAYLOAD_REQUIRED_ACTIONS = [
    PROPOSAL_ACTIONS.SpawnNeuron,
];

const TOPIC_PAYLOAD_REQUIRED_ACTIONS = [
    PROPOSAL_ACTIONS.FollowNeuron
];

const FOLLOWEE_PAYLOAD_REQUIRED_ACTIONS = [
    PROPOSAL_ACTIONS.FollowNeuron
];

const SECONDS_PAYLOAD_REQUIRED_ACTIONS = [
    PROPOSAL_ACTIONS.IncreaseDissolveDelay
];

const CYCLES_COSTS_ASSOCIATED_WITH_ACTIONS = [
    PROPOSAL_ACTIONS.FollowNeuron,
    PROPOSAL_ACTIONS.IncreaseNeuron,
    PROPOSAL_ACTIONS.SpawnNeuron,
    PROPOSAL_ACTIONS.DisburseNeuron,
    PROPOSAL_ACTIONS.DissolveNeuron,
    PROPOSAL_ACTIONS.IncreaseDissolveDelay,
    PROPOSAL_ACTIONS.FollowNeuron,
    PROPOSAL_ACTIONS.CreateNeuron,
];

const actionReadyToSubmit = (proposalAction, proposalPayload) => {
    let ready = true;
    if(NEURON_ID_REQUIRED_ACTIONS.includes(proposalAction) && !proposalPayload?.neuronId) ready = false;
    if(TOPIC_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction) && !proposalPayload?.topic && proposalPayload?.topic !== NEURON_TOPICS.unspecificed ) ready = false;
    if(FOLLOWEE_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction) && !proposalPayload?.followee) ready = false;
    if(PRINCIPAL_REQUIRED_ACTIONS.includes(proposalAction) && !proposalPayload?.principal) ready = false;
    if(AMOUNT_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction) && !proposalPayload?.amount) ready = false;
    if(PERCENTAGE_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction) && !proposalPayload?.percentage_to_spawn) ready = false;
    if(SECONDS_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction) && !proposalPayload?.additionalDissolveDelaySeconds) ready = false;
    return ready;
};

const CreateProposalForm = (props) => {
    const {
        setModalIsOpen, 
        setModalProps, 
        setIsLoadingModal,
        proposalAction,
        proposalPayload,
    } = props;

    const {  actorState, homePageDispatch, treasuryState, homePageState } = useContext(AppContext);

    let selectedAction = proposalAction;
    let selectedNeuronId = proposalPayload?.neuronId;

    const [proposalAction_, setProposalAction] = useState(proposalAction);
    const [proposalPayload_, setProposalPayload] = useState(proposalPayload);
    const [hasError_1, setHasError_1] = useState(false);

    const onMenuItemClick = (proposalAction) => {
        setProposalPayload({});
        setProposalAction(proposalAction);
    };

    const neuronMenuItemProps = treasuryState.neurons.icp.map(([neuronId, neuronData]) => {
        return {
            text: neuronId,  
            onClick: () => setProposalPayload({ ...proposalPayload_, neuronId: neuronId }),
            selected: neuronId === selectedNeuronId
        }
    });

    const getIncreaseDissolveDelayMenuItemProps = (neuronId) => {
        let neuronData = treasuryState.neurons.icp.find(([neuronId_, neuronData]) => {
            return neuronId_ === neuronId;
        });
        const { neuronInfo } = neuronData[1];
        const {dissolve_delay_seconds} = neuronInfo;
        const secondsInAMonth = 60 * 60 * 24 * 30;
        const maxDissolveDelayInSeconds = secondsInAMonth * 96;
        const maxAdditionalDissolveDelayInSeconds = maxDissolveDelayInSeconds - parseInt(dissolve_delay_seconds);
        
        let increaseDissolveDelayMenuItemProps = [];
        for(let i = 1; i * secondsInAMonth <= maxAdditionalDissolveDelayInSeconds; i++){
            increaseDissolveDelayMenuItemProps.push({
                text: `${ round2Decimals(daysToMonths(hoursToDays(secondsToHours(i * secondsInAMonth)))) } months`,
                onClick: () => setProposalPayload({ ...proposalPayload_, additionalDissolveDelaySeconds: i * secondsInAMonth }),
            });
        };
        return increaseDissolveDelayMenuItemProps;
    };

    const principalsMenuItemProps = homePageState?.canisterData?.profilesMetaData?.map(({userPrincipal}) => {
        return {
            text: userPrincipal,  
            onClick: () => setProposalPayload({ ...proposalPayload_, principal: userPrincipal }),
        }
    });

    const neuronTopicItemProps = Object.keys(NEURON_TOPICS).map((topicName) => {
        return {text: topicName,  onClick: () => setProposalPayload({...proposalPayload_, topicName, topic: NEURON_TOPICS[topicName]})};
    });

    const mainMenuItemProps = [
        { text: PROPOSAL_ACTIONS.PurchaseCycles, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.PurchaseCycles), selected: selectedAction === PROPOSAL_ACTIONS.PurchaseCycles},
        { text: PROPOSAL_ACTIONS.LoadUpgrades, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.LoadUpgrades), selected: selectedAction === PROPOSAL_ACTIONS.LoadUpgrades},
        { text: PROPOSAL_ACTIONS.InstallUpgrades, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.InstallUpgrades), selected: selectedAction === PROPOSAL_ACTIONS.InstallUpgrades},
        { text: PROPOSAL_ACTIONS.AddAdmin, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.AddAdmin), selected: selectedAction === PROPOSAL_ACTIONS.AddAdmin},
        { text: PROPOSAL_ACTIONS.RemoveAdmin, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.RemoveAdmin), selected: selectedAction === PROPOSAL_ACTIONS.RemoveAdmin},
        { text: PROPOSAL_ACTIONS.DisburseNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DisburseNeuron), selected: selectedAction === PROPOSAL_ACTIONS.DisburseNeuron},
        { text: PROPOSAL_ACTIONS.DissolveNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.DissolveNeuron), selected: selectedAction === PROPOSAL_ACTIONS.DissolveNeuron},
        { text: PROPOSAL_ACTIONS.SpawnNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.SpawnNeuron), selected: selectedAction === PROPOSAL_ACTIONS.SpawnNeuron},
        { text: PROPOSAL_ACTIONS.FollowNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.FollowNeuron), selected: selectedAction === PROPOSAL_ACTIONS.FollowNeuron},
        { text: PROPOSAL_ACTIONS.IncreaseDissolveDelay, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.IncreaseDissolveDelay), selected: selectedAction === PROPOSAL_ACTIONS.IncreaseDissolveDelay},
        { text: PROPOSAL_ACTIONS.CreateNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.CreateNeuron), selected: selectedAction === PROPOSAL_ACTIONS.CreateNeuron},
        { text: PROPOSAL_ACTIONS.IncreaseNeuron, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.IncreaseNeuron), selected: selectedAction === PROPOSAL_ACTIONS.IncreaseNeuron},
        { text: PROPOSAL_ACTIONS.ToggleSupportMode, onClick: ()  => onMenuItemClick(PROPOSAL_ACTIONS.ToggleSupportMode), selected: selectedAction === PROPOSAL_ACTIONS.ToggleSupportMode},
    ];

    const onChange_payload = (payload_, property, format) => {
        setProposalPayload({...proposalPayload_, ...payload_});
        if(format === PAYLOAD_DATA_TYPES.principal) setHasError_1(!principalHasProperFormat(payload_[property]));
        if(format === PAYLOAD_DATA_TYPES.nat) setHasError_1(!isANumber(payload_[property][0] || payload_[property]));
        if(proposalAction_ === PROPOSAL_ACTIONS.PurchaseCycles) setHasError_1(payload_[property] > fromE8s(treasuryState.daoWalletBalance) || payload_[property] < 0);
    };
    const modalButton_close = [
        {Component: ButtonField,
        props: {
            active: true,
            text: "Close",
            Icon: CloseIcon,
            onClick: () => setModalIsOpen(false)
        }}
    ];

    const onSubmitProposal = async () => {
        setIsLoadingModal(true);
        let payload = {...proposalPayload_};
        if(payload.amount) payload.amount = toE8s(payload.amount);
        if(payload.percentage_to_spawn) payload.percentage_to_spawn = parseInt(payload.percentage_to_spawn);
        if(payload.additionalDissolveDelaySeconds) payload.additionalDissolveDelaySeconds = parseInt(payload.additionalDissolveDelaySeconds);
        if(payload.neuronId) payload.neuronId = BigInt(payload.neuronId);
        if(payload.followee) payload.followee = BigInt(payload.followee);
        let action = {[proposalAction_]: payload};
        let result = await actorState.backendActor.createProposal(action);
        if("err" in result){
            let errorMessagArray = Object.keys(result.err);
            let errorMessage = errorMessagArray[0];
            setModalProps({
                bigText: `Error: ${errorMessage}`,
                smallText: "You must make a contribution to the treasury before being able to create proposals",
                Icon: ErrorOutlineIcon,
                components: modalButton_close
            });
        } else{
            let updatedProposals = result.ok;
            homePageDispatch({
                actionType: homePageTypes.SET_PROPOSALS_DATA,
                payload: updatedProposals
            });
            setModalIsOpen(false);
        }
        setModalIsOpen(false);
        setIsLoadingModal(false);
    };



    return (
        <Grid 
        columns={12}
        xs={12} 
        rowSpacing={0} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        flexDirection={"column"} 
        >
            <MenuField
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"left"}
                active={true}
                color={"custom"}
                label={"Proposal Type"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={mainMenuItemProps}
            />
            <Typography varient={"h6"} color={"#bdbdbd"}> {proposalAction_} </Typography>
            {
                (proposalAction_ ===  PROPOSAL_ACTIONS.IncreaseNeuron || proposalAction_ === PROPOSAL_ACTIONS.CreateNeuron) &&
                <DataField 
                label={"Available Balance: "}
                text={`${fromE8s(treasuryState.userTreasuryData?.balances.icp || 0) } ICP`}
                isLoading={!treasuryState.dataHasBeenLoaded}
                disabled={true}
                />
            }
            {
                CYCLES_COSTS_ASSOCIATED_WITH_ACTIONS.includes(proposalAction_) &&
                <DataField
                    label={"Cycles Consumption: "}
                    text={"~ 0.25 T"}
                    isLoading={!treasuryState.dataHasBeenLoaded}
                    disabled={true}
                />
            }
            {
                proposalAction_ ===  PROPOSAL_ACTIONS.PurchaseCycles &&
                <DataField 
                label={"Available Balance: "}
                text={`${fromE8s(treasuryState.daoWalletBalance)} ICP`}
                isLoading={!treasuryState.dataHasBeenLoaded}
                disabled={true}
                />
            }
            { 
                proposalAction_ && NEURON_ID_REQUIRED_ACTIONS.includes(proposalAction_) && 
                <>
                    <MenuField
                        xs={8}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"left"}
                        active={true}
                        color={"custom"}
                        label={"Neuron To Configure"}
                        MenuIcon={KeyboardArrowDownIcon}
                        menuItemProps={neuronMenuItemProps}
                    />
                    {proposalPayload_?.neuronId && <Typography varient={"h6"} color={"#bdbdbd"}> {proposalPayload_.neuronId} </Typography>}
                </>
            }
            { 
                proposalAction_ && TOPIC_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction_) && 
                <>
                    <MenuField
                        xs={8}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"left"}
                        active={true}
                        color={"custom"}
                        label={"Topic"}
                        MenuIcon={KeyboardArrowDownIcon}
                        menuItemProps={neuronTopicItemProps}
                    />
                    {proposalPayload_?.topicName && <Typography varient={"h6"} color={"#bdbdbd"}> {proposalPayload_?.topicName} </Typography>}
                </>
            }
            {
                proposalAction_ && FOLLOWEE_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction_) &&
                <InputBox
                    hasError={hasError_1}
                    label={"Neuron Id to Follow"}
                    rows={"1"}
                    onChange={(neuronId) => onChange_payload({followee: neuronId}, "followee", PAYLOAD_DATA_TYPES.nat)}
                    value={proposalPayload_?.followee}
                    format={INPUT_BOX_FORMATS.numberFormat}
                />
            }
            {
                proposalAction_ && PRINCIPAL_REQUIRED_ACTIONS.includes(proposalAction_) &&
                <>
                    <MenuField
                        xs={8}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"left"}
                        active={true}
                        color={"custom"}
                        label={`Principal to ${proposalAction_ === PROPOSAL_ACTIONS.AddAdmin ? "Add" : "Remove"}`}
                        MenuIcon={KeyboardArrowDownIcon}
                        menuItemProps={principalsMenuItemProps}
                    />
                    {proposalPayload_?.principal && <Typography varient={"h6"} color={"#bdbdbd"}> {proposalPayload_?.principal} </Typography>}
                </>
            }
            {
                proposalAction_ && AMOUNT_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction_) &&
                    <InputBox
                        hasError={hasError_1}
                        label={"Amount "}
                        rows={"1"}
                        onChange={(amount) => onChange_payload({amount}, "amount", PAYLOAD_DATA_TYPES.nat)}
                        value={proposalPayload_?.amount}
                        format={INPUT_BOX_FORMATS.numberFormat}
                    />
            }
            {
                proposalAction_ && PERCENTAGE_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction_) &&
                <InputBox
                    hasError={hasError_1}
                    label={"Percent to Spawn"}
                    rows={"1"}
                    onChange={(percentage_to_spawn) => onChange_payload({percentage_to_spawn},"percentage_to_spawn", PAYLOAD_DATA_TYPES.nat)}
                    value={proposalPayload_?.percentage_to_spawn}
                    format={INPUT_BOX_FORMATS.numberFormat}
                />
            }
            {
                proposalAction_ && SECONDS_PAYLOAD_REQUIRED_ACTIONS.includes(proposalAction_) && proposalPayload_.neuronId &&

                <>
                    <MenuField
                        xs={8}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"left"}
                        active={true}
                        color={"custom"}
                        label={"Increase Dissolve Delay By"}
                        MenuIcon={KeyboardArrowDownIcon}
                        menuItemProps={getIncreaseDissolveDelayMenuItemProps(proposalPayload_.neuronId)}
                    />
                    {proposalPayload_?.additionalDissolveDelaySeconds && 
                    <Typography varient={"h6"} color={"#bdbdbd"}> 
                        { daysToMonths(hoursToDays(secondsToHours(proposalPayload_?.additionalDissolveDelaySeconds))) } months
                    </Typography>}
                </>
            }
            { proposalAction_ && actionReadyToSubmit(proposalAction_, proposalPayload_) && !hasError_1 &&
                <ButtonField
                    Icon={DoneIcon}
                    active={true}
                    text={'Submit proposal'}
                    onClick={onSubmitProposal}
                />
            }
        </Grid>
    )

};

export default CreateProposalForm;