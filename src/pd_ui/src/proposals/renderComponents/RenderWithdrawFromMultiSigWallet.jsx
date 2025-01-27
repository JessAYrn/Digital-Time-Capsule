import React, { useMemo, useState} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { principalHasProperFormat, fromE8s, toE8s } from "../../functionsAndConstants/Utils";
import InputBox from "../../components/InputBox";
import DoneIcon from '@mui/icons-material/Done';
import ButtonField from "../../components/Button";
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";
import { CONTRAST_COLOR, DIVIDER_SX, BACKGROUND_COLOR } from "../../Theme";
import { Divider } from "@mui/material";

const WithdrawFromMultiSigWallet = (props) => {
    const { onSubmitProposal, action, payload, disabled } = props;
    const [amount, setAmount] = useState(payload?.amount || payload?.amount === BigInt(0) ? fromE8s(parseInt(payload?.amount)) : null);
    const [to, setTo] = useState(payload?.to || null);
    const [hasError_1, setHasError_1] = useState(!disabled);
    const [hasError_2, setHasError_2] = useState(!disabled);

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
                onChange={(e) => {setHasError_1(!e.target.value || !principalHasProperFormat(e.target.value)); setTo(e.target.value);}}
                value={to}
            />
            {!hasError_1 && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <InputBox
                        disabled={disabled}
                        width={"100%"}
                        hasError={hasError_2}
                        label={"Amount"}
                        placeHolder={"Amount"}
                        onChange={(e) => {
                            const parsedValue = parseFloat(e.target.value);
                            setHasError_2(Object.is(parsedValue, NaN) || parsedValue === 0);
                            setAmount(parsedValue);
                        }}
                        allowNegative={false}
                        maxDecimalPlaces={8}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        value={amount}
                        suffix={" ICP"}
                    />
                    {!hasError_2 && !disabled &&
                        <>
                            <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} maxWidth={"700px"} bottom={0} width={"100%"} >
                                <ButtonField
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
export default WithdrawFromMultiSigWallet;