import React, {useState, useContext, useEffect, useMemo} from 'react';
import MenuField from '../../components/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { AppContext } from '../../Context';
import ButtonField from '../../components/Button';
import { Typography } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../components/InputBox';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { INPUT_BOX_FORMATS, CHART_TYPES, GRAPH_DISPLAY_LABELS } from '../../functionsAndConstants/Constants';
import { getHypotheticalVotingPowerIncreaseFromIncreasedDissolveDelay } from '../../proposals/utils';
import Graph, { getLabelsAndDataSetsInChartFormat, sortAndReduceDataMapArray } from '../../components/Chart';
import { daysToSeconds, fromE8s, secondsToDays } from '../../functionsAndConstants/Utils';
import { CONTRAST_COLOR, DIVIDER_SX, BACKGROUND_COLOR } from '../../Theme';
import { Divider } from '@mui/material';

const IncreaseDissolveDelay = (props) => {  
    const { onSubmitProposal, payload, action, disabled, finalized} = props;
    const { treasuryState, homePageState } = useContext(AppContext);
    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId?.toString());
    const [additionalDissolveDelaySeconds, setAdditionalDissolveDelaySeconds] = useState(parseInt(payload?.additionalDissolveDelaySeconds));
    const [hasError, setHasError] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const neuronMenuItemProps = treasuryState?.neurons?.icp?.filter(([neuronId, neuronData]) => {
        return !!neuronData.neuronInfo
    }).map(([neuronId, neuronData]) => {
        return {
            text: neuronId,
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

    const {maxAdditionalDissolveDelaySeconds, selectedNeuronData} = useMemo( () => {
        const maxDissolveDelaySecondsPossible = daysToSeconds(2922);
        const selectedNeuronKeyValuePair = treasuryState?.neurons?.icp?.find(([neuronId, neuronData]) => neuronId === selectedNeuronId);
        if(!selectedNeuronId || !selectedNeuronKeyValuePair) return {};
        const [_, selectedNeuronData] = selectedNeuronKeyValuePair;
        const {dissolve_delay_seconds} = selectedNeuronData.neuronInfo;
        const maxAdditionalDissolveDelaySeconds = Math.floor(maxDissolveDelaySecondsPossible - parseInt(dissolve_delay_seconds));
        return {maxAdditionalDissolveDelaySeconds, selectedNeuronData};
    }, [selectedNeuronId]);

    useEffect(() => {setIsReadyToSubmit(!!selectedNeuronId && additionalDissolveDelaySeconds && !hasError )}, [selectedNeuronId, additionalDissolveDelaySeconds]);

    const submitProposal = async () => {
        await onSubmitProposal({[action]: {neuronId: BigInt(selectedNeuronId), additionalDissolveDelaySeconds}});
    };

    const {hypotheticalLabels, hypotheticalDatasets} = useMemo(() => {
        if(!selectedNeuronData || finalized) return {};

        const usersHypotheticalVotingPowersMap = {};
        for(let [principal, { balances: { voting_power } }] of treasuryState?.usersTreasuryDataArray) usersHypotheticalVotingPowersMap[principal] = voting_power;

        const additionalVotingPowersArray = getHypotheticalVotingPowerIncreaseFromIncreasedDissolveDelay(selectedNeuronData, additionalDissolveDelaySeconds);
        for(let [principal, {additionalVotingPower}] of additionalVotingPowersArray) usersHypotheticalVotingPowersMap[principal] += additionalVotingPower;

        const hypotheticalDataMapArray = [];
        for( let userPrincipal in usersHypotheticalVotingPowersMap) {
            let userName = homePageState?.canisterData?.userNames[userPrincipal];
            let dataPoint = {voting_power: fromE8s(usersHypotheticalVotingPowersMap[userPrincipal])};
            hypotheticalDataMapArray.push([userName, dataPoint]);
        };

        const reducedHypotheticalDataMapArray = sortAndReduceDataMapArray(hypotheticalDataMapArray, "voting_power", 10);
        const {labels, datasets} = getLabelsAndDataSetsInChartFormat(reducedHypotheticalDataMapArray, 125);

        return {hypotheticalLabels: labels, hypotheticalDatasets: datasets};

    }, [selectedNeuronData, additionalDissolveDelaySeconds]);

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                xs={8}
                disabled={disabled}
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
                <InputBox
                    width={"100%"}
                    hasError={hasError}
                    disabled={disabled}
                    label={"Additional Dissolve Delay Days"}
                    placeHolder={`Max: ${secondsToDays(maxAdditionalDissolveDelaySeconds)} Days`}
                    onChange={(value) => { setHasError(!value || daysToSeconds(value) > maxAdditionalDissolveDelaySeconds); setAdditionalDissolveDelaySeconds(daysToSeconds(value)); }}
                    allowNegative={false}
                    maxDecimalPlaces={0}
                    parseNumber={parseInt}
                    format={INPUT_BOX_FORMATS.numberFormat}
                    value={secondsToDays(additionalDissolveDelaySeconds)}
                    suffix={" Days"}
                />
            </>
            }
            {!!hypotheticalDatasets && !!hypotheticalLabels &&
            <> 
                <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}} />   
                <Typography variant="h6">Voting Power Distribution If Approved: </Typography>
                <Graph
                    height={"426px"}
                    withoutPaper={true}
                    type={CHART_TYPES.pie}
                    datasets={hypotheticalDatasets}
                    labels={hypotheticalLabels}
                    maintainAspectRatio={false}
                    hideButton1={true}
                    hideButton2={true}
                />  
            </>
            }
            { !!isReadyToSubmit && !disabled &&
                <>
                    <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} bottom={"10px"} width={"100%"} >
                        <ButtonField
                            Icon={DoneIcon}
                            color={BACKGROUND_COLOR}
                            gridSx={{ width: "230px", backgroundColor: CONTRAST_COLOR }}
                            disabled={disabled}
                            text={'Submit Proposal'}
                            onClick={submitProposal}
                        />
                    </Grid>
                </>
            }
            
        </Grid>

    );

};

export default IncreaseDissolveDelay;