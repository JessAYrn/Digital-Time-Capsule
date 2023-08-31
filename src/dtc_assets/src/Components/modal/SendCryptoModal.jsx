import React from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import InputBox from "../Fields/InputBox";
import ButtonField from "../Fields/Button";

const SendCrypto = (props) => {
    const { 
        onChangeRecipientAddress,
        onChangeAmount,
        onClickSend,
        onClickCancel,
        onClickScanQrCode
    } = props

    return (
        <Grid 
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}
            alignItems={'center'}
            width={'100%'}
        >   
            <InputBox
                label={"Recipient: "}
                rows={"1"}
                onChange={onChangeRecipientAddress}
            />
            <InputBox
                label={"Amount: "}
                rows={"1"}
                onChange={onChangeAmount}
            />
        </Grid>
    )

};

export default SendCrypto