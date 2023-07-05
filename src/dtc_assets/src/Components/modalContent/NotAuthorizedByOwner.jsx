import React, {useContext}from 'react';
import './NotAuthorizedByOwner.scss'
import { AppContext as AccountContext} from '../../Routes/Account';
import { AppContext as HomePageContext} from '../../Routes/HomePage';
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext} from '../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../Routes/GroupJournal';
import { retrieveContext, UI_CONTEXTS } from '../../Contexts';
import { types as journalTypes } from '../../reducers/journalReducer';
import { homePageTypes } from '../../reducers/homePageReducer';
import { accountTypes } from '../../reducers/accountReducer';
import { walletTypes } from '../../reducers/walletReducer';
import { MODALS_TYPES } from '../../Constants';
import ButtonField from '../Fields/Button';
import LoadScreen from '../LoadScreen';

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
        journalState, 
        journalDispatch, 
        actorState, 
        actorDispatch, 
        homePageState, 
        homePageDispatch,
        accountState,
        accountDispatch,
        walletState,
        walletDispatch

    } = useContext(AppContext);

    let state;
    let dispatch;
    let action;

    if(context === UI_CONTEXTS.JOURNAL){
        dispatch = journalDispatch;
        state = journalState;
        action = journalTypes.SET_IS_LOADING;
    };
    if(context === UI_CONTEXTS.HOME_PAGE){
        dispatch = homePageDispatch
        state = homePageState
        action = homePageTypes.SET_IS_LOADING
    };
    if(context === UI_CONTEXTS.WALLET){
        dispatch = walletDispatch
        state = walletState
        action = walletTypes.SET_IS_LOADING
    };
    if(context === UI_CONTEXTS.ACCOUNT_PAGE){
        dispatch = accountDispatch
        state = accountState
        action = accountTypes.SET_IS_LOADING
    };

    const handleSubmitRequest = async () => {
        dispatch({
            actionType: action,
            payload: true
        });
        let result = await actorState.backendActor.requestApproval();
        if("ok" in result){
            journalDispatch({
                actionType: journalTypes.SET_MODAL_STATUS,
                payload: { show: true, which: MODALS_TYPES.requestApprovalRepsonse, success: true}
            });
        } else {
            journalDispatch({
                actionType: journalTypes.SET_MODAL_STATUS,
                payload: { show: true, which: MODALS_TYPES.requestApprovalRepsonse, success: false}
            });
        }
        dispatch({
            actionType: journalTypes.SET_IS_LOADING,
            payload: false
        });
    };

    return (
        state.isLoading ? 
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