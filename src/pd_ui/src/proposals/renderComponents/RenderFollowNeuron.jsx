import React ,{useState, useContext, useEffect} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import MenuField from '../../components/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { AppContext } from '../../Context';
import { NEURON_TOPICS } from '../../proposals/CreateProposalForm';
import { Typography } from '@mui/material';
import InputBox from '../../components/InputBox';
import { INPUT_BOX_FORMATS } from '../../functionsAndConstants/Constants';
import DoneIcon from '@mui/icons-material/Done';
import ButtonField from '../../components/Button';
import { CONTRAST_COLOR, DIVIDER_SX, BACKGROUND_COLOR } from '../../Theme';
import { Divider } from '@mui/material';

export const NEURON_TOPICS = {
    // The `Unspecified` topic is used as a fallback when
    // following. That is, if no followees are specified for a given
    // topic, the followees for this topic are used instead.
    unspecified: 0,
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

};


const FollowNeuron = (props) => {
    const {onSubmitProposal, payload, action, disabled} = props;
    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId?.toString());
    const [topicName, setTopicName] = useState(Object.keys(NEURON_TOPICS).find((key) => NEURON_TOPICS[key] === payload?.topic));
    const [followee, setFollowee] = useState(payload?.followee?.toString());
    const [hasError, setHasError] = useState(!disabled);

    const {treasuryState} = useContext(AppContext);

    const neuronMenuItemProps = treasuryState?.neurons?.icp?.filter(([neuronId, {neuronInfo}]) => {
        return !!neuronInfo;
    }).map(([neuronId, neuronData]) => {
        return {
            text: neuronId,  
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

    const neuronTopicItemProps = Object.keys(NEURON_TOPICS).filter(
        (topicName_) => { return NEURON_TOPICS[topicName_] !== NEURON_TOPICS.neuronManagement }
    ).map(
        (topicName_) => { return {text: topicName_,  onClick: () => setTopicName(topicName_) };
    });

    const submitProposal = async () => {
        await onSubmitProposal({[action]: {neuronId: BigInt(selectedNeuronId), topic: NEURON_TOPICS[topicName], followee: BigInt(followee)}});
    };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                disabled={disabled}
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={CONTRAST_COLOR}
                label={"Neuron To Configure"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={neuronMenuItemProps}
            />
            {selectedNeuronId && 
                <>
                    <Typography varient={"h6"} color={"#bdbdbd"}> {selectedNeuronId} </Typography>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <MenuField
                        disabled={disabled}
                        xs={8}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        color={CONTRAST_COLOR}
                        label={"Topic"}
                        MenuIcon={KeyboardArrowDownIcon}
                        menuItemProps={neuronTopicItemProps}
                    />
               
                    { topicName &&
                        <>
                            <Typography varient={"h6"} color={"#bdbdbd"}> {topicName} </Typography>
                            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                            <InputBox
                                disabled={disabled}
                                xs={12}
                                width={"100%"}
                                hasError={hasError}
                                label={"Neuron Id to Follow"}
                                rows={1}
                                onChange={(e) => { 
                                    setHasError(!e.target.value); 
                                    setFollowee(e.target.value)
                                }}
                                value={followee}
                                allowNegative={false}
                                maxDecimalPlaces={0}
                                format={INPUT_BOX_FORMATS.numberFormat}
                            />
                        
                            { !hasError && !disabled &&
                                <>
                                    <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} bottom={"10px"} width={"100%"} >
                                        <ButtonField
                                            disabled={disabled}
                                            Icon={DoneIcon}
                                            color={BACKGROUND_COLOR}
                                            gridSx={{ width: "230px", backgroundColor: CONTRAST_COLOR }}
                                            text={'Submit Proposal'}
                                            onClick={submitProposal}
                                        />
                                    </Grid>
                                </>
                            }
                        </>
                    }
                </>
            }
        </Grid>
    );
};

export default FollowNeuron;