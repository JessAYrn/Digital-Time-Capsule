import React, { useState, useContext, useMemo } from "react";
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import InputBox from "../../components/InputBox";
import { icpWalletAddressHasProperFormat, principalHasProperFormat, isANumber, round8Decimals, shortenHexString, fromHexString, fromE8s, toE8s  } from "../../functionsAndConstants/Utils";
import ButtonField from "../../components/Button";
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import RenderQrReaderContent from "./RenderQrScanner";
import { INPUT_BOX_FORMATS, e8sInOneICP } from "../../functionsAndConstants/Constants";
import DataField from "../../components/DataField";
import { BACKGROUND_COLOR, WHITE_COLOR, CONTRAST_COLOR, DIVIDER_SX } from "../../Theme";
import Typography from "@mui/material/Typography";
import { Divider } from "@mui/material";


const SendFromWallet = (props) => {

    const {recipientAddress, amount} = props;

    const [recipientAddress_, setRecipientAddress_] = useState(recipientAddress || "");
    const [amount_, setAmount_] = useState(amount || 0);
    const [hasError_1, setHasError_1] = useState(!(principalHasProperFormat(recipientAddress_) || icpWalletAddressHasProperFormat(recipientAddress_)));
    const [hasError_2, setHasError_2] = useState(Object.is(amount_, NaN) || amount_ === 0);

    const { walletState, navigationAndApiState, setModalIsOpen, setModalIsLoading, setModalProps } = useContext(AppContext);

    const returnToEdit = (props) => {
        const {recipientAddress, amount} = props;
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography>Send From Wallet</Typography>,
            components: [<SendFromWallet recipientAddress={recipientAddress} amount={amount}/>],
        });
    };

    const RenderSummary = (props) => {
        const { recipientAddress, amount } = props;

        const onSendICP = async () => {
            setModalIsLoading(true);
            const e8s = toE8s(amount);
            const accountId = fromHexString(recipientAddress);
            const result = await navigationAndApiState.backendActor.transferICP(e8s, accountId);
            setModalIsLoading(false);
            setModalIsOpen(false);
            if("err" in result){
                alert("Error: " + Object.keys(result.err)[0]);
                return;
            } else {
                const {amountSent} = result.ok;
                alert(`${ fromE8s(parseInt(amountSent)) } ICP was successfully sent to ${recipientAddress}. Your balance may take up to 30 seconds to update`)
            }
        }

        return (
            <Grid display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'} width={"100%"}> 
                <DataField
                    label={'Recipient: '}
                    text={`${shortenHexString(recipientAddress)}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <Divider sx={DIVIDER_SX}/>
                <DataField
                    label={'Amount: '}
                    text={`${round8Decimals(amount) - 0.0001} ICP`}
                    disabled={true}
                    transparentBackground={true}
                />
                <Divider sx={DIVIDER_SX}/>
                <DataField
                    label={'Fee: '}
                    text={`0.0001 ICP`}
                    disabled={true}
                    transparentBackground={true}
                />
                <Divider sx={DIVIDER_SX}/>
                <DataField
                    label={'Total: '}
                    text={`${round8Decimals(amount)} ICP`}
                    disabled={true}
                    transparentBackground={true}
                />
                <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} width={"100%"} position={"fixed"} maxWidth={"700px"} bottom={0}>
                    <ButtonField
                        gridSx={{ margin: "2.5%", width: "40%", backgroundColor: CONTRAST_COLOR}}
                        color={BACKGROUND_COLOR}
                        sx={{width: "100%"}}
                        text={"send now"}
                        onClick={onSendICP}
                    />
                    <ButtonField
                        gridSx={{margin: "2.5%", width: "40%", backgroundColor: BACKGROUND_COLOR}}
                        color={CONTRAST_COLOR}
                        sx={{width: "100%"}}
                        text={"edit"}
                        onClick={() => returnToEdit({recipientAddress, amount})}
                    />
                </Grid>
            </Grid>
        )
    }

    const onViewSummary = () => {
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography>Summary</Typography>,
            components: [<RenderSummary recipientAddress={recipientAddress_} amount={amount_}/>],
        });
    }

    const onRenderQrReader = () => {
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography>Scan QR Code</Typography>,
            components: [<RenderQrReaderContent onCloseQrReader={returnToEdit}/>],
            handleReturn: returnToEdit,
        });
    }

    const onChangeRecipientAddress = (e) => { 
        setRecipientAddress_(e.target.value); 
        setHasError_1(!icpWalletAddressHasProperFormat(e.target.value) && !principalHasProperFormat(e.target.value));
    };

    const onChangeAmount = (e) => { 
        const parsedAmount = parseFloat(e.target.value);
        setAmount_(parsedAmount); 
        setHasError_2(Object.is(parsedAmount, NaN) || parsedAmount === 0);
    };

    const onClickMax = () => {
        setAmount_( fromE8s(parseFloat(walletState.walletData.balance)));
        setHasError_2(false);
    }

    return (
        <Grid display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'} width={"100%"}> 
            <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} width={"100%"}>
                <DataField
                    label={'Balance: '}
                    text={`${walletState.walletData.balance /  e8sInOneICP} ICP`}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            <Divider sx={DIVIDER_SX}/>
            <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} width={"100%"}>
                <InputBox
                    hasError={hasError_1}
                    label={"Recipient: "}
                    rows={"10"}
                    placeHolder={"Enter recipient address"}
                    value={recipientAddress_}
                    onChange={onChangeRecipientAddress}
                    width={"100%"}
                    ButtonComponent={
                        <ButtonField
                            elevation={0}
                            transparentBorder={true}
                            transparentBackground={true}
                            color={WHITE_COLOR}
                            onClick={onRenderQrReader}
                            Icon={CenterFocusWeakIcon}
                            iconSize={'medium'}
                        />
                    }
                />
            </Grid>
            {!hasError_1 &&
                <>
                    <Divider sx={DIVIDER_SX}/>
                    <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} width={"100%"}>
                        <InputBox
                        hasError={hasError_2}
                        label={"Amount: "}
                        rows={"10"}
                        value={amount_}
                        onChange={onChangeAmount}
                        allowNegative={false}
                        suffix={" ICP"}
                        maxDecimalPlaces={8}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        width={"100%"}
                        ButtonComponent={ <ButtonField text={"Max"} onClick={onClickMax} color={CONTRAST_COLOR} transparentBorder={true} transparentBackground={true}/> }
                        />
                    </Grid>
                    { !hasError_2 &&
                        <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} width={"100%"} maxWidth={"700px"} position={"fixed"} bottom={0}>
                                <ButtonField
                                gridSx={{margin: "2.5%", width: "95%", backgroundColor: CONTRAST_COLOR} }
                                color={BACKGROUND_COLOR}
                                text={"summary"}
                                disabled={hasError_1 || hasError_2 || !amount_}
                                    onClick={onViewSummary}
                                />
                        </Grid>
                    }
                </>
            }
        </Grid>
    )

};

export default SendFromWallet