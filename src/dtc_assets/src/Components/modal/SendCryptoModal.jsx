import React, { useState, useContext } from "react";
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import InputBox from "../Fields/InputBox";
import { icpWalletAddressHasProperFormat, isANumber, round8Decimals, shortenHexString, fromHexString, fromE8s  } from "../../functionsAndConstants/Utils";
import ButtonField from "../Fields/Button";
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import QrReaderContent  from "./ScanQrCodeModal";
import { INPUT_BOX_FORMATS, e8sInOneICP } from "../../functionsAndConstants/Constants";
import DataField from "../Fields/DataField";

const SendCrypto = (props) => {
    
    const { 
        onClickCancel,
        setModalIsOpen,
        setIsLoadingWalletData
    } = props

    const [hasError_1, setHasError_1] = useState(false);
    const [hasError_2, setHasError_2] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [showQrReader, setShowQrReader] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [numberInput, setNumberInput] = useState(null);

    const { walletState, actorState } = useContext(AppContext);

    const onChangeRecipientAddress = (recipient) => {
        setHasError_1(!recipient  || !icpWalletAddressHasProperFormat(recipient))
        setRecipientAddress(recipient);
    };

    const onChangeAmount = (icp) => {
        let isANumber_ = isANumber(icp)
        setHasError_2(!icp || !isANumber_);
        setNumberInput(icp);
    };

    const onSendICP = async () => {
        setModalIsOpen,
        setIsLoadingWalletData(true);
        const e8s = round8Decimals(parseFloat(numberInput) * e8sInOneICP);
        const accountId = fromHexString(recipientAddress);
        const result = await actorState.backendActor.transferICP(e8s, accountId);
        setIsLoadingWalletData(false);
        setModalIsOpen(false);
        if("err" in result){
            alert("Error: " + Object.keys(result.err)[0]);
            return;
        };
        alert("Your balance may take up to 30 seconds to update")
    }

    return (
        <Grid 
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}
            alignItems={'center'}
            width={"100%"}
        > 
            { !showSummary ? 
                <>
                    {!showQrReader &&
                        <>
                            <Grid
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                width={"100%"}
                            >
                                <DataField
                                    label={'Balance: '}
                                    text={`${walletState.walletData.balance /  e8sInOneICP} ICP`}
                                    disabled={true}
                                />
                            </Grid>
                            <Grid
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                width={"100%"}
                            >
                                <InputBox
                                    hasError={hasError_1}
                                    label={"Recipient: "}
                                    rows={"1"}
                                    onChange={onChangeRecipientAddress}
                                    value={recipientAddress}
                                    width={"100%"}
                                />
                                <ButtonField
                                    transparentBackground={true}
                                    elevation={0}
                                    onClick={() => setShowQrReader(true)}
                                    Icon={CenterFocusWeakIcon}
                                    iconSize={'medium'}
                                />
                            </Grid>
                            {recipientAddress && !hasError_1 &&
                            <Grid
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                width={"100%"}
                            >
                                <InputBox
                                    hasError={hasError_2}
                                    label={"Amount: "}
                                    rows={"1"}
                                    onChange={onChangeAmount}
                                    value={numberInput}
                                    format={INPUT_BOX_FORMATS.numberFormat}
                                    maxValue={ round8Decimals( fromE8s(parseFloat(walletState.walletData.balance))) }
                                    width={"100%"}
                                />
                            </Grid>}
                            <Grid
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                width={"100%"}
                            >
                                <ButtonField
                                    paperSx={{margin: "20px", width: "90px"}}
                                    text={"cancel"}
                                    onClick={onClickCancel}
                                />
                                <ButtonField
                                    paperSx={{margin: "20px", width: "90px"}}
                                    text={"summary"}
                                    disabled={hasError_1 || hasError_2 || !numberInput}
                                    onClick={() => setShowSummary(true)}
                                />
                            </Grid>
                        </>
                    }
                    {
                        showQrReader && 
                        <QrReaderContent 
                        setRecipientAddress={setRecipientAddress} 
                        setShowQrReader={setShowQrReader}
                        />
                    }
                </> : 
                <>
                    <DataField
                        label={'Recipient: '}
                        text={`${shortenHexString(recipientAddress)}`}
                        disabled={true}
                    />
                    <DataField
                        label={'Amount: '}
                        text={`${round8Decimals(parseFloat(numberInput)) - 0.0001} ICP`}
                        disabled={true}
                    />
                    <DataField
                        label={'Fee: '}
                        text={`0.0001 ICP`}
                        disabled={true}
                    />
                    <DataField
                        label={'Total: '}
                        text={`${round8Decimals(parseFloat(numberInput))} ICP`}
                        disabled={true}
                    />
                    <Grid
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        width={"100%"}
                    >
                        <ButtonField
                            paperSx={{margin: "20px", width: "90px"}}
                            text={"edit"}
                            onClick={() => { setShowSummary(false); setNumberInput(null)}}
                        />
                        <ButtonField
                            paperSx={{margin: "20px", width: "90px"}}
                            text={"send now"}
                            onClick={onSendICP}
                        />
                    </Grid>

                </>
            }  
        </Grid>
    )

};

export default SendCrypto