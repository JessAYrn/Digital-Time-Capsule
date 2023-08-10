import React, {useContext} from 'react';
import { MODALS_TYPES } from '../../../functionsAndConstants/Constants';
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as TreasuryContext} from '../../Treasury';
import { AppContext as GroupJournalContext} from '../../GroupJournal';
import { retrieveContext } from '../../../functionsAndConstants/Contexts';
import ButtonField from '../../../Components/Fields/Button';

import "./ModalContentOnSubmit.scss";
import { modalTypes } from '../../../reducers/modalReducer';

const ModalContentSubmit = (props) => {

    const {
        context
    } = props;

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    const { modalState, modalDispatch } = useContext(AppContext);
    
    const onClick = () => {
        modalDispatch({
            actionType: modalTypes.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
        });
    };

    return(
        <div className={'onSubmitModalContentDiv'}>
            { modalState.modalStatus.success ? 
                <div className={"submitSucessful"}> 
                    <h1>
                        Submit Successful
                    </h1>
                    <img className={'checkMarkImg'} src="check-mark.png" alt="Check Mark" />
                </div> 
                :
                <div className={"submitFailed"}> 
                    <h1>
                        Submit Failed:
                    </h1>
                    <h4>
                        An error occured while attempting to submit your journal entry
                    </h4>
                </div>
            }
            <ButtonField
                text={'OK'}
                className={'buttonDiv'}
                onClick={onClick}
                withBox={true}
            />      
        </div>
    )

};

export default ModalContentSubmit;