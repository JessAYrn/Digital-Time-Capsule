import React, { useState, useEffect, useContext} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../Fields/Button';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../Fields/InputBox';
import { INPUT_BOX_FORMATS } from '../../../functionsAndConstants/Constants';
import MenuField from '../../Fields/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { PROPOSAL_ACTIONS } from '../utils';
import { fromE8s, toE8s } from '../../../functionsAndConstants/Utils';
import { AppContext } from '../../../Context';
import { Typography } from '@mui/material';

const IncreaseNeuron = (props) => {
    const { onSubmitProposal, payload, action, disabled } = props;
    const { treasuryState } = useContext(AppContext);
    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId.toString());
    const [amount, setAmount] = useState(payload?.amount ? fromE8s(parseInt(payload?.amount)) : null);
    const [hasError, setHasError] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    useEffect(() => { setIsReadyToSubmit(amount && !hasError && selectedNeuronId); }, [amount, selectedNeuronId]);

    const neuronMenuItemProps = treasuryState?.neurons?.icp?.map(([neuronId, neuronData]) => {
        return {
            text: neuronId,  
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

    const submitProposal = async () => { await onSubmitProposal({[action]: {neuronId: BigInt(selectedNeuronId), amount: toE8s(amount)}}); };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                xs={8}
                disabled={disabled}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                active={true}
                color={"custom"}
                label={"Neuron To Increase"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={neuronMenuItemProps}
            />
            { selectedNeuronId && 
                <>
                    <Typography varient={"h6"} color={"#bdbdbd"}> {selectedNeuronId} </Typography>
                    <InputBox
                        disabled={disabled}
                        width={"100%"}
                        hasError={hasError}
                        label={"Amount"}
                        placeHolder={"Amount"}
                        onChange={(value) => { setHasError(!value); setAmount(value); }}
                        allowNegative={false}
                        maxDecimalPlaces={8}
                        parseNumber={parseFloat}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        value={amount}
                        suffix={" ICP"}
                    />
                </>
            }
            {isReadyToSubmit && !disabled && 
            <ButtonField
            Icon={DoneIcon}
            active={true}
            disabled={disabled}
            text={'Submit Proposal'}
            onClick={submitProposal}
            />}
        </Grid>
    )
};
export default IncreaseNeuron;