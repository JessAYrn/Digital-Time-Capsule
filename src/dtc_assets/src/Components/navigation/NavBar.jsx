import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { JOURNAL_TABS, NAV_LINKS, WALLET_TABS } from '../../functionsAndConstants/Constants';
import { AppContext as AccountContext} from '../../Routes/Account';
import { AppContext as HomePageContext} from '../../Routes/HomePage';
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext} from '../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../Routes/GroupJournal';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import MenuIcon from '@mui/icons-material/Menu';
import { types } from '../../reducers/journalReducer';
import { MODALS_TYPES } from '../../functionsAndConstants/Constants';
import { ConnectButton, ConnectDialog, useConnect } from "@connect2ic/react";
import { initialState } from '../../reducers/journalReducer';
import "./NavBar.scss";
import Dropdown from '../Fields/Dropdown';
import { walletTypes } from '../../reducers/walletReducer';
import { retrieveContext } from '../../functionsAndConstants/Contexts';
import ButtonField from '../Fields/Button';
import MenuField from "../Fields/MenuField";
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';



export const NavBar = (props) => {

    const { context, isLoading } = props;

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    const {
        journalState,
        journalDispatch,
        walletState,
        walletDispatch,
        accountState,
        accountDispatch,
        homePageState,
        homePageDispatch,
        notificationsState,
        notificationsDispatch
    } = useContext(AppContext);

    const [sideBar, setSideBar] = useState(false);

    let navigate = useNavigate();

    //must remove function from state because useNavigate will send a null state if there is a function in the state.
    //the reason this happens is because objects retrieved from useLocation must be serializable and function are not.
    
    let reduxStates = {
        journal: journalState,
        wallet: walletState,
        account: accountState,
        homePage: homePageState,
        notifications: notificationsState
    };

    const changeRoute = (route, states) => {
        navigate(route, { replace: false, state: states });
    };

    const onClick_notifications = (key, route, states) => {
        journalDispatch({
            actionType: types.CHANGE_PAGE_IS_OPEN,
            payload: true,
            entryKey: key
        });
        changeRoute(route, states);
    };

    useConnect({
        onConnect: () => {},
        onDisconnect: () => {
            journalDispatch({
                actionType: types.SET_ENTIRE_REDUX_STATE,
                payload: initialState
            });
            //here
        }
    });

    const walletTabOptions = [
        {text: WALLET_TABS.icpTab,icon: null}, 
        {text: WALLET_TABS.ethTab,icon: null}, 
        {text: WALLET_TABS.btcTab,icon: null},
        {text: WALLET_TABS.ckBtcTab,icon: null}
    ];

    const changeHandler_walletTab = (option) => {
        walletDispatch({
            actionType: walletTypes.SET_WALLET_TABS,
            payload: option.text
        });
    };

    const journalTabOptions=[
        {text: JOURNAL_TABS.diaryTab,icon:null},
        {text: JOURNAL_TABS.notesTab,icon:null},
    ]

    const changeHandler_journalTab=(option)=>{
        journalDispatch({
            actionType:types.SET_JOURNAL_TAB,
            payload:option.text
        })
    }
    const {pathname} = useLocation();

    const NotificationIcon =  notificationsState.notifications.length ? NotificationsActiveIcon : NotificationsNoneIcon;

    const mainMenuItemProps = [
        { text: "Wallet", onClick: () => changeRoute(NAV_LINKS.wallet, reduxStates) },
        { text: "Storage", onClick: () => changeRoute(NAV_LINKS.journal, reduxStates) },
        { text: "Treasury", onClick: () => changeRoute(NAV_LINKS.treasury, reduxStates) },
        { text: "Dashboard", onClick: () => changeRoute(NAV_LINKS.dashboard, reduxStates) },
        { text: "Community", onClick: () => changeRoute(NAV_LINKS.groupJournal, reduxStates) },
        { text: "Account", onClick: () => changeRoute(NAV_LINKS.account, reduxStates) }
    ];

    const notificationsMenuItemProps = notificationsState.notifications.map(({key, text}) => {
        const key_ = key[0];
        return { text, onClick: () => onClick_notifications(key_, NAV_LINKS.journal, reduxStates) };
    });

    return (
        <Grid 
            xs={12} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            padding={0} 
            className={'navBarContainer'} 
            zIndex={10}>
            <MenuField
                MenuIcon={MenuIcon}
                xs={6}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"left"}
                active={true}
                disabled={isLoading}
                color={"custom"}
                menuItemProps={mainMenuItemProps}
            />
            <MenuField
                MenuIcon={NotificationIcon}
                xs={6}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"right"}
                active={true}
                isLoading={isLoading}
                color={"custom"}
                menuItemProps={notificationsMenuItemProps}
            />

        </Grid>
    );

    // return(
    //     <div className={'linkDiv_Journal'}>
    //         <div className={'navbar'}> 
    //             <div className='menuIcon'>
    //                 <IconContext.Provider value={{ color: 'white', size: 25}}>
    //                     { sideBar ? 
    //                         <ImIcons.ImCross onClick={showSideBar}/> : 
    //                         <FaIcons.FaBars onClick={showSideBar}/>
    //                     }
    //                 </IconContext.Provider> 
    //             </div>
                
                
                
                
    //             <div className={'leftNav'}>
    //             {pathname === NAV_LINKS.journal? <Dropdown
    //             options={journalTabOptions}
    //             changeHandler={changeHandler_journalTab}
    //             />:''}
                
    //             {pathname === NAV_LINKS.wallet? 
    //                 <Dropdown 
    //                     options={walletTabOptions}
    //                     changeHandler={changeHandler_walletTab}
    //                 />:
    //                 ''
    //             }
    //             <div className={'notificationsIcon'} onClick={toggleDisplayNotifications}>  
                
    //                 <IconContext.Provider value={{ color: 'white', size: 25}}>
    //                     {NotificationIcon}
    //                 </IconContext.Provider>
    //             </div>
    //             </div>
                
                                         
    //         </div>
    //         <nav className={`navBar_Journal ${sideBar ? 'active' : ''}`}>
    //             <ul className={'unorderedList'}>
    //             </ul>
    //             <ul className={'unorderedList bottom'}>
    //             <ConnectButton/>
    //             <ConnectDialog />
    //             </ul>
    //         </nav>
    //     </div>
    // );
}