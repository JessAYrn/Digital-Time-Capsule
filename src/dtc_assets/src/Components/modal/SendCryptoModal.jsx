import React, { useState } from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import InputBox from "../Fields/InputBox";
import { icpWalletAddressHasProperFormat, isANumber  } from "../../functionsAndConstants/Utils";
import ButtonField from "../Fields/Button";

const SendCrypto = (props) => {
    
    const { 
        onClickCancel
    } = props

    const [hasError_1, setHasError_1] = useState(false);
    const [hasError_2, setHasError_2] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [numberInput, setNumberInput] = useState(null);

    const onChangeRecipientAddress = (recipient) => {
        setHasError_1(!recipient  || !icpWalletAddressHasProperFormat(recipient))
        setRecipientAddress(recipient);
    };

    const onChangeAmount = (icp) => {
        let isANumber_ = isANumber(icp)
        setHasError_2(!icp || !isANumber_);
        setNumberInput(icp);
    };

    return (
        <Grid 
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}
            alignItems={'center'}
            width={'100%'}
        >   
            <InputBox
                hasError={hasError_1}
                label={"Recipient: "}
                rows={"1"}
                onChange={onChangeRecipientAddress}
            />
            <InputBox
                hasError={hasError_2}
                label={"Amount: "}
                rows={"1"}
                onChange={onChangeAmount}
                value={numberInput}
            />
        </Grid>
    )

};

export default SendCrypto