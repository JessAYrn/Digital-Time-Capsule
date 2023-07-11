import React, {useContext, useMemo, useEffect} from 'react';
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as TreasuryContext} from '../../Treasury';
import { AppContext as GroupJournalContext} from '../../GroupJournal';
import { MODALS_TYPES } from '../../../functionsAndConstants/Constants';
import FileHasError from './ModalContentHasError';
import ExitWithoutSubmit from './ModalContentExitWithoutSubmitModal';
import Notifications from './ModalContentNotifications';
import ModalContentOnSend from './ModalContentOnSend';
import ModalContentSubmit from './ModalContentOnSubmit';
import NotAuthorizedByOwner from "./NotAuthorizedByOwner";
import RegistrationResponse from './RegistrationResponseModal';
import RequestApprovalResponseModal from './RequestApprovaModal';
import DateOutOfRange from './DateOutOfRange';
import "./Modal.scss";
import '../../../SCSS/contentContainer.scss'
import { retrieveContext } from '../../../functionsAndConstants/Contexts';

export const Modal = (props) => {

    const {
        handleSubmit,
        hasError,
        index,
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
    
    const { journalState, journalDispatch } = useContext(AppContext);

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
        } else if(journalState.modalStatus.which === MODALS_TYPES.notAuthorizedByOwner){
            ChildComp = NotAuthorizedByOwner;
        } else if(journalState.modalStatus.which === MODALS_TYPES.onRegisterNewOwner){
            ChildComp = RegistrationResponse
        } else if(journalState.modalStatus.which === MODALS_TYPES.requestApprovalRepsonse){
            ChildComp = RequestApprovalResponseModal;
        } else if(journalState.modalStatus.which === MODALS_TYPES.dateSelectedOutOfRange){
            ChildComp = DateOutOfRange;
        }

        return ChildComp;
    },[ journalState.modalStatus]);

    return(
        <> 
            { journalState.modalStatus.show ? 
            <div className={"modalContainer"}>
                <div className="modalDiv" >
                    <div className={`modalTransparentDiv contentContainer`}>
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
            </div>
             :
                null
            }
        </>
    )

}