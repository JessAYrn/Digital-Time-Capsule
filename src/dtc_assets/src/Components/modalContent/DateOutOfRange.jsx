import React , {useContext}from "react";
import { UI_CONTEXTS } from "../../Contexts";
import { AppContext as WalletContext } from "../../Routes/Wallet";
import { AppContext  as NftContext} from "../../Routes/NFTs";
import { AppContext as JournalContext } from "../../Routes/App";
import { AppContext as  AccountContext} from "../../Routes/Account";
import { AppContext as  HomePageContext} from "../../Routes/HomePage";
import { types } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";
import ButtonField from "../Fields/Button";
import "./DateOutOfRange.scss"

const DateOutOfRange = (props) => {
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
        <div className="contentDiv__dateOutOfRange">

            <h3 className='h3Texts'>
                { journalState.modalStatus.beyondMax ? 
                    'You may only select dates as late as the current date.' :
                    'The unlock date must be at least one month in the future.'
                }
            </h3>
            <ButtonField
                text={'OK'}
                className={'button'}
                onClick={onClick}
                withBox={true}
            />
        </div>
    )
};
export default DateOutOfRange;