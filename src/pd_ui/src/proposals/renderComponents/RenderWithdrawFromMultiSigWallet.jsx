import React, { useMemo, useState} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { principalHasProperFormat, fromE8s, toE8s } from "../../functionsAndConstants/Utils";
import InputBox from "../../components/InputBox";
import DoneIcon from '@mui/icons-material/Done';
import ButtonField from "../../components/Button";
import { Typography } from "@mui/material";
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";
import { CONTRAST_COLOR } from "../../Theme";

const WithdrawFromMultiSigWallet = (props) => {
    const { onSubmitProposal, action, payload, disabled } = props;
    const [amount, setAmount] = useState(payload?.amount || payload?.amount === BigInt(0) ? fromE8s(parseInt(payload?.amount)) : null);
    const [to, setTo] = useState(payload?.to || null);
    const [hasError_1, setHasError_1] = useState(false);
    const [hasError_2, setHasError_2] = useState(false);

    const isReadyToSubmit = useMemo(() => {
        return !!amount && !!to && !hasError_1 && !hasError_2
    }, [amount, hasError_1, hasError_2, to]);

    const submitProposal = async () => { 
        await onSubmitProposal({[action]: {amount: toE8s(amount), to}}); 
    };

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <InputBox
                disabled={disabled}
                width={"100%"}
                hasError={hasError_1}
                label={"Recipient Principal"}
                placeHolder={"Recipient Principal"}
                onChange={(value) => {setHasError_1(!value || !principalHasProperFormat(value)); setTo(value);}}
                value={to}
            />
            {!!to && 
                <>
                    <Typography varient={"h6"} color={"#bdbdbd"}> {to} </Typography>
                    <InputBox
                        disabled={disabled}
                        width={"100%"}
                        hasError={hasError_2}
                        label={"Amount"}
                        placeHolder={"Amount"}
                        onChange={(value) => {setHasError_2(!value); setAmount(value);}}
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
                color={CONTRAST_COLOR}
                text={'Submit Proposal'}
                onClick={submitProposal}
            />}
        </Grid>
    );
};
export default WithdrawFromMultiSigWallet;