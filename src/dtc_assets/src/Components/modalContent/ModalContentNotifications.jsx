import React, { useContext} from 'react';
import "./ModalContentNotifications.scss";
import { dayInNanoSeconds, monthInDays } from "../../Constants";
import { UI_CONTEXTS } from "../../Contexts";
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext } from "../../Routes/Wallet";
import { AppContext as JournalContext } from "../../Routes/App";
import { AppContext as  AccountContext} from "../../Routes/Account";
import { AppContext as  HomePageContext} from "../../Routes/HomePage";
import { MODALS_TYPES } from '../../Constants';
import { types } from '../../reducers/journalReducer';
import ButtonField from '../Fields/Button';
import "../../SCSS/scrollable.scss";

const Notifications = (props) => {
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

    const { journalState, dispatch } = useContext(AppContext);

    const onClick = () => {
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
        })
    }


    return (
        <div className={'notificationsTableDivContainer'}>
            <div className={'tableDiv'}>
                <table className={"tableHeader"}>
                    <tr className={"tableRow "}>
                        <th className={"tableCell "}>DATE</th>
                        <th className={"tableCell "}>LOCATION</th>
                        <th className={"tableCell "}>AVAILABLE</th>
                    </tr>
                </table>
                <div class='scrollable'>
                    <table className={"table"}>
                        { journalState.unreadEntries.map((page, index) => {
                            return(
                                <tr className={"tableRow "+index}>
                                    <td className={"tableCell "+index}>{page.date}</td>
                                    <td className={"tableCell "+index}>{page.location}</td>
                                    <td className={"tableCell "+index}>{page.unlockTime}</td>
                                </tr>  
                            );
                        }) }
                    </table>
                </div>
            </div>
            <ButtonField
                text={'Close'}
                className={'addNewEntryButtonDiv'}
                onClick={onClick}
                withBox={true}
            />
        </div>
    )

};

export default Notifications;