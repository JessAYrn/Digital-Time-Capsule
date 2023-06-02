import React, {useContext}from 'react';
import './NotAuthorizedByOwner.scss'
import { AppContext as  WalletContext} from '../../Routes/Wallet';
import { AppContext as JournalContext } from '../../Routes/App';
import { AppContext as  HomePageContext} from '../../Routes/HomePage';
import { AppContext as  AccountContext} from '../../Routes/Account';
import { UI_CONTEXTS } from '../../Contexts';
import { types } from '../../reducers/journalReducer';
import { MODALS_TYPES } from '../../Constants';
import ButtonField from '../Fields/Button';
import LoadScreen from '../LoadScreen';

const NotAuthorizedByOwner = (props) => {
    const {
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
    const {journalState, dispatch, actorState} = useContext(AppContext);

    const handleSubmitRequest = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.requestApproval();
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
        journalState.isLoading ? 
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