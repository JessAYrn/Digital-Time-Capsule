import React from 'react';
import "./ModalContentExitWithoutSubmitModal.scss";

const ExitWithoutSubmit = (props) => {

    const{
        showModal,
        setShowModal,
        handleSubmit,
        closePage,
        hasError
    } = props;

    const onClickSubmit = () => {
        setShowModal(false);
        handleSubmit();
    };

    const onClickExit = () => {
        setShowModal(false);
        closePage();
    };

    return(
        <div className={'exitWithoutSubmitCotentDiv'}>  
            { hasError ? 
            <>
                <h1>
                    Error: cannot sumbit due to error with uploaded file
                </h1>
                <div className={'buttonDiv__ok'}>
                    <button className='button' onClick={onClickSubmit}> OK </button> 
                </div>  
            </> :
            <>
                <h1>
                    Would you like to submit this journal entry?
                </h1>
                <div className={'buttonDiv'}>
                    <button className='button' onClick={onClickSubmit}> Yes, I almost forgot </button> 
                </div>   
                <div className={'buttonDiv'}>
                    <button className='button' onClick={onClickExit}> No, Don't worry about it  </button> 
                </div>  
            </> 
            }
        </div>

    )


};

export default ExitWithoutSubmit