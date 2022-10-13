import React, {useContext}from 'react';
import { logout } from '../authentication/AuthenticationMethods';
import './NotAuthorizedByOwner.scss'
import { AppContext as NftContext} from '../../NFTs';
import { AppContext as  WalletContext} from '../../Wallet';
import { AppContext as JournalContext } from '../../App';
import { AppContext as  HomePageContext} from '../../HomePage';
import { AppContext as  AccountContext} from '../../Account';
import { UI_CONTEXTS } from '../../Contexts';
import { types } from '../../reducers/journalReducer';
import { MODALS_TYPES } from '../../Constants';
const NotAuthorizedByOwner = (props) => {
    const {
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
    const {journalState, dispatch} = useContext(AppContext);

    const handleClick = async () => {
        await logout(journalState, dispatch);
    }; 

    const handleSubmitRequest = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await journalState.actor.requestApproval();
        console.log(result);
        if("ok" in result){
            dispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: { show: true, which: MODALS_TYPES.requestApprovalRepsonse, success: true}
            });
        } else {
            dispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: { show: true, which: MODALS_TYPES.requestApprovalRepsonse, success: false}
            });
        }
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    return (
        <div className="contentDiv__notAuthorized">
            <ul>
                <li>
                    <h3>
                        Your Principal Has Not Been Granted Access to This Application. 
                    </h3>
                </li>
                <li>
                    <h3>
                        Only the owner of this application may grant access to principals. 
                    </h3>
                </li>
                <li>
                    <h3>
                        If you are the owner of this application, attempting to log in for the first time, you must click the "Register As Owner"
                        button found on the login page. You must register with the Stoic Identity that owns the NFT that corresponds to this application.
                    </h3>
                </li>
            </ul>
            <button onClick={handleClick} className="button"> OK </button>
            <button onClick={handleSubmitRequest} className="button"> Request Approval </button>
        </div>
    )
};

export default NotAuthorizedByOwner;