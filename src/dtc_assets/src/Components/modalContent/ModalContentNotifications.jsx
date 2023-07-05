import React, { useContext} from 'react';
import "./ModalContentNotifications.scss";
import { AppContext as AccountContext} from '../../Routes/Account';
import { AppContext as HomePageContext} from '../../Routes/HomePage';
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext} from '../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../Routes/GroupJournal';
import { MODALS_TYPES } from '../../Constants';
import { retrieveContext } from '../../Contexts';
import { types } from '../../reducers/journalReducer';
import ButtonField from '../Fields/Button';
import "../../SCSS/scrollable.scss";

const Notifications = (props) => {
    const {
        context
    } = props;

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    const { journalState, journalDispatch } = useContext(AppContext);

    const onClick = () => {
        journalDispatch({
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
                        { journalState.notifications.map((page, index) => {
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