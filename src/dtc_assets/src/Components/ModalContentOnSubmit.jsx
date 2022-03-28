import React from 'react';
import "./ModalContentOnSubmit.scss";

const ModalContentSubmit = (props) => {

    const {
        success,
        setSuccess,
        setShowModal,
    } = props;

    const onClick = () => {
        setShowModal(false);
        setSuccess(null);
    };

    return(
        <div className={'onSubmitModalContentDiv'}>
            { success ? 
                <div className={"submitSucessful"}> 
                    <h1>
                        Submit Successful
                    </h1>
                    <img className={'checkMarkImg'} src="check-mark.png" alt="Check Mark" />
                </div> :
                <div className={"submitFailed"}> 
                    <h1>
                        Submit Failed
                    </h1>
                </div>
            }
            <div className={'buttonDiv'}>
                <button className='button' onClick={onClick}> OK </button> 
            </div>       
                    

        </div>
    )

};

export default ModalContentSubmit;