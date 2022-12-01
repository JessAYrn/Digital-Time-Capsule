import React, {useContext} from "react";
import { AppContext as NftContext} from '../../NFTs';
import { AppContext as  WalletContext} from '../../Wallet';
import { AppContext as JournalContext } from '../../App';
import { AppContext as  HomePageContext} from '../../HomePage';
import { AppContext as  AccountContext} from '../../Account';
import { UI_CONTEXTS } from '../../Contexts';
import { types } from "../../reducers/journalReducer";
import { logout } from "../authentication/AuthenticationMethods";
import "./RequestApprovaModal.scss";
import ButtonField from "../Fields/Button";
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

    const handleClick = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        await logout(journalState, dispatch);
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

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
            <ButtonField
                text={'OK'}
                className={'button'}
                onClick={handleClick}
                withBox={true}
            />
        </div>
    )

};

export default RequestApprovalResponseModal;