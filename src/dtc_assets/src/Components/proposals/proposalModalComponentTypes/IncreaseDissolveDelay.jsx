import React, {useState, useContext, useEffect, useMemo} from 'react';
import MenuField from '../../Fields/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { AppContext } from '../../../Context';
import ButtonField from '../../Fields/Button';
import { Typography } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../Fields/InputBox';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { INPUT_BOX_FORMATS } from '../../../functionsAndConstants/Constants';


const IncreaseDissolveDelay = (props) => {  
    const { onSubmitProposal, payload, action, disabled} = props;
    const { treasuryState } = useContext(AppContext);
    const [selectedNeuronId, setSelectedNeuronId] = useState(payload?.neuronId?.toString());
    const [additionalDissolveDelayInDays, setAdditionalDissolveDelayInDays] = useState(payload?.additionalDissolveDelaySeconds ? parseInt(payload?.additionalDissolveDelaySeconds) / (24 * 60 * 60): null);
    const [hasError, setHasError] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const neuronMenuItemProps = treasuryState?.neurons?.icp?.map(([neuronId, neuronData]) => {
        return {
            text: neuronId,
            onClick: () => setSelectedNeuronId(neuronId),
            selected: neuronId === selectedNeuronId
        }
    });

    const maxAdditionalDissolveDelayInDays = useMemo( () => {
        const maxDissolveDelayPossibleInDays = 2922;
        const neuronData_ = treasuryState?.neurons?.icp?.find(([neuronId, neuronData]) => neuronId === selectedNeuronId);
        if(!selectedNeuronId || !neuronData_) return 0;
        const [_, neuronData] = neuronData_;
        const {dissolve_delay_seconds} = neuronData.neuronInfo;
        const dissolveDelayInDays = parseInt(dissolve_delay_seconds) / (24 * 60 * 60);
        return Math.floor(maxDissolveDelayPossibleInDays - dissolveDelayInDays);
    }, [selectedNeuronId]);

    useEffect(() => {setIsReadyToSubmit(!!selectedNeuronId && additionalDissolveDelayInDays && !hasError )}, [selectedNeuronId, additionalDissolveDelayInDays]);

    const submitProposal = async () => {
        const additionalDissolveDelaySeconds = additionalDissolveDelayInDays * 24 * 60 * 60;
        await onSubmitProposal({[action]: {neuronId: BigInt(selectedNeuronId), additionalDissolveDelaySeconds}});
    };

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
                label={"Neuron To Configure"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={neuronMenuItemProps}
            />
            {selectedNeuronId && 
            <>
                <Typography varient={"h6"} color={"#bdbdbd"}> {selectedNeuronId} </Typography>
                <InputBox
                    width={"100%"}
                    hasError={hasError}
                    disabled={disabled}
                    label={"Additional Dissolve Delay Days"}
                    placeHolder={`Max: ${maxAdditionalDissolveDelayInDays} Days`}
                    onChange={(value) => { setHasError(!value || value > maxAdditionalDissolveDelayInDays); setAdditionalDissolveDelayInDays(value); }}
                    allowNegative={false}
                    maxDecimalPlaces={0}
                    parseNumber={parseInt}
                    format={INPUT_BOX_FORMATS.numberFormat}
                    value={additionalDissolveDelayInDays}
                    suffix={" Days"}
                />
            </>
            }
            { isReadyToSubmit && !disabled &&
                <ButtonField
                    Icon={DoneIcon}
                    active={true}
                    disabled={disabled}
                    text={'Submit Proposal'}
                    onClick={submitProposal}
                />
            }
        </Grid>

    );

};

export default IncreaseDissolveDelay;