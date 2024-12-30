import React, { useContext, useMemo, useState } from 'react';
import Grid from "@mui/material/Unstable_Grid2";
import { types as journalTypes } from "../../reducers/journalReducer";
import { walletTypes } from "../../reducers/walletReducer";
import { homePageTypes } from "../../reducers/homePageReducer";
import { notificationsTypes } from "../../reducers/notificationsReducer";
import { treasuryTypes } from "../../reducers/treasuryReducer";
import MenuField from "../Fields/MenuField";
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppContext } from "../../Context";
import RefreshIcon from '@mui/icons-material/Refresh';
import { loadAllDataIntoReduxStores } from '../../functionsAndConstants/loadingFunctions';
import ButtonField from '../Fields/Button';
import { animated } from "@react-spring/web";
import TabsComponent from '../Fields/Tabs';
import { NAV_LINKS, navigationAndApiTypes, TABS } from '../../reducers/navigationAndApiReducer';


const ToolBar = (props) => {

    const { style, onClick} = props;

    const {
        journalDispatch,
        walletDispatch,
        homePageDispatch,
        notificationsState,
        notificationsDispatch,
        treasuryDispatch,
        navigationAndApiState,
        navigationAndApiDispatch, 
        modalIsLoading,
        setModalIsLoading,
        setModalIsOpen,
    } = useContext(AppContext);

    const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, journalDispatch};
    const types = { journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

    const onClick_logout = () => { document.location.reload(); };

    const reloadData = async () => {
        setModalIsLoading(true);
        setModalIsOpen(true);
        await loadAllDataIntoReduxStores(navigationAndApiState, dispatches, types);
        setModalIsOpen(false);
        setModalIsLoading(false);
    };

    const NotificationIcon =  notificationsState.notifications.length ? NotificationsActiveIcon : NotificationsNoneIcon;


    const notificationsMenuItemProps = notificationsState.notifications.map(({key, text}) => {
        return { text, onClick: () => {
            // onClick_notifications(key_, NAV_LINKS.journal, reduxStates)
        } };
    });

    const logoutMenuItemProps = [
        { text: "log out", onClick: () => onClick_logout() }
    ]

    const setSelectedTab = (tab) => {
        navigationAndApiDispatch({
            actionType: navigationAndApiTypes.SET_LOCATION,
            payload: { route: navigationAndApiState?.location?.route, tab }
        });
    };

    const tabsArray = useMemo(() => {
        if(navigationAndApiState?.location?.route === NAV_LINKS.finances) return [TABS.treasury, TABS.wallet];
        else return []
    },[navigationAndApiState?.location?.route]);

    return (
        <Grid 
        xs={12} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        padding={0} 
        width={"100%"}
        position={'fixed'}
        top={0}
        style={style}
        onClick={onClick}
        bgcolor={"#0A0A0A"}
        height={"53px"}
        zIndex={10}
        >
            <Grid xs={1} columns={12} display={"flex"} justifyContent={"left"} alignItems={"center"} padding={0} width={"25%"}> 
                <ButtonField
                    Icon={RefreshIcon}
                    transparentBackground={true}
                    color={'secondary'}
                    onClick={reloadData}
                    disabled={modalIsLoading}
                />
            </Grid>
            <Grid xs={9} columns={12} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={0} width={"100%"}>
                {!!tabsArray.length && <TabsComponent 
                    tabs={tabsArray} 
                    selectedTab={navigationAndApiState?.location.tab} 
                    setSelectedTab={setSelectedTab} 
                    indicatorColor={"secondary"}
                    sx={{ backgroundColor: "#0A0A0A" }}
                />}
            </Grid>
            <Grid xs={2} columns={12} display={"flex"} justifyContent={"right"} alignItems={"center"} padding={0} width={"40%"}> 
                <MenuField
                    MenuIcon={NotificationIcon}
                    xs={1}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    disabled={modalIsLoading}
                    color={'secondary'}
                    menuItemProps={notificationsMenuItemProps}
                />
                <MenuField
                    MenuIcon={LogoutIcon}
                    xs={1}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    disabled={modalIsLoading}
                    color={'secondary'}
                    menuItemProps={logoutMenuItemProps}
                />
            </Grid>
        </Grid>
    );
};

export default animated(ToolBar);