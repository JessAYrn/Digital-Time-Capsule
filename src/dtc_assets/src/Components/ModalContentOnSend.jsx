import React, {useState} from "react";
import InputBox from "./Fields/InputBox";
import "./ModalContentOnSend.scss";


const ModalContentOnSend = (props) => {

    const {
        setShowModal,
        showModal
    } = props;

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountToSend, setAmountToSend] = useState(0);

    const onCancel = () => {
        setShowModal(false);
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
                <button className='button' onClick={() => {}}> Send </button>
                <button className='button' onClick={onCancel}> Cancel </button> 
            </div>

        </div>
    )
}

export default ModalContentOnSend;