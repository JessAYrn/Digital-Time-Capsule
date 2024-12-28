import React, { useState, useEffect, useContext} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../../Fields/Button';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../../Fields/InputBox';
import { INPUT_BOX_FORMATS } from '../../../../functionsAndConstants/Constants';
import MenuField from '../../../Fields/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { fromE8s, toE8s } from '../../../../functionsAndConstants/Utils';
import { AppContext } from '../../../../Context';
import { Typography } from '@mui/material';
import {Checkbox} from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

const IncreaseNeuron = (props) => {
    const { onSubmitProposal, payload, action, disabled } = props;
    const { treasuryState, homePageState } = useContext(AppContext);
    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId?.toString());
    const [amount, setAmount] = useState(payload?.amount || payload?.amount === BigInt(0) ? fromE8s(parseInt(payload?.amount)) : null);
    const [hasError, setHasError] = useState(false);
    const [onBehalfOf, setOnBehalfOf] = useState(payload?.onBehalfOf || []);
    const [showOnBehalfOfDropdown, setShowOnBehalfOfDropdown] = useState(payload?.onBehalfOf?.length);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    useEffect(() => { setIsReadyToSubmit(!!amount && !hasError && selectedNeuronId); }, [amount, selectedNeuronId]);

    const neuronMenuItemProps = treasuryState?.neurons?.icp?.filter(([neuronId, neuronData]) => {
        return !!neuronData?.neuronInfo;
    }).map(([neuronId, neuronData]) => {
        return {
            text: neuronId,  
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

    const onBehalfOfMenuItemProps = Object.keys(homePageState?.canisterData?.userNames).map((userPrincipal) => {
        return {
            text: homePageState?.canisterData?.userNames[userPrincipal],
            onClick: () => { setOnBehalfOf([userPrincipal]); },
            selected: (!!onBehalfOf.length && userPrincipal === onBehalfOf[0])
        }
    });

    const submitProposal = async () => { await onSubmitProposal({[action]: { neuronId: BigInt(selectedNeuronId), amount: toE8s(amount), onBehalfOf }}); };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                xs={8}
                disabled={disabled}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={"secondary"}
                label={"Neuron To Increase"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={neuronMenuItemProps}
            />
            { !!selectedNeuronId && 
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
                    {!disabled && <FormGroup sx={{marginBottom: "20px"}}>
                        <FormControlLabel 
                            label = {"Stake on someone else's behalf"}
                            labelPlacement="start"
                            color="white"
                            disabled={disabled} 
                            control={
                                <Checkbox 
                                    color='white'
                                    checked={showOnBehalfOfDropdown} 
                                    onChange={(e) => setShowOnBehalfOfDropdown(e.target.checked)}
                                />
                            }
                        />
                    </FormGroup>}
                    {!!showOnBehalfOfDropdown &&
                        <MenuField
                            sx={{marginBottom: "20px"}}
                            xs={8}
                            disabled={disabled}
                            display={"flex"}
                            alignItems={"center"}
                            justifyContent={"center"}
                            color={"secondary"}
                            label={"Who to credit this stake to?"}
                            MenuIcon={KeyboardArrowDownIcon}
                            menuItemProps={onBehalfOfMenuItemProps}
                        />
                    }
                    {!!onBehalfOf.length && <Typography marginBottom={"20px"} varient={"h6"} color={"#bdbdbd"}> {homePageState?.canisterData?.userNames[onBehalfOf[0]]} </Typography>}
                </>
            }
            {isReadyToSubmit && !disabled && 
            <ButtonField
            Icon={DoneIcon}
            color={"secondary"}
            disabled={disabled}
            text={'Submit Proposal'}
            onClick={submitProposal}
            />}
        </Grid>
    )
};
export default IncreaseNeuron;