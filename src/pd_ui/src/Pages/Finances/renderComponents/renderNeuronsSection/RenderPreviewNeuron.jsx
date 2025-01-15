import React, {useContext, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import ButtonField from "../../../../components/Button";
import DataField from "../../../../components/DataField";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fromE8s, round2Decimals, shortenString, copyText } from "../../../../functionsAndConstants/Utils";
import { getUserNeuronContribution, getTotalContributions } from "../../../../functionsAndConstants/treasuryDataFunctions";
import RenderNeuron from "./RenderNeuron";
import { AppContext } from "../../../../Context";
import {  CONTRAST_COLOR, WHITE_COLOR } from "../../../../Theme";
import { PROPOSAL_ACTIONS } from "../../../../proposals/utils";
import CreateProposalForm from "../../../../proposals/CreateProposalForm";
import { Typography } from "@mui/material";

const PreviewNeuron = (props) => {
    const {neuronData, neuronId } = props;
    const {contributions, neuron, neuronInfo} = neuronData;
    const {setModalProps, setModalIsOpen, treasuryState} = useContext(AppContext)
    

    const {totalStake, userStake, totalVotingPower, userVotingPower, totalMaturity, userMaturity} = useMemo(() => {

        const userPrincipal = treasuryState.userPrincipal;

        const userContribution = getUserNeuronContribution(userPrincipal, contributions);
        const totalContributions = getTotalContributions(contributions);
        const totalStake = round2Decimals(fromE8s(parseInt(neuronInfo?.stake_e8s)));
        const userStake = round2Decimals(fromE8s(parseInt(neuronInfo.stake_e8s) * parseInt(userContribution.stake_e8s) / totalContributions));
        const totalVotingPower = round2Decimals(fromE8s(parseInt(neuronInfo?.voting_power)));
        const userVotingPower = round2Decimals(fromE8s(parseInt(neuronInfo.voting_power) * parseInt(userContribution.stake_e8s) / totalContributions));
        const totalMaturity = round2Decimals(fromE8s(parseInt(neuron?.maturity_e8s_equivalent)));
        const userMaturity = round2Decimals( fromE8s( parseInt(neuron?.maturity_e8s_equivalent || 0) * ( parseInt(userContribution.stake_e8s)/ (totalContributions || 1) ) ) );

        return {userContribution, totalContributions, totalStake, userStake, totalVotingPower, userVotingPower, totalMaturity, userMaturity}
    }, []);

    const onViewNeuron = () => {
        setModalProps({
            fullScreen: true,
            headerComponent: <ButtonField transparentBorder={true} Icon={ContentCopyIcon} transparentBackground={true} text={neuronId} onClick={() => copyText(neuronId)} />,
            components:[
                <RenderNeuron neuronData={neuronData} neuronId={neuronId}/>
            ]
        });
        setModalIsOpen(true)
    }

    const onStake = () => {
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography variant="h6">Create Proposal</Typography>,
            components:[
                <CreateProposalForm proposalAction={PROPOSAL_ACTIONS.IncreaseNeuron} proposalPayload={{neuronId}}/>
            ]
        });
        setModalIsOpen(true)
    };

    return (
        
        <Grid width={"95%"} paddingBottom={"15px"} paddingTop={0}>
            <DataField
                label={`ID: `}
                text={shortenString(neuronId, 10)}
                buttonIcon={ContentCopyIcon}
                buttonColor={WHITE_COLOR}
                onClick={() => copyText(neuronId)}
                transparentBackground={true}
                transparentBorder={true}
            />
            <DataField
                label={`Stake: `}
                supertext={`${totalStake} ICP`}
                text={`(${userStake} ICP)`}
                buttonColor={WHITE_COLOR}
                labelColor={WHITE_COLOR}
                disabled={true}
                onClick={() => {}}
                transparentBackground={true}
                transparentBorder={true}
            />
            <DataField
                label={`Voting Power: `}
                supertext={`${totalVotingPower} `}
                text={`(${userVotingPower})`}
                buttonColor={WHITE_COLOR}
                labelColor={WHITE_COLOR}
                disabled={true}
                onClick={() => {}}
                transparentBackground={true}
                transparentBorder={true}
            />
            <DataField
                label={`Maturity: `}
                supertext={`${totalMaturity} ICP`}
                text={`(${userMaturity} ICP)`}
                buttonColor={WHITE_COLOR}
                labelColor={WHITE_COLOR}
                disabled={true}
                onClick={() => {}}
                transparentBackground={true}
                transparentBorder={true}
            />
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                <Grid xs={6} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                    <ButtonField
                        color={CONTRAST_COLOR}
                        gridSx={{width: "115px", backgroundColor: WHITE_COLOR}}
                        elevation={24}
                        text={"Stake"}
                        onClick={onStake}
                        iconSize={'small'}
                    />
                </Grid>
                <Grid xs={6} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                    <ButtonField
                        color={CONTRAST_COLOR}
                        gridSx={{width: "115px"}}
                        elevation={24}
                        text={"View"}
                        onClick={onViewNeuron}
                        iconSize={'small'}
                    />
                </Grid>
            </Grid>
        </Grid>
    )
};

export default PreviewNeuron;