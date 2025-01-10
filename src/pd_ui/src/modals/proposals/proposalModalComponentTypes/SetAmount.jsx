import React, {useState, useEffect} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../../Components/Button';
import DoneIcon from '@mui/icons-material/Done';
import InputBox from '../../../Components/InputBox';
import { fromE8s } from '../../../functionsAndConstants/Utils';
import { INPUT_BOX_FORMATS } from '../../../functionsAndConstants/Constants';
import { toE8s } from '../../../functionsAndConstants/Utils';


const SetAmount = (props) => {

    const {onSubmitProposal, action, payload, disabled} = props;
    const [amount, setAmount] = useState(payload?.amount || payload?.amount === BigInt(0) ? fromE8s(parseInt(payload?.amount)) : null);
    const [hasError, setHasError] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    useEffect(() => { setIsReadyToSubmit(!!amount && !hasError); }, [amount]);

    const submitProposal = async () => { await onSubmitProposal({[action]: {amount: toE8s(amount)}}); };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <InputBox
                disabled={disabled}
                width={"100%"}
                hasError={hasError}
                label={"Amount"}
                placeHolder={"Amount"}
                onChange={(value) => {setHasError(!value); setAmount(value);}}
                allowNegative={false}
                maxDecimalPlaces={8}
                parseNumber={parseFloat}
                format={INPUT_BOX_FORMATS.numberFormat}
                value={amount}
                suffix={" ICP"}
            />
            {isReadyToSubmit && !disabled &&
            <ButtonField
                Icon={DoneIcon}
                color={"secondary"}
                text={'Submit Proposal'}
                onClick={submitProposal}
            />}
        </Grid>
    );
};

export default SetAmount;