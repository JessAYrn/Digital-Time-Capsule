import React, {useContext, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import AddIcon from '@mui/icons-material/Add';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import LockIcon from '@mui/icons-material/Lock';
import DataField from "../../../../components/DataField";
import { PROPOSAL_ACTIONS } from "../../../../proposals/utils";
import { fromE8s, round2Decimals, secondsToHours, hoursToDays, daysToMonths, getDateAsString } from "../../../../functionsAndConstants/Utils";
import { getTotalContributions, getUserNeuronContribution } from "../../../../functionsAndConstants/treasuryDataFunctions";
import { AppContext } from "../../../../Context";
import Typography from "@mui/material/Typography";
import { Divider } from "@mui/material";
import ButtonField from "../../../../components/Button";
import { CONTRAST_COLOR, DIVIDER_SX, WHITE_COLOR } from "../../../../Theme";



const NeuronStates = { locked: 1, dissolving: 2, unlocked: 3, spawning: 4 };

const RenderNeuronValues = (props) => {

    const {neuronId, neuronData, openProposalForm} = props;

    const {contributions, neuron, neuronInfo} = neuronData;
    const { treasuryState } = useContext(AppContext);

    const {dissolveDelay, userStake, userVotingPower, userMaturity, neuronStake, neuronVotingPower, neuronMaturity, neuronState, neuronStateIcon, dateDissolved} = useMemo(() => {
        const {dissolve_state} = neuron;
        const {WhenDissolvedTimestampSeconds} = dissolve_state;
        const dateDissolved = getDateAsString(WhenDissolvedTimestampSeconds * 1000);
        if(!neuronInfo) return {dateDissolved};
        
        const dissolveDelay = { units:  "hours", value: secondsToHours(parseInt(neuronInfo?.dissolve_delay_seconds || 0)) };
        if(dissolveDelay.value > 24){ dissolveDelay.value = hoursToDays(dissolveDelay.value); dissolveDelay.units = "days";};
        if(dissolveDelay.value > 30){ dissolveDelay.value = daysToMonths(dissolveDelay.value); dissolveDelay.units = "months";};

        const userPrincipal = treasuryState?.userPrincipal;
        const userContribution = getUserNeuronContribution(userPrincipal, contributions);
        const totalContributions = getTotalContributions(contributions);
        const userStake = round2Decimals(fromE8s(parseInt(neuronInfo.stake_e8s) * parseInt(userContribution.stake_e8s) / totalContributions));
        const neuronStake = round2Decimals(fromE8s(parseInt(neuronInfo.stake_e8s)));
        const userVotingPower = round2Decimals(fromE8s(parseInt(neuronInfo.voting_power) * parseInt(userContribution.stake_e8s) / totalContributions));
        const neuronVotingPower = round2Decimals(fromE8s(parseInt(neuronInfo.voting_power)));
        const userMaturity = round2Decimals(fromE8s(parseInt(neuron?.maturity_e8s_equivalent || 0) * (parseInt(userContribution.stake_e8s)/parseInt(totalContributions || 1))));
        const neuronMaturity = round2Decimals(fromE8s(parseInt(neuron?.maturity_e8s_equivalent || 0)));

        let neuronState = "unlocked";
        let neuronStateIcon = LockOpenIcon;

        if(neuronInfo?.state === NeuronStates.locked)  {neuronState = "Locked"; neuronStateIcon = LockIcon;}
        else if(neuronInfo?.state === NeuronStates.dissolving)  {neuronState = "Dissolving"; neuronStateIcon = HourglassTopIcon;}
        else if(neuronInfo?.state === NeuronStates.unlocked)  {neuronState = "unlocked"; neuronStateIcon = LockOpenIcon;}
        else if(neuronInfo?.state === NeuronStates.spawning)  {neuronState = "Spawning"; neuronStateIcon = HistoryToggleOffIcon;}

        return {dissolveDelay, userStake, userVotingPower, userMaturity, neuronStake, neuronVotingPower, neuronMaturity, neuronState, neuronStateIcon, dateDissolved};
    },[]);


    return (
        neuronInfo ? 
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} flexDirection={"column"} padding={0} width={"100%"}>

            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} flexDirection={"column"}>
                <DataField transparentBorder={true} gridSx={{padding: "0px"}} label={"Neuron Voting Power:"} text={neuronVotingPower} buttonColor={WHITE_COLOR} labelColor={WHITE_COLOR} transparentBackground={true}/>
                <DataField transparentBorder={true} gridSx={{padding: "0px"}} label={"Your Voting Power:"} text={userVotingPower} buttonColor={WHITE_COLOR} labelColor={WHITE_COLOR} transparentBackground={true}/>
            </Grid>

            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />

            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"25px"} flexDirection={"column"}>
                <DataField transparentBorder={true} gridSx={{padding: "0px"}} label={"Neuron Stake:"} text={`${neuronStake} ICP`} buttonColor={WHITE_COLOR} labelColor={WHITE_COLOR} transparentBackground={true}/>
                <DataField transparentBorder={true} gridSx={{padding: "0px"}} label={"Your Stake:"} text={`${userStake} ICP`} buttonColor={WHITE_COLOR} labelColor={WHITE_COLOR} transparentBackground={true}/>
            </Grid>

            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />

            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} paddingTop={"25px"} flexDirection={"column"}>
                <DataField transparentBorder={true} gridSx={{padding: "0px"}} label={"Neuron Maturity:"} text={`${neuronMaturity} ICP`} buttonColor={WHITE_COLOR} labelColor={WHITE_COLOR} transparentBackground={true}/>
                <DataField transparentBorder={true} gridSx={{padding: "0px"}} label={"Your Maturity:"} text={`${userMaturity} ICP`} buttonColor={WHITE_COLOR} labelColor={WHITE_COLOR} transparentBackground={true}/>
            </Grid>

            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />

            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} flexDirection={"column"}>
                <DataField 
                transparentBorder={true}
                gridSx={{padding: "0px"}}
                label={"Dissolve Delay:"} 
                text={`${dissolveDelay.value} ${dissolveDelay.units}`} 
                buttonColor="primary" 
                labelColor="primary" 
                iconSize
                transparentBackground={true}
                buttonIcon={HourglassTopIcon}
                />
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={6} padding={0} >
                    <ButtonField
                        gridSx={{padding: "0px", width: "100%", marginTop: "20px"}}
                        buttonGridSx={{width: "100%"}}
                        text={"Increase Delay"} 
                        color={CONTRAST_COLOR}
                        Icon={AddIcon}
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.IncreaseDissolveDelay,
                            proposalPayload: {neuronId}
                        })}
                    />
                </Grid>
            </Grid>


            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />

            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={12} padding={0} marginTop={"20px"} flexDirection={"column"}>
                <DataField 
                transparentBorder={true}
                gridSx={{padding: "0px"}}
                label={"Neuron State:"} 
                text={neuronState} 
                buttonColor={WHITE_COLOR} 
                labelColor={WHITE_COLOR} 
                buttonIcon={neuronStateIcon}
                transparentBackground={true}
                onClick={() => {}}
                />

                {NeuronStates.locked === neuronInfo?.state &&  
                    <ButtonField
                        gridSx={{padding: "0px", width: "100%", marginTop: "20px"}}
                        buttonGridSx={{width: "100%"}}
                        text={"Dissolve Neuron"} 
                        color={CONTRAST_COLOR}
                        Icon={HourglassTopIcon}
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.DissolveNeuron,
                            proposalPayload: {neuronId}
                        })}
                    />
                }
                {NeuronStates.unlocked === neuronInfo?.state &&  
                    <ButtonField
                        gridSx={{padding: "0px", width: "100%", marginTop: "20px"}}
                        buttonGridSx={{width: "100%"}}
                        text={"Disperse Neuron"} 
                        color={CONTRAST_COLOR}
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.DisburseNeuron,
                                proposalPayload: {neuronId}
                            })}
                    />
                }
            </Grid>
                
        </Grid> : 
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} flexDirection={"column"} padding={0} width={"100%"}>
            <Typography >Date Dissolved: {dateDissolved}</Typography>
        </Grid>
    );
};

export default RenderNeuronValues;