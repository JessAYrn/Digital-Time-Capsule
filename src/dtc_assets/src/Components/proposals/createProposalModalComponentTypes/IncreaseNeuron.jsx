import React, { useState, useEffect, useContext} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../Fields/Button';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../Fields/InputBox';
import { INPUT_BOX_FORMATS } from '../../../functionsAndConstants/Constants';
import MenuField from '../../Fields/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { PROPOSAL_ACTIONS } from '../utils';
import { toE8s } from '../../../functionsAndConstants/Utils';
import { AppContext } from '../../../Context';
import { Typography } from '@mui/material';

const IncreaseNeuron = (props) => {
    const { onSubmitProposal, proposalPayload } = props;
    const { treasuryState } = useContext(AppContext);
    const [selectedNeuronId, setSelectedNeuronId] = useState(proposalPayload.neuronId);
    const [amount, setAmount] = useState(null);
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

    const submitProposal = async () => { await onSubmitProposal({[PROPOSAL_ACTIONS.IncreaseNeuron]: {neuronId: BigInt(selectedNeuronId), amount: toE8s(amount)}}); };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"left"}
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
                        width={"100%"}
                        hasError={hasError}
                        label={"Amount"}
                        placeHolder={"Amount"}
                        onChange={(value) => { setHasError(!value); setAmount(value); }}
                        allowNegative={false}
                        maxDecimalPlaces={8}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        value={amount}
                        suffix={" ICP"}
                    />
                </>
            }
            {isReadyToSubmit && 
            <ButtonField
            Icon={DoneIcon}
            active={true}
            text={'Submit Proposal'}
            onClick={submitProposal}
            />}
        </Grid>
    )
};
export default IncreaseNeuron;