import React, {useState, useContext, useEffect} from 'react';
import { AppContext } from '../../Context';
import { Typography } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import MenuField from '../../components/MenuField';
import ButtonField from '../../components/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { CONTRAST_COLOR, BACKGROUND_COLOR } from '../../Theme';

const DissolveOrDisburseNeuron = (props) => {
    const { onSubmitProposal, action, payload, disabled } = props;
    const { treasuryState } = useContext(AppContext);
    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId?.toString());

    const neuronMenuItemProps = treasuryState?.neurons?.icp?.filter(([neuronId, {neuronInfo}]) => {
        return !!neuronInfo;
    }).map(([neuronId, neuronData]) => {
        return {
            text: neuronId,  
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

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
            {selectedNeuronId && 
                <>
                    <Typography varient={"h6"} color={"#bdbdbd"}> {selectedNeuronId} </Typography>
                    { !disabled &&
                        <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} maxWidth={"700px"} position={"fixed"} bottom={0} width={"100%"} >
                            <ButtonField
                                disabled={disabled}
                                Icon={DoneIcon}
                                color={BACKGROUND_COLOR}
                                gridSx={{ margin: "2.5%", width: "40%", backgroundColor: CONTRAST_COLOR }}
                                text={'Submit Proposal'}
                                onClick={submitProposal}
                                />
                        </Grid>     
                    }
                </>
            }
        </Grid>
    );
};

export default DissolveOrDisburseNeuron;