import React, {useState, useContext } from "react";
import InputBox from "../../../Components/Fields/InputBox";
import { AppContext } from "../../Wallet.jsx";
import { fromHexString } from "../../../functionsAndConstants/Utils.jsx";
import "./ModalContentOnSend.scss";
import { toE8s, fromE8s } from "../../../functionsAndConstants/Utils.jsx";
import { QrReaderContent } from "../../../functionsAndConstants/walletFunctions/ScanQrCode";
import { MODALS_TYPES } from "../../../functionsAndConstants/Constants";
import { types } from "../../../reducers/journalReducer";
import ButtonField from "../../../Components/Fields/Button";
import { modalTypes } from "../../../reducers/modalReducer";

const ModalContentOnSend = (props) => {

    const fee = 0.0001;

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountToSend, setAmountToSend] = useState('');
    const [sendSuccessful, setSendSuccessful] = useState(false);
    const [responseFromApi, setResponseFromApi] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showQrReader, setShowQrReader] = useState(false);
    const {actorState, modalState, modalDispatch} = useContext(AppContext);


    const onCancel = () => {
        setShowSummary(false);
        setSendSuccessful(false);
        setResponseFromApi(false);
        modalDispatch({
            actionType: modalTypes.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSend}
        });
    };

    const showTxSummary = () => {
        setShowSummary(true);
    }

    const onSendConfirm = async () => {
        setIsLoading(true);
        await actorState.backendActor.transferICP(
            parseInt(toE8s(amountToSend)), fromHexString(recipientAddress)
            ).then((status) => {
                setResponseFromApi(true);
                if("ok" in status){
                    setSendSuccessful(true);
                } else {
                    setSendSuccessful(false);
                }
            }
        ).catch(error => {
            setResponseFromApi(true);
            setSendSuccessful(false);
        });
        setIsLoading(false);
    };

    const onClick = () => {
        setShowSummary(false);
        setSendSuccessful(false);
        setResponseFromApi(false);
        modalDispatch({
            actionType: modalTypes.SET_MODAL_STATUS,
            payload: {show: false, which:MODALS_TYPES.onSend}
        });
    };

    const ApiResponseContent = () => {
        
        return(
            <div className={'ApiResponseModalContentContainer'}>
                <div className={`ApiResponseModalContentDiv__${sendSuccessful ? 'success' : 'fail'}`}>
                    { sendSuccessful ?
                    <>
                        <h2 className={"onSendResponsMessage"}>
                            Payment Successfully Sent
                        </h2>
                        <img className={'checkMarkImg'} src="check-mark.png" alt="Check Mark" />
                    </>
                        :
                        <h2>
                            Error Occurred
                        </h2>
                    }
                </div>
                <ButtonField
                    text={'Ok'}
                    className={'buttonDiv'}
                    onClick={onClick}
                    withBox={true}
                />
            </div> 
        );
    }

    const SummaryContent = () => {

        return(
            <div className={'summaryContentDiv'}>
                <div className="recipientAddressDiv">
                    <h4> Recipient Address: </h4>
                    <h4> {recipientAddress.slice(0,4)} ... {recipientAddress.slice(-4)}  </h4>
                </div>
                <div className="ammountDiv">
                    <h4> Transaction Fee: </h4>
                    <h4> {fee} ICP </h4>
                </div>
                <div className="ammountDiv">
                    <h4> Send Amount: </h4>
                    <h4> {fromE8s(toE8s(amountToSend) + toE8s(fee))} ICP </h4>
                </div>
                <div className='ModalContentOnSendButtons'>
                    <ButtonField
                        text={'Send'}
                        className={'button'}
                        onClick={onSendConfirm}
                        withBox={true}
                    />
                    <ButtonField
                        text={'Cancel'}
                        className={'button'}
                        onClick={onCancel}
                        withBox={true}
                    />
                </div> 
            </div>
        )
    }

    const InputTransaction = () => {
        return (
            <div className="sendContentDiv">
                <ButtonField
                    text={'Scan QR Code'}
                    className={'ModalContentOnSendQRButton'}
                    onClick={() => setShowQrReader(!showQrReader)}
                    withBox={true}
                />
                <div className="recipientAddressDiv">
                    <InputBox
                        label={"Recipient Address: "}
                        rows={"1"}
                        setParentState={setRecipientAddress}
                        value={ modalState.modalStatus.show ? recipientAddress : ''}
                    />
                </div>
                <div className="ammountDiv">
                    <InputBox
                        label={"Amount: "}
                        rows={"1"}
                        setParentState={setAmountToSend}
                        value={modalState.modalStatus.show ? amountToSend : 0}
                    />
                </div>
                <div className='ModalContentOnSendButtons'>
                    <ButtonField
                        text={'Summary'}
                        className={'button'}
                        onClick={showTxSummary}
                        withBox={true}
                    />
                    <ButtonField
                        text={'Cancel'}
                        className={'button'}
                        onClick={onCancel}
                        withBox={true}
                    />
                </div> 
            </div>
        )
    }

    return(
        <React.Fragment>
            { isLoading ?
                <>
                    <img className={'loadGif'} src="Loading.gif" alt="Load Gif" />
                </> :
                <>
                    { responseFromApi ? 
                        ApiResponseContent() :
                        <>
                            { showSummary ? 
                                SummaryContent() :
                                    showQrReader ? 
                                        <QrReaderContent
                                            showQrReader={showQrReader}
                                            setRecipientAddress={setRecipientAddress}
                                            setShowQrReader={setShowQrReader}
                                        /> :
                                        InputTransaction()
                            }
                        </>
                        
                    }
                </>
            }

        </React.Fragment>

    )
}

export default ModalContentOnSend;