import React, { useContext, useMemo } from 'react';
import { MODALS_TYPES } from '../../Constants';
import { AppContext } from '../../Routes/App';
import "./ModalContentExitWithoutSubmitModal.scss";
import { types } from '../../reducers/journalReducer';
import ButtonField from '../Fields/Button';

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

    let filesAreLoading = useMemo(() => {
        let filesLoading = false;
        journalState.journal[indexOfNewPage].filesMetaData.forEach(file => {
            if(file.isLoading) filesLoading = file.isLoading;
        });
        return filesLoading;
    }, [journalState.journal[indexOfNewPage].filesMetaData]);


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
            <h3>
                Would you like to submit this journal entry?
            </h3>
            <ButtonField
                text={'Yes'}
                className={'buttonDiv'}
                onClick={onClickSubmit}
                disabled={filesAreLoading}
                withBox={true}
            />
            <ButtonField
                text={"No"}
                className={'buttonDiv'}
                onClick={onClickExit}
                disabled={filesAreLoading}
                withBox={true}
            /> 
        </div>

    )


};

export default ExitWithoutSubmit