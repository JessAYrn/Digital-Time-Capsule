import React , {useContext}from "react";
import { UI_CONTEXTS } from "../../Contexts";
import { AppContext as WalletContext } from "../../Wallet";
import { AppContext  as NftContext} from "../../NFTs";
import { AppContext as JournalContext } from "../../App";
import { AppContext as  AccountContext} from "../../Account";
import { AppContext as  HomePageContext} from "../../HomePage";
import './RegistrationResponseModal.scss';
import { types } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";

const RegistrationResponse = (props) => {
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

    const onClick = () => {
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
    });
    }

    return(
        <div className="contentDiv__registrationResponse">
            { journalState.modalStatus.success ? 
                <>
                    <h3 className='success'>
                        Owner Successfully Updated
                    </h3>
                </> :
                <>
                    <h3 className='fail'>
                        Failed to update. Only the owner of the corresponding NFT may register as the owner of this application.
                    </h3>
                </>
            }
            <button className={'button'} onClick={onClick}> OK </button>
        </div>
    )
};
export default RegistrationResponse;