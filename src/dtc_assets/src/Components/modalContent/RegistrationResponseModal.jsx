import React , {useContext}from "react";
import { UI_CONTEXTS } from "../../Contexts";
import { AppContext as WalletContext } from "../../Routes/Wallet";
import { AppContext as JournalContext } from "../../Routes/App";
import { AppContext as  AccountContext} from "../../Routes/Account";
import { AppContext as  HomePageContext} from "../../Routes/HomePage";
import './RegistrationResponseModal.scss';
import { types } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";
import ButtonField from "../Fields/Button";

const RegistrationResponse = (props) => {
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
    const {journalState, journalDispatch} = useContext(AppContext);

    const onClick = () => {
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
    });
    }

    return(
        <div className="contentDiv__registrationResponse">
            { journalState.modalStatus.success ? 
                <>
                    <h3 className='success'>
                        Action successfully executed.
                    </h3>
                </> :
                <>
                    <h3 className='fail'>
                        Failed to update. Only the owner of the corresponding NFT may perform this action.
                    </h3>
                </>
            }
            <ButtonField
                text={'OK'}
                className={'button'}
                onClick={onClick}
                withBox={true}
            />
        </div>
    )
};
export default RegistrationResponse;