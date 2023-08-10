import React, {useContext}from 'react';
import './NotAuthorizedByOwner.scss'
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as TreasuryContext} from '../../Treasury';
import { AppContext as GroupJournalContext} from '../../GroupJournal';
import { retrieveContext, UI_CONTEXTS } from '../../../functionsAndConstants/Contexts';
import { types as journalTypes } from '../../../reducers/journalReducer';
import { homePageTypes } from '../../../reducers/homePageReducer';
import { accountTypes } from '../../../reducers/accountReducer';
import { walletTypes } from '../../../reducers/walletReducer';
import { MODALS_TYPES } from '../../../functionsAndConstants/Constants';
import ButtonField from '../../../Components/Fields/Button';
import LoadScreen from '../LoadScreen';
import { modalTypes } from '../../../reducers/modalReducer';

const NotAuthorizedByOwner = (props) => {
    const { context } = props;

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    const {
        actorState,
        modalState, 
        modalDispatch

    } = useContext(AppContext);


    const handleSubmitRequest = async () => {
        modalDispatch({
            actionType: modalTypes.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.requestApproval();
        if("ok" in result){
            modalDispatch({
                actionType: modalTypes.SET_MODAL_STATUS,
                payload: { show: true, which: MODALS_TYPES.requestApprovalRepsonse, success: true}
            });
        } else {
            modalDispatch({
                actionType: modalTypes.SET_MODAL_STATUS,
                payload: { show: true, which: MODALS_TYPES.requestApprovalRepsonse, success: false}
            });
        }
        modalDispatch({
            actionType: modalTypes.SET_IS_LOADING,
            payload: false
        });
    };

    return (
        modalState.isLoading ? 
        <LoadScreen/> :
        <div className="contentDiv__notAuthorized">
            <ul>
                <li>
                    <h6>
                        Your Principal Has Not Been Granted Access to This Application. 
                    </h6>
                </li>
                <li>
                    <h6>
                        Only the owner of this application may grant access to principals. 
                    </h6>
                </li>
                <li>
                    <h6>
                        If you are the owner of this application, attempting to log in for the first time, you must log in using the wallet that
                        owns the Utility NFT that corresponds to this server.
                    </h6>
                </li>
            </ul>
            <ButtonField
                text={'Request Approval'}
                className={'button'}
                onClick={handleSubmitRequest}
                withBox={true}
            />
        </div>
    )
};

export default NotAuthorizedByOwner;