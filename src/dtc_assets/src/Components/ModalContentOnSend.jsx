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
    const {actor} = useContext(AppContext);


    const onCancel = () => {
        setShowModal(false);
    };

    const onSendConfirm = async () => {
        console.log(fromHexString(recipientAddress));
        const status = await actor.transferICP(parseInt(amountToSend * e8sInOneICP), fromHexString(recipientAddress));
        console.log(status);
    };

    return(
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
    )
}

export default ModalContentOnSend;