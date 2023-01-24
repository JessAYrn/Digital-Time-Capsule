import React, {useContext} from "react";
import { AppContext as NftContext} from '../../NFTs';
import { AppContext as  WalletContext} from '../../Wallet';
import { AppContext as JournalContext } from '../../App';
import { AppContext as  HomePageContext} from '../../HomePage';
import { AppContext as  AccountContext} from '../../Account';
import { UI_CONTEXTS } from '../../Contexts';
import { initialState, types } from "../../reducers/journalReducer";
import { logout } from "../authentication/AuthenticationMethods";
import "./RequestApprovaModal.scss";
import ButtonField from "../Fields/Button";
import { ConnectButton, ConnectDialog, useConnect } from "@connect2ic/react";
import LoadScreen from "../LoadScreen";

const RequestApprovalResponseModal = (props) => {

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

    useConnect({
        onConnect: () => {},
        onDisconnect: () => {
            dispatch({
                actionType: types.SET_ENTIRE_REDUX_STATE,
                payload: initialState
            });
        }
    });

    return (
        journalState.isLoading ? 
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