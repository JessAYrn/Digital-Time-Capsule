import React, {useState, useEffect, useContext, useMemo} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../components/Button';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../components/InputBox';
import { fromE8s } from '../../functionsAndConstants/Utils';
import { INPUT_BOX_FORMATS, CHART_TYPES } from '../../functionsAndConstants/Constants';
import { toE8s, fromE8s } from '../../functionsAndConstants/Utils';
import { CONTRAST_COLOR, DIVIDER_SX } from '../../Theme';
import { getHypotheticalVotingPowerIncreaseFromStake, PROPOSAL_ACTIONS } from '../utils';
import { sortAndReduceDataMapArray, getLabelsAndDataSetsInChartFormat } from '../../components/Chart';
import { AppContext } from '../../Context';
import { Divider, Typography } from '@mui/material';
import Graph from '../../components/Chart';
import { BACKGROUND_COLOR } from '../../Theme';
const SetAmount = (props) => {

    const {onSubmitProposal, action, payload, disabled, finalized} = props;
    const [amount, setAmount] = useState(payload?.amount || payload?.amount === BigInt(0) ? fromE8s(parseInt(payload?.amount)) : null);
    const [hasError, setHasError] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const { treasuryState, homePageState } = useContext(AppContext);

    useEffect(() => { setIsReadyToSubmit(!!amount && !hasError); }, [amount]);

    const {hypotheticalLabels, hypotheticalDatasets} = useMemo(() => {
        if(action !== PROPOSAL_ACTIONS.CreateNeuron || finalized) return {};

        const usersHypotheticalVotingPowersMap = {};
        for(let [principal, { balances: { voting_power } }] of treasuryState?.usersTreasuryDataArray) usersHypotheticalVotingPowersMap[principal] = voting_power;

        const additionalVotingPowersArray = getHypotheticalVotingPowerIncreaseFromStake(null, amount, treasuryState?.userPrincipal);
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

    }, [ amount, action]);

    const submitProposal = async () => { await onSubmitProposal({[action]: {amount: toE8s(amount)}}); };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <InputBox
                disabled={disabled}
                width={"100%"}
                hasError={hasError}
                label={"Amount"}
                placeHolder={"Amount"}
                onChange={(e) => {setHasError(!e.target.value); setAmount(parseFloat(e.target.value));}}
                allowNegative={false}
                maxDecimalPlaces={8}
                format={INPUT_BOX_FORMATS.numberFormat}
                value={amount}
                suffix={" ICP"}
            />
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
            {isReadyToSubmit && !disabled &&
                <>
                    <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} bottom={"10px"} width={"100%"} >
                        <ButtonField
                            Icon={DoneIcon}
                            color={BACKGROUND_COLOR}
                            gridSx={{ width: "230px", backgroundColor: CONTRAST_COLOR }}
                            text={'Submit Proposal'}
                            onClick={submitProposal}
                        />
                    </Grid>
                </>
            }
        </Grid>
    );
};

export default SetAmount;