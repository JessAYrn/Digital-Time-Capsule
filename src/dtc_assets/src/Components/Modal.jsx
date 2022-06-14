import React, {useContext, useMemo} from 'react';
import { UI_CONTEXTS } from '../Contexts';
import { AppContext as AccountContext } from '../Account';
import { AppContext as WalletContext} from '../Wallet';
import { AppContext as HomePageContext} from '../HomePage';
import { AppContext as NftContext} from '../NFTs';
import { AppContext as JournalContext} from '../App';
import { MODALS_TYPES } from '../Constants';
import FileHasError from './modalContent/ModalContentHasError';
import ExitWithoutSubmit from './modalContent/ModalContentExitWithoutSubmitModal';
import Notifications from './modalContent/ModalContentNotifications';
import ModalContentOnSend from './modalContent/ModalContentOnSend';
import ModalContentSubmit from './modalContent/ModalContentOnSubmit';
import "./Modal.scss";

export const Modal = (props) => {

    const {
        handleSubmit,
        hasError,
        index,
        context
    } = props;

    let AppContext;
    if(context === UI_CONTEXTS.JOURNAL){
        AppContext = JournalContext;
    }
    if(context === UI_CONTEXTS.NFT){
        AppContext = NftContext
    }
    if(context === UI_CONTEXTS.HOME_PAGE){
        AppContext = HomePageContext;
    }
    if(context === UI_CONTEXTS.WALLET){
        AppContext = WalletContext
    }
    if(context === UI_CONTEXTS.ACCOUNT_PAGE){
        AppContext = AccountContext;
    }
    
    const { actor, journalState, dispatch } = useContext(AppContext);

    const ChildComponent = useMemo(() => {

        let ChildComp;
        if(journalState.modalStatus.which === MODALS_TYPES.fileHasError) {
            ChildComp = FileHasError;
        } else if(journalState.modalStatus.which === MODALS_TYPES.exitWithoutSubmit) {
            ChildComp = ExitWithoutSubmit;
        } else if(journalState.modalStatus.which === MODALS_TYPES.onSend) {
            ChildComp = ModalContentOnSend;
        } else if(journalState.modalStatus.which === MODALS_TYPES.onSubmit) {
            ChildComp = ModalContentSubmit;
        } else if(journalState.modalStatus.which === MODALS_TYPES.notifications) {
            ChildComp = Notifications;
        }

        return ChildComp;
    },[
        journalState.modalStatus
    ]);


    return(
        <> 
            { journalState.modalStatus.show ? 
            <div className="modalDiv" >
                <div className={'modalBackground'}>
                    <div className='modalTransparentDiv'>
                        <div className={'modalWrapper'}>
                            <ChildComponent
                                hasError={hasError}
                                context={context}
                                index={index}
                                handleSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                </div>
            </div> :
                null
            }
        </>
    )

}