import React, { useContext} from 'react';
import "./ModalContentNotifications.scss";
import { dayInNanoSeconds, monthInDays } from "../../Constants";
import { AppContext } from '../../App';
import { MODALS_TYPES } from '../../Constants';
import { types } from '../../reducers/journalReducer';

const Notifications = (props) => {

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
                        <th className={"tableCell "}>TIME LAPSED</th>
                    </tr>
                </table>
                <div class='scrollable'>
                    <table className={"table"}>
                        { journalState.unreadEntries.map((page, index) => {
                            const unlockTimeAsInt = page.unlockTime;
                            const currentTimeAsInt = Date.now() *1000000;
                            const open = (currentTimeAsInt >= unlockTimeAsInt);
                            const remainingWaitTime = unlockTimeAsInt - currentTimeAsInt;
                            const remainingWaitTimeInMonths = remainingWaitTime / (dayInNanoSeconds * monthInDays);
                            const timeLapsed = page.lockTime - remainingWaitTimeInMonths;
                            const timeLapsedRound = Math.round(timeLapsed * 100) / 100;
                            const openButton = (open) ? 'Open' : 'Locked';
                            return(
                                <tr className={"tableRow "+index}>
                                    <td className={"tableCell "+index}>{page.date}</td>
                                    <td className={"tableCell "+index}>{page.location}</td>
                                    <td className={"tableCell "+index}> {timeLapsedRound} / {page.lockTime} mo.</td>
                                </tr>  
                            );
                        }) }
                    </table>
                </div>
            </div>
            <div className={'addNewEntryButtonDiv'}>
                <button className={'addNewEntryButton'} onClick={onClick}> Close </button>
            </div>
        </div>
    )

};

export default Notifications;