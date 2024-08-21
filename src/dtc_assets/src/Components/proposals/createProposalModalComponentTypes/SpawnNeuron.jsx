import React, { useContext, useEffect, useState } from 'react';
import MenuField from '../../Fields/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Typography from '@mui/material/Typography';
import { AppContext } from '../../../Context';
import InputBox from '../../Fields/InputBox';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { INPUT_BOX_FORMATS } from '../../../functionsAndConstants/Constants';
import ButtonField from '../../Fields/Button';
import DoneIcon from '@mui/icons-material/Done';
import { PROPOSAL_ACTIONS } from '../utils';

const SpawnNeuron = (props) => {

    const { onSubmitProposal, proposalPayload } = props;


    const { treasuryState } = useContext(AppContext);

    const [selectedNeuronId, setSelectedNeuronId] = useState(proposalPayload.neuronId);
    const [percentageOfRewardsToSpawn, setPercentageOfRewardsToSpawn] = useState(1);
    const [hasError, setHasError] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const neuronMenuItemProps = treasuryState.neurons.icp.map(([neuronId, neuronData]) => {
        return {
            text: neuronId,  
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

    useEffect(() => { setIsReadyToSubmit(selectedNeuronId && percentageOfRewardsToSpawn && !hasError);}, 
    [selectedNeuronId, percentageOfRewardsToSpawn]);

    const submitProposal = async () => {
        onSubmitProposal({ [PROPOSAL_ACTIONS.SpawnNeuron]: {neuronId: BigInt(selectedNeuronId), percentage_to_spawn: percentageOfRewardsToSpawn} });
    };

    return (
        <Grid2 xs={12} display={'flex'} justifyContent={"center"} alignItems={'center'} flexDirection={'column'}>
            <MenuField
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"left"}
                active={true}
                color={"custom"}
                label={"Parent Neuron to Spawn New Neuron From"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={neuronMenuItemProps}
            />
            {selectedNeuronId && 
            <>
                <Typography varient={"h6"} color={"#bdbdbd"}> {selectedNeuronId} </Typography>
                <InputBox
                    label={"Percentage of Maturity to Spawn"}
                    placeHolder={"Percentage of Maturity to Spawn"}
                    onChange={(value) => {
                        setHasError(!value || value > 100);
                        setPercentageOfRewardsToSpawn(value);
                    }}
                    value={percentageOfRewardsToSpawn}
                    hasError={hasError}
                    format={INPUT_BOX_FORMATS.numberFormat}
                    maxValue={100}
                    width={"100%"}
                    omitMaxValueButton={true}
                    maxDecimalPlaces={0}
                    allowNegative={false}
                    suffix={" %"}
                />
            </>
            }
            { isReadyToSubmit && 
            <>
                <ButtonField
                    Icon={DoneIcon}
                    active={true}
                    text={'Submit Proposal'}
                    onClick={submitProposal}
                />
            </>
            }
        </Grid2>
    );

};

export default SpawnNeuron;