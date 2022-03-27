import React, {useState, useContext} from "react";
import InputBox from "./Fields/InputBox";
import { AppContext } from "../Wallet.jsx";
import { fromHexString } from "../Utils.jsx";
import "./ModalContentOnSend.scss";
import { e8sInOneICP } from "../Constants";


const ModalContentOnSend = (props) => {

    const {
        setShowModal,
        showModal
    } = props;

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountToSend, setAmountToSend] = useState('');
    const [sendSuccessful, setSendSuccessful] = useState(false);
    const [responseFromApi, setResponseFromApi] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const {actor} = useContext(AppContext);


    const onCancel = () => {
        setShowModal(false);
    };

    const onSendConfirm = async () => {
        console.log(fromHexString(recipientAddress));
        setIsLoading(true);
        await actor.transferICP(
            parseInt(amountToSend * e8sInOneICP), fromHexString(recipientAddress)
            ).then((status) => {
                setResponseFromApi(true);
                if("ok" in status){
                    setSendSuccessful(true);
                } else {
                    setSendSuccessful(false);
                }
            }
        );
        setIsLoading(false);
    };

    const onClick = () => {
        setSendSuccessful(false);
        setResponseFromApi(false);
        setShowModal(false);

    };
    console.log("ResponseFromApi: ",responseFromApi);
    console.log("Send Successful: ",sendSuccessful)

    return(
        <React.Fragment>
            { isLoading ?
                <>
                    <img className={'loadGif'} src="Loading.gif" alt="Load Gif" />
                </> :
                <>
                    { responseFromApi ? 
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
                        </div> :
                        <div className="sendContentDiv">
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
                                <button className='button' onClick={onSendConfirm}> Send </button>
                                <button className='button' onClick={onCancel}> Cancel </button> 
                            </div>

                        </div>
                    }
                </>
            }

        </React.Fragment>

    )
}

export default ModalContentOnSend;