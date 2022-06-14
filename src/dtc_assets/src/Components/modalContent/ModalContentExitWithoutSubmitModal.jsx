import React, { useContext} from 'react';
import { MODALS_TYPES } from '../../Constants';
import { AppContext } from '../../App';
import "./ModalContentExitWithoutSubmitModal.scss";
import { types } from '../../reducers/journalReducer';

const ExitWithoutSubmit = (props) => {

    const{
        index
    } = props;

    const {
        journalState,
        dispatch
    } = useContext(AppContext);

    const indexOfNewPage = journalState.journal.length - 1;
    const newPage = journalState.journal[indexOfNewPage];


    const onClickSubmit = () => {
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
        });
        dispatch({
            actionType: types.CHANGE_PAGE_IS_OPEN,
            payload: false,
            index: index
        })
        journalState.handlePageSubmitFunction();
    };

    const onClickExit = () => {
        dispatch({
            actionType: types.REMOVE_UNSUBMITTED_PAGE
        });
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
        });
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