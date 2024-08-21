import React, {useState, useEffect} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../Fields/Button';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../Fields/InputBox';
import { INPUT_BOX_FORMATS } from '../../../functionsAndConstants/Constants';
import { toE8s } from '../../../functionsAndConstants/Utils';


const CreateNeuronOrPurchaseCycles = (props) => {

    const {onSubmitProposal, action} = props;
    const [amount, setAmount] = useState(null);
    const [hasError, setHasError] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    useEffect(() => { setIsReadyToSubmit(!!amount && !hasError); }, [amount]);

    const submitProposal = async () => { await onSubmitProposal({[action]: {amount: toE8s(amount)}}); };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <InputBox
                width={"100%"}
                hasError={hasError}
                label={"Amount"}
                placeHolder={"Amount"}
                onChange={(value) => {

                    setAmount(value);
                }}
                allowNegative={false}
                maxDecimalPlaces={8}
                format={INPUT_BOX_FORMATS.numberFormat}
                value={amount}
                suffix={" ICP"}
            />
            {isReadyToSubmit && 
            <ButtonField
                Icon={DoneIcon}
                active={true}
                text={'Submit Proposal'}
                onClick={submitProposal}
            />}
        </Grid>
    );
};

export default CreateNeuronOrPurchaseCycles;