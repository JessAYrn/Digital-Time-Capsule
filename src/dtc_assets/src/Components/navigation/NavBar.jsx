import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { NAV_LINKS } from '../../Constants';
import { UI_CONTEXTS } from '../../Contexts';
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as NftContext} from '../../NFTs';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
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

    const {
        journalState,
        dispatch
    } = useContext(AppContext);

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

    //must remove function from state because useNavigate will send a null state if there is a function in the state
    let journalStateWithoutFunction = {
        ...journalState,
        handlePageSubmitFunction:''
    };

    const  handleClickDashboard = useCallback(() =>  {
        navigate(NAV_LINKS.dashboard, { replace: false, state: journalStateWithoutFunction});
    }, [journalState.reloadStatuses]);

    const  handleClickNFT = useCallback(() =>  {
        navigate(NAV_LINKS.nft, { replace: false, state: journalStateWithoutFunction});
    },[journalState.reloadStatuses]);

    const  handleClickWallet = useCallback(() =>  {
        navigate(NAV_LINKS.wallet, { replace: false, state: journalStateWithoutFunction});
    }, [journalState.reloadStatuses]);

    const  handleClickJournal = useCallback(() =>  {
        navigate(NAV_LINKS.journal, { replace: false, state: journalStateWithoutFunction });
    }, [journalState.reloadStatuses]);

    const  handleClickAccount = useCallback(() =>  {
        navigate(NAV_LINKS.account, { replace: false, state: journalStateWithoutFunction });
    },[journalState.reloadStatuses]);
    

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