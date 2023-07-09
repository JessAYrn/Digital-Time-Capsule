import React, { useContext} from 'react';
import "./ModalContentNotifications.scss";
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as TreasuryContext} from '../../Treasury';
import { AppContext as GroupJournalContext} from '../../GroupJournal';
import { MODALS_TYPES } from '../../../functionsAndConstants/Constants';
import { retrieveContext } from '../../../functionsAndConstants/Contexts';
import { types } from '../../../reducers/journalReducer';
import ButtonField from '../../../Components/Fields/Button';
import "../../../SCSS/scrollable.scss";

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