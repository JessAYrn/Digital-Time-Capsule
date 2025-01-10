import React, {useContext} from "react";
import {Paper} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import ButtonField from "../../Components/Button";
import DataField from "../../Components/DataField";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { fromE8s, round2Decimals, shortenString } from "../../functionsAndConstants/Utils";
import { getUserNeuronContribution, getTotalContributions } from "../../functionsAndConstants/treasuryDataFunctions";
import { AppContext } from "../../Context";
import DisplayNeuron from "./DisplayNeuron";

const PreviewNeuron = (props) => {
    const {neuronData, userPrincipal } = props;
    const [neuronId, {contributions, neuron, neuronInfo}] = neuronData;
    const {setModalProps, setModalIsOpen} = useContext(AppContext)

    const userContribution = getUserNeuronContribution(userPrincipal, contributions);
    const totalContributions = getTotalContributions(contributions);
    const totalStake = round2Decimals(fromE8s(parseInt(neuronInfo?.stake_e8s)));
    const userRemainingStake = round2Decimals(fromE8s(parseInt(neuronInfo.stake_e8s) * parseInt(userContribution.stake_e8s) / totalContributions));
    const totalVotingPower = round2Decimals(fromE8s(parseInt(neuronInfo?.voting_power)));
    const userVotingPower = round2Decimals(fromE8s(parseInt(neuronInfo.voting_power) * parseInt(userContribution.stake_e8s) / totalContributions));
    const totalMaturity = round2Decimals(fromE8s(parseInt(neuron?.maturity_e8s_equivalent)));
    const userMaturity = round2Decimals( fromE8s( parseInt(neuron?.maturity_e8s_equivalent || 0) * ( parseInt(userContribution.stake_e8s)/ (totalContributions || 1) ) ) );

    const viewNeuron = () => {
        setModalProps({
            fullScreen: true,
            components:[
                <DisplayNeuron neuronData={neuronData} userPrincipal={userPrincipal}/>
            ]
        });
        setModalIsOpen(true)
    }


    return (
        <Paper sx={{ width: "100%", height: "300px", display:"flex", justifyContent:"center", alignItems:"center", flexDirection:"column"} }>
            <Grid width={"95%"} paddingBottom={"15px"} paddingTop={0}>
                <DataField
                    label={`ID: `}
                    text={shortenString(neuronId, 10)}
                    buttonIcon={ContentCopyIcon}
                    buttonColor="primary"
                    labelColor="primary"
                    onClick={() => copyText(neuronId)}
                    transparentBackground={true}
                />
                <DataField
                    label={`Stake: `}
                    supertext={`${totalStake} ICP`}
                    text={`(${userRemainingStake} ICP)`}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    onClick={() => {}}
                    transparentBackground={true}
                />
                <DataField
                    label={`Voting Power: `}
                    supertext={`${totalVotingPower} `}
                    text={`(${userVotingPower})`}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    onClick={() => {}}
                    transparentBackground={true}
                />
                <DataField
                    label={`Maturity: `}
                    supertext={`${totalMaturity} ICP`}
                    text={`(${userMaturity} ICP)`}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    onClick={() => {}}
                    transparentBackground={true}
                />
            </Grid>
            <ButtonField
                color={"primary"}
                elevation={24}
                text={"View Neuron"}
                onClick={viewNeuron}
                iconSize={'small'}
            />
        </Paper>
    )
};

export default PreviewNeuron;