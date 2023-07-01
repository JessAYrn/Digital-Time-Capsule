import React, {useContext, useMemo, useEffect} from 'react';
import { UI_CONTEXTS } from '../Contexts';
import { AppContext as AccountContext } from '../Routes/Account';
import { AppContext as WalletContext} from '../Routes/Wallet';
import { AppContext as HomePageContext} from '../Routes/HomePage';
import { AppContext as JournalContext} from '../Routes/App';
import { AppContext as TreasuryContext} from '../Routes/Treasury';
import { MODALS_TYPES } from '../Constants';
import FileHasError from './modalContent/ModalContentHasError';
import ExitWithoutSubmit from './modalContent/ModalContentExitWithoutSubmitModal';
import Notifications from './modalContent/ModalContentNotifications';
import ModalContentOnSend from './modalContent/ModalContentOnSend';
import ModalContentSubmit from './modalContent/ModalContentOnSubmit';
import NotAuthorizedByOwner from "./modalContent/NotAuthorizedByOwner";
import RegistrationResponse from './modalContent/RegistrationResponseModal';
import RequestApprovalResponseModal from './modalContent/RequestApprovaModal';
import { getIntObserverFunc, visibilityFunctionDefault } from './animations/IntersectionObserverFunctions';
import DateOutOfRange from './modalContent/DateOutOfRange';
import "./Modal.scss";
import '../SCSS/contentContainer.scss'

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
    if(context === UI_CONTEXTS.HOME_PAGE){
        AppContext = HomePageContext;
    }
    if(context === UI_CONTEXTS.WALLET){
        AppContext = WalletContext
    }
    if(context === UI_CONTEXTS.ACCOUNT_PAGE){
        AppContext = AccountContext;
    }
    if(context === UI_CONTEXTS.TREASURY){
        AppContext = TreasuryContext;
    }
    
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
    },[
        journalState.modalStatus
    ]);

    useEffect(() => {
        const containers = document.querySelectorAll(".contentContainer.animatedLeft");
        containers.forEach( (container, index) => {
            let props_ = {
                className: "animatedLeft",
                containerIndex: index,
                visibilityFunction: visibilityFunctionDefault
            };
            const observer = new IntersectionObserver(getIntObserverFunc(props_), {threshold: .1});
            observer.observe(container);
        });
    }, [journalState]);

    let animatedLeftElementIndex = 0;

    return(
        <> 
            { journalState.modalStatus.show ? 
            <div className={"modalContainer"}>
                <div className="modalDiv" >
                    <div className={`modalTransparentDiv contentContainer _${animatedLeftElementIndex} animatedLeft`}>
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