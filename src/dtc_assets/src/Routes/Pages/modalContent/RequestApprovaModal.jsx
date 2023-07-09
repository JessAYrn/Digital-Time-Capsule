import React, {useContext} from "react";
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as TreasuryContext} from '../../Treasury';
import { AppContext as GroupJournalContext} from '../../GroupJournal';
import { UI_CONTEXTS, retrieveContext } from '../../../functionsAndConstants/Contexts';
import { initialState as journalInitialState, types as journalTypes } from "../../../reducers/journalReducer";
import "./RequestApprovaModal.scss";
import { ConnectButton, ConnectDialog, useConnect } from "@connect2ic/react";
import LoadScreen from "../LoadScreen";
import { homePageTypes, initialState as homePageInitialState } from "../../../reducers/homePageReducer";
import { walletTypes, initialState as walletInitialState } from "../../../reducers/walletReducer";
import { accountTypes, initialState as accountInitialState } from "../../../reducers/accountReducer";

const RequestApprovalResponseModal = (props) => {

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
        homePageState, 
        homePageDispatch, 
        accountState, 
        accountDispatch, 
        walletState,
        walletDispatch
    } = useContext(AppContext);

    let state;
    let dispatch;
    let initialState;
    let action;

    if(context === UI_CONTEXTS.JOURNAL){
        state = journalState;
        dispatch = journalDispatch;
        action = journalTypes.SET_ENTIRE_REDUX_STATE;
        initialState = journalInitialState;
    }
    if(context === UI_CONTEXTS.HOME_PAGE){
        state = homePageState;
        dispatch = homePageDispatch;
        action = homePageTypes.SET_ENTIRE_DASHBOARD_REDUX_STATE;
        initialState = homePageInitialState;
    }
    if(context === UI_CONTEXTS.WALLET){
        state = walletState;
        dispatch = walletDispatch;
        action = walletTypes.SET_ENTIRE_WALLET_REDUX_STATE;
        initialState = walletInitialState;
    }
    if(context === UI_CONTEXTS.ACCOUNT_PAGE){
        state = accountState;
        dispatch = accountDispatch;
        action = accountTypes.SET_ENTIRE_ACCOUNT_REDUX_STATE;
        initialState = accountInitialState;
    }

    useConnect({
        onConnect: () => {},
        onDisconnect: () => {
            dispatch({
                actionType: action,
                payload: initialState
            });
        }
    });

    return (
        state.isLoading ? 
        <LoadScreen/> :
        <div className="contentDiv__requestApprovalResponse">
            { journalState.modalStatus.success ? 
                <>
                    <h3 className='success'>
                        Request Sent. Log in again after you've received approval.
                    </h3>
                </> :
                <>
                    <h3 className='fail'>
                        The owner is not receiving request at the moment.
                    </h3>
                </>
            }
            <ConnectButton/>
            <ConnectDialog />
        </div>
    )

};

export default RequestApprovalResponseModal;