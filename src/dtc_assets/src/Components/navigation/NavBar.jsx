import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { JOURNAL_TABS, NAV_LINKS, WALLET_TABS } from '../../Constants';
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
import { MODALS_TYPES } from '../../Constants';
import { ConnectButton, ConnectDialog, useConnect } from "@connect2ic/react";
import { initialState } from '../../reducers/journalReducer';
import "./NavBar.scss";
import Dropdown from '../Fields/Dropdown';
import { walletTypes } from '../../reducers/walletReducer';
import { retrieveContext } from '../../Contexts';




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
    let journalStateWithoutFunction = {
        ...journalState,
        handlePageSubmitFunction:'',
        backendActor: undefined,
        managerActor: undefined
    };

    let walletStateWithoutFunction={
        ...walletState,
    }
    
    let accountStateWithoutFunction={
        ...accountState,
    }
    
    let homePageStateWithoutFunction={
        ...homePageState,
    }

    const  handleClickDashboard = useCallback(() =>  {
        console.log(walletStateWithoutFunction);
        navigate(NAV_LINKS.dashboard, { 
            replace: false, 
            state:{
                journal: journalStateWithoutFunction,
                wallet: walletStateWithoutFunction,
                account: accountStateWithoutFunction,
                homePage: homePageStateWithoutFunction
            }
        });
    }, [journalState.dataHasBeenLoaded, walletState.dataHasBeenLoaded, homePageState.dataHasBeenLoaded]);

    const handleClickWallet = useCallback(() =>  {
       
        navigate(NAV_LINKS.wallet, { 
            replace: false, 
            state: {
                journal: journalStateWithoutFunction,
                wallet: walletStateWithoutFunction,
                account: accountStateWithoutFunction,
                homePage: homePageStateWithoutFunction
            }
        });
    }, [walletState.dataHasBeenLoaded, journalState.dataHasBeenLoaded, homePageState.dataHasBeenLoaded]);

    const  handleClickJournal = useCallback(() =>  {
        navigate(NAV_LINKS.journal, { 
            replace: false, 
            state: {
                journal: journalStateWithoutFunction,
                wallet: walletStateWithoutFunction,
                account: accountStateWithoutFunction,
                homePage: homePageStateWithoutFunction
            }
        });
    }, [walletState.dataHasBeenLoaded, journalState.dataHasBeenLoaded, homePageState.dataHasBeenLoaded]);

    const  handleClickAccount = useCallback(() =>  {
        navigate(NAV_LINKS.account, { 
            replace: false, 
            state: {
                journal: journalStateWithoutFunction,
                wallet: walletStateWithoutFunction,
                account: accountStateWithoutFunction,
                homePage: homePageStateWithoutFunction
            }    
        });
    },[walletState.dataHasBeenLoaded, journalState.dataHasBeenLoaded, homePageState.dataHasBeenLoaded]);
   
    const  handleClickTreasury = useCallback(() =>  {
        navigate(NAV_LINKS.treasury, { 
            replace: false, 
            state: {
                journal: journalStateWithoutFunction,
                wallet: walletStateWithoutFunction,
                account: accountStateWithoutFunction,
                homePage: homePageStateWithoutFunction
            }
        });
    },[walletState.dataHasBeenLoaded, journalState.dataHasBeenLoaded, homePageState.dataHasBeenLoaded]);

    const  handleClickGroupJournal = useCallback(() =>  {
        navigate(NAV_LINKS.groupJournal, { 
            replace: false, 
            state: {
                journal: journalStateWithoutFunction,
                wallet: walletStateWithoutFunction,
                account: accountStateWithoutFunction,
                homePage: homePageStateWithoutFunction
            }});
    },[walletState.dataHasBeenLoaded, journalState.dataHasBeenLoaded, homePageState.dataHasBeenLoaded]);

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
                    <li className={'listItem'} onClick={handleClickWallet}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <IoiosIcons.IoIosWallet/> 
                        </IconContext.Provider>
                        <span>
                            wallet
                        </span>
                    </li>
                    <li className={'listItem'} onClick={handleClickJournal}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <IoiosIcons.IoIosJournal/> 
                        </IconContext.Provider>
                        <span>
                            journal
                        </span>
                    </li>
                    <li className={'listItem'} onClick={handleClickDashboard}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <AiIcons.AiFillDashboard/> 
                        </IconContext.Provider>
                        <span>
                            dashboard
                        </span>
                    </li>
                    <li className={'listItem'} onClick={handleClickAccount}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <RiIcons.RiAccountPinCircleFill/> 
                        </IconContext.Provider>
                        <span>
                            account
                        </span>
                    </li>
                    <li className={'listItem'} onClick={handleClickTreasury}>
                        <IconContext.Provider value={{ color: 'white'}}>
                            <GiIcons.GiOpenTreasureChest/> 
                        </IconContext.Provider>
                        <span>
                            treasury
                        </span>
                    </li>
                    <li className={'listItem'} onClick={handleClickGroupJournal}>
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