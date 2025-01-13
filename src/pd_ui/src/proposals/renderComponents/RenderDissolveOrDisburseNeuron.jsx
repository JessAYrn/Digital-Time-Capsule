import React, {useState, useContext, useEffect} from 'react';
import { AppContext } from '../../Context';
import { Typography } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import MenuField from '../../components/MenuField';
import ButtonField from '../../components/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { CONTRAST_COLOR } from '../../Theme';

const DissolveOrDisburseNeuron = (props) => {
    const { onSubmitProposal, action, payload, disabled } = props;
    const { treasuryState } = useContext(AppContext);
    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId?.toString());
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const neuronMenuItemProps = treasuryState?.neurons?.icp?.map(([neuronId, neuronData]) => {
        return {
            text: neuronId,  
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

    useEffect(() => {setIsReadyToSubmit(!!selectedNeuronId)}, [selectedNeuronId])

    const submitProposal = async () => {
        await onSubmitProposal({[action]: {neuronId: BigInt(selectedNeuronId)}});
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
            {selectedNeuronId && <Typography varient={"h6"} color={"#bdbdbd"}> {selectedNeuronId} </Typography>}
            { isReadyToSubmit && !disabled &&
                <ButtonField
                    disabled={disabled}
                    Icon={DoneIcon}
                    color={CONTRAST_COLOR}
                    text={'Submit Proposal'}
                    onClick={submitProposal}
                />
            }
        </Grid>
    );
};

export default DissolveOrDisburseNeuron;