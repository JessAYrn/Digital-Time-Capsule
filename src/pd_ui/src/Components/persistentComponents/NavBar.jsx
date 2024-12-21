import React, { useContext } from 'react';
import { JOURNAL_TABS, NAV_LINKS } from '../../functionsAndConstants/Constants';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import MenuIcon from '@mui/icons-material/Menu';
import { types as journalTypes } from "../../reducers/journalReducer";
import { walletTypes } from "../../reducers/walletReducer";
import { homePageTypes } from "../../reducers/homePageReducer";
import { notificationsTypes } from "../../reducers/notificationsReducer";
import { treasuryTypes } from "../../reducers/treasuryReducer";
import "./NavBar.scss";
import SdStorageIcon from '@mui/icons-material/SdStorage';
import MenuField from "../Fields/MenuField";
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppContext } from "../../Context";
import RefreshIcon from '@mui/icons-material/Refresh';
import { loadAllDataIntoReduxStores } from '../../functionsAndConstants/loadingFunctions';
import ButtonField from '../Fields/Button';



export const NavBar = (props) => {

    const { isLoading } = props;

    const {
        journalState,
        journalDispatch,
        walletState,
        walletDispatch,
        homePageState,
        homePageDispatch,
        notificationsState,
        notificationsDispatch,
        treasuryState,
        treasuryDispatch,
        actorState,
        modalIsLoading,
        setModalIsLoading,
        setModalIsOpen,
        setRoute
    } = useContext(AppContext);

    const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, journalDispatch};
    const types = { journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

    const changeRoute = (route) => setRoute(route);

    const onClick_logout = () => {
        document.location.reload();
    };

    const reloadData = async () => {
        setModalIsLoading(true);
        setModalIsOpen(true);
        await loadAllDataIntoReduxStores(actorState, dispatches, types);
        setModalIsOpen(false);
        setModalIsLoading(false);
    };

    const onClick_notifications = (key, route) => {
        journalDispatch({
            actionType: types.CHANGE_PAGE_IS_OPEN,
            payload: true,
            entryKey: key
        });
        changeRoute(route);
    };

    const changeHandler_journalTab=(tab)=>{
        journalDispatch({
            actionType:types.SET_JOURNAL_TAB,
            payload: tab
        })
    }
    const {pathname} = "null";

    const NotificationIcon =  notificationsState.notifications.length ? NotificationsActiveIcon : NotificationsNoneIcon;

    const mainMenuItemProps = [
        // { text: "Storage", onClick: () => changeRoute(NAV_LINKS.journal) },
        { text: "Finances", onClick: () => changeRoute(NAV_LINKS.finances) },
        { text: "Dashboard", onClick: () => changeRoute(NAV_LINKS.dashboard) },
        // { text: "Community", onClick: () => changeRoute(NAV_LINKS.groupJournal) },
    ];

    const journalTabMenuItemProps=[
        { text: JOURNAL_TABS.diaryTab, onClick: () => changeHandler_journalTab(JOURNAL_TABS.diaryTab) },
        { text: JOURNAL_TABS.notesTab, onClick: () => changeHandler_journalTab(JOURNAL_TABS.notesTab) }
    ]

    const notificationsMenuItemProps = notificationsState.notifications.map(({key, text}) => {
        const key_ = key[0];
        return { text, onClick: () => {
            // onClick_notifications(key_, NAV_LINKS.journal, reduxStates)
        } };
    });

    const logoutMenuItemProps = [
        { text: "log out", onClick: () => onClick_logout() }
    ]

    return (
        <Grid 
        container
        xs={12} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        padding={0} 
        width={"100%"}
        className={'navBarContainer'} 
        zIndex={10}
        >
            <Grid xs={4} columns={12} display={"flex"} justifyContent={"left"} alignItems={"center"} padding={0}> 
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
            </Grid>
            <Grid xs={8} columns={12} display={"flex"} justifyContent={"right"} alignItems={"center"} padding={0}> 
            {pathname === NAV_LINKS.journal &&
                <MenuField
                    MenuIcon={SdStorageIcon}
                    xs={2}
                    md={1}
                    display={"flex"}
                    disabled={isLoading}
                    alignItems={"center"}
                    justifyContent={"center"}
                    active={true}
                    color={"custom"}
                    menuItemProps={journalTabMenuItemProps}
                />
            }
            <ButtonField
                Icon={RefreshIcon}
                transparentBackground={true}
                active={true}
                onClick={reloadData}
                disabled={isLoading || modalIsLoading}
            />
            <MenuField
                MenuIcon={NotificationIcon}
                xs={2}
                md={1}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                disabled={isLoading}
                active={true}
                color={"custom"}
                menuItemProps={notificationsMenuItemProps}
            />
            <MenuField
                MenuIcon={LogoutIcon}
                xs={2}
                md={1}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                active={true}
                isLoading={isLoading}
                color={"custom"}
                menuItemProps={logoutMenuItemProps}
            />
            </Grid>
        </Grid>
    );

    // return(
    //     <div className={'linkDiv_Journal'}>
    //         <div className={'navbar'}> 
                
                
                
                
    //             <div className={'leftNav'}>
                
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