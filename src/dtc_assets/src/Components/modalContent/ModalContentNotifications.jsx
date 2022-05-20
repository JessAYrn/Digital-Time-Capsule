import React from 'react';
import "./ModalContentNotifications.scss";
import { dayInNanoSeconds, monthInDays } from "../../Constants";


const Notifications = (props) => {
    const {
        showModal,
        setShowModal,
        tableContent
    } = props;


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
                        { tableContent.map((page, index) => {
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
                <button className={'addNewEntryButton'} onClick={setShowModal}> Close </button>
            </div>
        </div>
    )

};

export default Notifications;