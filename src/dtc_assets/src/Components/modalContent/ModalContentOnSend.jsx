import React, {useState, useContext, useEffect} from "react";
import InputBox from "../Fields/InputBox";
import { AppContext } from "../../Wallet.jsx";
import { fromHexString } from "../../Utils.jsx";
import "./ModalContentOnSend.scss";
import { toE8s, fromE8s } from "../../Utils.jsx";
import { QrReaderContent } from "../walletFunctions/ScanQrCode";

const ModalContentOnSend = (props) => {

    const {
        setShowModal,
        showModal
    } = props;

    const fee = 0.1;

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountToSend, setAmountToSend] = useState('');
    const [sendSuccessful, setSendSuccessful] = useState(false);
    const [responseFromApi, setResponseFromApi] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showQrReader, setShowQrReader] = useState(false);
    const {actor} = useContext(AppContext);


    const onCancel = () => {
        setShowSummary(false);
        setSendSuccessful(false);
        setResponseFromApi(false);
        setShowModal(false);
    };

    const showTxSummary = () => {
        setShowSummary(true);
    }

    const onSendConfirm = async () => {
        console.log(fromHexString(recipientAddress));
        setIsLoading(true);
        await actor.transferICP(
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
        setShowModal(false);

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

                <div className={'buttonDiv'}>
                    <button className='button' onClick={onClick}> OK </button> 
                </div> 
            </div> 
        );
    }

    const SummaryContent = () => {

        return(
            <div className={'summaryContentDiv'}>
                <div className="recipientAdressDiv">
                    <h5> Recipient Address: </h5>
                    <h6> {recipientAddress.slice(0,9)} ... {recipientAddress.slice(-10)}  </h6>
                </div>
                <div className="ammountDiv">
                    <h5> Transaction Fee: </h5>
                    <h6> {fee} ICP </h6>
                </div>
                <div className="ammountDiv">
                    <h5> Send Amount: </h5>
                    <h6> {fromE8s(toE8s(amountToSend) - toE8s(fee))} ICP </h6>
                </div>
                <div className='ModalContentOnSendButtons'>
                    <button className='button' onClick={onSendConfirm}> Send </button>
                    <button className='button' onClick={onCancel}> Cancel </button> 
                </div> 
            </div>
        )
    }

    const InputTransaction = () => {
        return (
            <div className="sendContentDiv">
                <div className='ModalContentOnSendQRButton'>
                    <button className='button' onClick={() => setShowQrReader(!showQrReader)}> Scan QR Code </button>
                </div> 
                <div className="recipientAdressDiv">
                    <InputBox
                        label={"Recipient Address: "}
                        rows={"1"}
                        setParentState={setRecipientAddress}
                        value={ showModal ? recipientAddress : ''}
                    />
                </div>
                <div className="ammountDiv">
                    <InputBox
                        label={"Amount: "}
                        rows={"1"}
                        setParentState={setAmountToSend}
                        value={showModal ? amountToSend : 0}
                    />
                </div>
                <div className='ModalContentOnSendButtons'>
                    <button className='button' onClick={showTxSummary}> Summary </button>
                    <button className='button' onClick={onCancel}> Cancel </button> 
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