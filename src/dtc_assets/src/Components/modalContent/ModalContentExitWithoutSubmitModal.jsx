import React, { useContext} from 'react';
import { MODALS_TYPES } from '../../Constants';
import { AppContext } from '../../App';
import "./ModalContentExitWithoutSubmitModal.scss";
import { types } from '../../reducers/journalReducer';

const ExitWithoutSubmit = (props) => {

    const{
        setModalStatus,
        handleSubmit,
        closePage
    } = props;

    const {
        journalState,
        dispatch
    } = useContext(AppContext);

    const indexOfNewPage = journalState.journal.length - 1;
    const newPage = journalState.journal[indexOfNewPage];


    const onClickSubmit = () => {
        setModalStatus({show: false, which: MODALS_TYPES.onSubmit});
        handleSubmit();
    };

    const onClickExit = () => {
        dispatch({
            actionType: types.REMOVE_UNSUBMITTED_PAGE
        })
        setModalStatus({show: false, which: MODALS_TYPES.onSubmit});
        closePage();
    };

    return(
        <div className={'exitWithoutSubmitCotentDiv'}>  
            <h1>
                Would you like to submit this journal entry?
            </h1>
            <div className={'buttonDiv'}>
                <button 
                    className='button' 
                    onClick={onClickSubmit}
                    disabled={newPage.file1.isLoading || newPage.file2.isLoading}
                > Yes, I almost forgot 
                </button> 
            </div>   
            <div className={'buttonDiv'}>
                <button 
                    className='button' 
                    onClick={onClickExit}
                    disabled={newPage.file1.isLoading || newPage.file2.isLoading}
                > No, Don't worry about it  </button> 
            </div>  
        </div>

    )


};

export default ExitWithoutSubmit