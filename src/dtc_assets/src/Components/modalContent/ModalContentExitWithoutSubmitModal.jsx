import React from 'react';
import { MODALS_TYPES } from '../../Constants';
import "./ModalContentExitWithoutSubmitModal.scss";

const ExitWithoutSubmit = (props) => {

    const{
        setModalStatus,
        handleSubmit,
        closePage
    } = props;

    const onClickSubmit = () => {
        setModalStatus({show: false, which: MODALS_TYPES.onSubmit});
        handleSubmit();
    };

    const onClickExit = () => {
        setModalStatus({show: false, which: MODALS_TYPES.onSubmit});
        closePage();
    };

    return(
        <div className={'exitWithoutSubmitCotentDiv'}>  
            <h1>
                Would you like to submit this journal entry?
            </h1>
            <div className={'buttonDiv'}>
                <button className='button' onClick={onClickSubmit}> Yes, I almost forgot </button> 
            </div>   
            <div className={'buttonDiv'}>
                <button className='button' onClick={onClickExit}> No, Don't worry about it  </button> 
            </div>  
        </div>

    )


};

export default ExitWithoutSubmit