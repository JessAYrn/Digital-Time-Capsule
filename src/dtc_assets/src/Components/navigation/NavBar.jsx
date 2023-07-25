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
import * as FaIcons from 'react-icons/fa';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { types } from '../../reducers/journalReducer';
import { MODALS_TYPES } from '../../functionsAndConstants/Constants';
import { ConnectButton, ConnectDialog, useConnect } from "@connect2ic/react";
import { initialState } from '../../reducers/journalReducer';
import "./NavBar.scss";
import Dropdown from '../Fields/Dropdown';
import { walletTypes } from '../../reducers/walletReducer';
import { retrieveContext } from '../../functionsAndConstants/Contexts';
import ButtonField from '../Fields/Button';




export const NavBar = (props) => {

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const {
        unreadNotifications,
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

    const {
        journalState,
        journalDispatch,
        walletState,
        walletDispatch,
        accountState,
        accountDispatch,
        homePageState,
        homePageDispatch
    } = useContext(AppContext);

    const toggleDisplayNotifications = () => {
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: !journalState.modalStatus.show, which: MODALS_TYPES.notifications}
        });
    };

    const [sideBar, setSideBar] = useState(false);

    let navigate = useNavigate();

    //must remove function from state because useNavigate will send a null state if there is a function in the state.
    //the reason this happens is because objects retrieved from useLocation must be serializable and function are not.
    
    let reduxStates = {
        journal: journalState,
        wallet: walletState,
        account: accountState,
        homePage: homePageState
    };

    const changeRoute = (route, states) => {
        navigate(route, { replace: false, state: states });
    };

    const showSideBar = () => {
        setSideBar(!sideBar)
    }

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

    const NotificationIcon = unreadNotifications && unreadNotifications.length ?
        <FaIcons.FaBell/> : 
        <FaIcons.FaRegBell/>;

    return (
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" padding={0} className={'navBarContainer'}>
            <Grid xs={12} display="flex" justifyContent="left" alignItems="center" padding={0} sx={{height: "110px"}}>
                <ButtonField
                    transparentBackground={true}
                    id="basic-button"
                    ariaControls={open ? 'basic-menu' : undefined}
                    ariaHaspopup="true"
                    ariaExpanded={open ? 'true' : undefined}
                    onClick={handleClick}
                    Icon={MenuIcon}
                    active={true}
                />
                <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                    'aria-labelledby': 'basic-button',
                    }}
                >
                    <MenuItem onClick={() => changeRoute(NAV_LINKS.wallet, reduxStates)}>Wallet</MenuItem>
                    <MenuItem onClick={() => changeRoute(NAV_LINKS.dashboard, reduxStates)}>Dashboard</MenuItem>
                    <MenuItem onClick={() => changeRoute(NAV_LINKS.journal, reduxStates)}>Storage</MenuItem>
                    <MenuItem onClick={() => changeRoute(NAV_LINKS.account, reduxStates)}>Account</MenuItem>
                    <MenuItem onClick={() => changeRoute(NAV_LINKS.treasury, reduxStates)}>Treasury</MenuItem>
                    <MenuItem onClick={() => changeRoute(NAV_LINKS.groupJournal, reduxStates)}>Community</MenuItem>
                </Menu>
            </Grid>
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