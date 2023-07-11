import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { JOURNAL_TABS, NAV_LINKS, WALLET_TABS } from '../../functionsAndConstants/Constants';
import { AppContext as AccountContext} from '../../Routes/Account';
import { AppContext as HomePageContext} from '../../Routes/HomePage';
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext} from '../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../Routes/GroupJournal';
import * as FaIcons from 'react-icons/fa';
import * as GiIcons from 'react-icons/gi';
import * as IoiosIcons from 'react-icons/io';
import * as AiIcons from 'react-icons/ai';
import * as RiIcons from 'react-icons/ri';
import * as ImIcons from 'react-icons/im';
import { IconContext } from 'react-icons/lib';
import { types } from '../../reducers/journalReducer';
import { MODALS_TYPES } from '../../functionsAndConstants/Constants';
import { ConnectButton, ConnectDialog, useConnect } from "@connect2ic/react";
import { initialState } from '../../reducers/journalReducer';
import "./NavBar.scss";
import Dropdown from '../Fields/Dropdown';
import { walletTypes } from '../../reducers/walletReducer';
import { retrieveContext } from '../../functionsAndConstants/Contexts';




export const NavBar = (props) => {
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

    return(
        <div className={'linkDiv_Journal'}>
            <div className={'navbar'}> 
                <div className='menuIcon'>
                    <IconContext.Provider value={{ color: 'white', size: 25}}>
                        { sideBar ? 
                            <ImIcons.ImCross onClick={showSideBar}/> : 
                            <FaIcons.FaBars onClick={showSideBar}/>
                        }
                    </IconContext.Provider> 
                </div>
                
                
                
                
                <div className={'leftNav'}>
                {pathname === NAV_LINKS.journal? <Dropdown
                options={journalTabOptions}
                changeHandler={changeHandler_journalTab}
                />:''}
                
                {pathname === NAV_LINKS.wallet? 
                    <Dropdown 
                        options={walletTabOptions}
                        changeHandler={changeHandler_walletTab}
                    />:
                    ''
                }
                <div className={'notificationsIcon'} onClick={toggleDisplayNotifications}>  
                
                    <IconContext.Provider value={{ color: 'white', size: 25}}>
                        {NotificationIcon}
                    </IconContext.Provider>
                </div>
                </div>
                
                                         
            </div>
            <nav className={`navBar_Journal ${sideBar ? 'active' : ''}`}>
                <ul className={'unorderedList'}>
                    <li className={'listItem'} onClick={() => changeRoute(NAV_LINKS.wallet, reduxStates)}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <IoiosIcons.IoIosWallet/> 
                        </IconContext.Provider>
                        <span>
                            wallet
                        </span>
                    </li>
                    <li className={'listItem'} onClick={() => changeRoute(NAV_LINKS.journal, reduxStates)}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <IoiosIcons.IoIosJournal/> 
                        </IconContext.Provider>
                        <span>
                            journal
                        </span>
                    </li>
                    <li className={'listItem'} onClick={() => changeRoute(NAV_LINKS.dashboard, reduxStates)}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <AiIcons.AiFillDashboard/> 
                        </IconContext.Provider>
                        <span>
                            dashboard
                        </span>
                    </li>
                    <li className={'listItem'} onClick={() => changeRoute(NAV_LINKS.account, reduxStates)}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <RiIcons.RiAccountPinCircleFill/> 
                        </IconContext.Provider>
                        <span>
                            account
                        </span>
                    </li>
                    <li className={'listItem'} onClick={() => changeRoute(NAV_LINKS.treasury, reduxStates)}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <GiIcons.GiOpenTreasureChest/> 
                        </IconContext.Provider>
                        <span>
                            treasury
                        </span>
                    </li>
                    <li className={'listItem'} onClick={() => changeRoute(NAV_LINKS.groupJournal, reduxStates)}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <GiIcons.GiOpenTreasureChest/> 
                        </IconContext.Provider>
                        <span>
                            Group journal
                        </span>
                    </li>
                </ul>
                <ul className={'unorderedList bottom'}>
                <ConnectButton/>
                <ConnectDialog />
                </ul>
            </nav>
        </div>
    );
}