import React, { useContext, useEffect, useState } from 'react';
import MenuField from '../../components/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Typography from '@mui/material/Typography';
import { AppContext } from '../../Context';
import InputBox from '../../components/InputBox';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { INPUT_BOX_FORMATS } from '../../functionsAndConstants/Constants';
import ButtonField from '../../components/Button';
import DoneIcon from '@mui/icons-material/Done';
import { CONTRAST_COLOR, DIVIDER_SX, BACKGROUND_COLOR } from '../../Theme';
import { Divider } from '@mui/material';

const SpawnNeuron = (props) => {

    const { onSubmitProposal, payload, action, disabled } = props;


    const { treasuryState } = useContext(AppContext);

    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId?.toString());
    const [percentageOfRewardsToSpawn, setPercentageOfRewardsToSpawn] = useState(payload?.percentage_to_spawn || 1);
    const [hasError, setHasError] = useState(!disabled);

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
        onSubmitProposal({ [action]: {neuronId: BigInt(selectedNeuronId), percentage_to_spawn: percentageOfRewardsToSpawn} });
    };

    return (
        <Grid width={"100%"} xs={12} display={'flex'} justifyContent={"center"} alignItems={'center'} flexDirection={'column'}>
            <MenuField
                xs={8}
                disabled={disabled}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={CONTRAST_COLOR}
                label={"Parent Neuron to Spawn New Neuron From"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={neuronMenuItemProps}
            />
            {selectedNeuronId && 
                <>
                    <Typography varient={"h6"} color={"#bdbdbd"}> {selectedNeuronId} </Typography>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <InputBox
                        disabled={disabled}
                        label={"Percentage of Maturity to Spawn"}
                        placeHolder={"Percentage of Maturity to Spawn"}
                        onChange={(e) => {
                            const parsedValue = parseInt(e.target.value);
                            setHasError(Object.is(parsedValue, NaN) || parsedValue === 0 || parsedValue > 100);
                            setPercentageOfRewardsToSpawn(parsedValue);
                        }}
                        value={percentageOfRewardsToSpawn}
                        hasError={hasError}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        width={"100%"}
                        maxDecimalPlaces={0}
                        allowNegative={false}
                        suffix={" %"}
                    />
                    { !hasError && !disabled &&
                        <>
                            <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} maxWidth={"700px"} bottom={0} width={"100%"} >
                                <ButtonField
                                    disabled={disabled}
                                    Icon={DoneIcon}
                                    color={BACKGROUND_COLOR}
                                    gridSx={{ margin: "2.5%", width: "95%", backgroundColor: CONTRAST_COLOR }}
                                    text={'Submit Proposal'}
                                    onClick={submitProposal}
                                />
                            </Grid>
                        </>
                    }
                </>
            }
        </Grid>
    );

};

export default SpawnNeuron;