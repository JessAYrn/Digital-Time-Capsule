import React from 'react';
import { MODALS_TYPES } from '../../Constants';
import "./ModalContentOnSubmit.scss";

const ModalContentSubmit = (props) => {

    const {
        success,
        setSuccess,
        setModalStatus,
        closePage
    } = props;

    const onClick = () => {
        if(closePage){
            closePage();
        }
        setModalStatus({show: false, which: MODALS_TYPES.onSubmit});
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
                        Submit Failed:
                    </h1>
                    <h4>
                        you must have atleast 1 ICP in your wallet in order to submit an entry
                    </h4>
                </div>
            }
            <div className={'buttonDiv'}>
                <button className='button' onClick={onClick}> OK </button> 
            </div>       
                    

        </div>
    )

};

export default ModalContentSubmit;