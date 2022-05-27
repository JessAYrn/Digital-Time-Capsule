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

    let numberOfButtons = 0;

    const iconArray = [
        walletLink,
        journalLink,
        nftLink,
        accountLink,
        dashboardLink,
        notificationIcon,
    ];

    iconArray.forEach((icon) => {
        if(icon){
            numberOfButtons += 1;
        };
    });

    const pixelCountOfIcon = 33;
    const pixelCountOfDiv = 330;

    const marginPxCount = (pixelCountOfDiv - (pixelCountOfIcon * numberOfButtons)) / (2 * numberOfButtons);

    const notificationIconSrc = unreadNotifications ? 'notification-icon-alert.png' : 'notification-icon.png';

    return(
        <div className={'linkDiv_Journal'}>
            <nav className={'navBar_Journal'}>
                <div className="linkContainer">
                    {
                        walletLink &&
                            <div className="walletLinkDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <Link className={"navLink_Journal"} to={NAV_LINKS.wallet}>
                                    <img src={"wallet-icon.png"} alt="image preview" className="walletIcon_Journal"/> 
                                </Link>
                            </div>
                    }
                    {
                        journalLink &&
                            <div className="timeCapsuleLinkDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <Link className={"navLink_Journal"} to={NAV_LINKS.journal}>
                                    <img src={"journal-icon.png"} alt="image preview" className="journalIcon_Journal"/> 
                                </Link>
                            </div>
                    }
                    {
                        nftLink &&
                            <div className="nftLinkDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <Link className={"navLink_Journal"} to={NAV_LINKS.nft}>
                                    <img src={"nft-icon.png"} alt="image preview" className="nftIcon_Journal"/> 
                                </Link>
                            </div>
                    }
                    {
                        notificationIcon && 
                            <div className={"notificationIconDiv"} style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <img src={notificationIconSrc} onClick={toggleDisplayNotifications}/>
                            </div>
                    }
                    {
                        dashboardLink &&
                            <div className="dashboardIconDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <Link className={"navLink_Journal"} to={NAV_LINKS.dashboard}>
                                    <img src={"dashboard-icon.png"} alt="image preview" className="dashboardIcon_Journal"/> 
                                </Link>
                            </div>
                    }
                    {
                        accountLink &&
                            <div className="accountIconLinkDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <Link className={"navLink_Journal"} to={NAV_LINKS.account}>
                                    <img src={"account-icon.png"} alt="image preview" className="accountIcon_Journal"/> 
                                </Link>
                            </div>
                    }
                </div>
            </nav>
        </div>
    );
}