import React from 'react';
import { Link } from "react-router-dom";
import { NAV_LINKS } from '../../Constants';
import "./NavBar.scss";

export const NavBar = (props) => {
    const {
        walletLink,
        journalLink,
        nftLink,
        accountLink,
        dashboardLink,
        notificationIcon,
        unreadNotifications,
        toggleDisplayNotifications

    } = props;

    const notificationIconSrc = unreadNotifications ? 'notification-icon-alert.png' : 'notification-icon.png';

    return(
        <div className={'linkDiv_Journal'}>
            <nav className={'navBar_Journal'}>
                <div className="linkContainer">
                    {
                        walletLink &&
                            <div className="timeCapsuleLinkDiv">
                                <Link className={"navLink_Journal"} to={NAV_LINKS.wallet}>DTC Wallet</Link>
                            </div>
                    }
                    {
                        accountLink &&
                            <div className="accountIconLinkDiv">
                                <Link className={"navLink_Journal"} to={NAV_LINKS.account}>
                                    <img src={"account-icon.png"} alt="image preview" className="accountIcon_Journal"/> 
                                </Link>
                            </div>
                    }
                    {
                        notificationIcon && 
                            <div className={"notificationIconDiv"}>
                                <img src={notificationIconSrc} onClick={toggleDisplayNotifications}/>
                            </div>
                    }
                    {
                        dashboardLink &&
                            <div className="dashboardIconDiv">
                                <Link className={"navLink_Journal"} to={NAV_LINKS.dashboard}>
                                    <img src={"dashboard-icon.png"} alt="image preview" className="dashboardIcon_Journal"/> 
                                </Link>
                            </div>
                    }
                </div>
            </nav>
        </div>
    );
}