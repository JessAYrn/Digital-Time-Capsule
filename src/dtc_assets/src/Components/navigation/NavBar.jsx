import React from 'react';
import { useNavigate } from "react-router-dom";
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
        toggleDisplayNotifications,
        journalState

    } = props;
    let navigate = useNavigate();


    let numberOfButtons = 0;

    const iconArray = [
        walletLink,
        journalLink,
        nftLink,
        accountLink,
        dashboardLink,
        notificationIcon
    ];

    iconArray.forEach((icon) => {
        if(icon){
            numberOfButtons += 1;
        };
    });

    const  handleClickDashboard = () =>  {
        navigate(NAV_LINKS.dashboard, { replace: false, state: journalState});
    }
    const  handleClickNFT = () =>  {
        navigate(NAV_LINKS.nft, { replace: false, state: journalState});
    }
    const  handleClickWallet = () =>  {
        navigate(NAV_LINKS.wallet, { replace: false, state: journalState});
    }
    const  handleClickJournal = () =>  {
        navigate(NAV_LINKS.journal, { replace: false, state: journalState });
    }
    const  handleClickAccount = () =>  {
        navigate(NAV_LINKS.account, { replace: false, state: journalState });
    }
    

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
                                <button className={"navLink_Journal"} onClick={handleClickWallet}>
                                    <img src={"wallet-icon.png"} alt="image preview" className="walletIcon_Journal"/> 
                                </button>
                            </div>
                    }
                    {
                        journalLink &&
                            <div className="timeCapsuleLinkDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <button className={"navLink_Journal"} onClick={handleClickJournal}>
                                    <img src={"journal-icon.png"} alt="image preview" className="journalIcon_Journal"/> 
                                </button>
                            </div>
                    }
                    {
                        nftLink &&
                            <div className="nftLinkDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <button className={"navLink_Journal"} onClick={handleClickNFT}>
                                    <img src={"nft-icon.png"} alt="image preview" className="nftIcon_Journal"/> 
                                </button>
                            </div>
                    }
                    {
                        notificationIcon && 
                            <div className={"notificationIconDiv"} style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <button className={"navLink_Journal"} onClick={toggleDisplayNotifications}>
                                    <img src={notificationIconSrc}/>
                                </button>
                            </div>
                    }
                    {
                        dashboardLink &&
                            <div className="dashboardIconDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <button className={"navLink_Journal"} onClick={handleClickDashboard}>
                                    <img src={"dashboard-icon.png"} alt="image preview" className="dashboardIcon_Journal"/> 
                                </button>
                            </div>
                    }
                    {
                        accountLink &&
                            <div className="accountIconLinkDiv" style={{marginLeft: marginPxCount + 'px', marginRight: marginPxCount+ 'px'}}>
                                <button className={"navLink_Journal"} onClick={handleClickAccount}>
                                    <img src={"account-icon.png"} alt="image preview" className="accountIcon_Journal"/> 
                                </button>
                            </div>
                    }
                </div>
            </nav>
        </div>
    );
}