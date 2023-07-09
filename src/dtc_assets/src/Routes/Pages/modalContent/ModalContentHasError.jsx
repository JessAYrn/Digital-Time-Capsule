import React, {useContext} from 'react';
import { MAX_DURATION_OF_VIDEO_IN_SECONDS } from '../../../functionsAndConstants/Constants';
import { AppContext } from '../../App';
import { MODALS_TYPES } from '../../../functionsAndConstants/Constants';
import { round2Decimals } from '../../../functionsAndConstants/Utils';
import "./ModalContentHasError.scss";
import { types } from '../../../reducers/journalReducer';
import ButtonField from '../../../Components/Fields/Button';
const FileHasError = (props) => {

    const { journalState, journalDispatch } = useContext(AppContext);


    const onClickOk = () => {
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
        });
    };

    return(
        <div className={'fileHasErrorCotentDiv'}>  
            <ul className={'list'}>
                <h1 className={'h1'}>
                    Error:
                </h1>
                
                <li>
                    <h6 className={'h6'}>
                        file must be less than or equal to { MAX_DURATION_OF_VIDEO_IN_SECONDS - 1} seconds
                        after compression and upload.
                    </h6>
                </li>
                <li>
                    <h6 className={'h6'}>
                        Your file is {round2Decimals(journalState.modalStatus.duration)} seconds.
                    </h6>
                </li>
                <li>
                    <h6 className={'h6'}>
                        Try trimming and re-uploading file.
                    </h6>
                </li> 
            </ul> 
            <ButtonField
                text={'OK'}
                className={'buttonDiv__ok'}
                onClick={onClickOk}
                withBox={true}
            />
        </div>

    )


};

export default FileHasError;