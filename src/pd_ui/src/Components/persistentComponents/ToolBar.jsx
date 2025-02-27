import React, { useContext, useMemo } from 'react';
import Grid from "@mui/material/Unstable_Grid2";
import { userTypes } from "../../reducers/userReducer";
import { walletTypes } from "../../reducers/walletReducer";
import { homePageTypes } from "../../reducers/homePageReducer";
import { notificationsTypes } from "../../reducers/notificationsReducer";
import { treasuryTypes } from "../../reducers/treasuryReducer";
import MenuField from "../MenuField";
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppContext } from "../../Context";
import RefreshIcon from '@mui/icons-material/Refresh';
import { loadAllDataIntoReduxStores } from '../../functionsAndConstants/loadingFunctions';
import ButtonField from '../Button';
import { animated } from "@react-spring/web";
import TabsComponent from '../Tabs';
import { NAV_LINKS, navigationAndApiTypes, TABS } from '../../reducers/navigationAndApiReducer';
import { BACKGROUND_COLOR, WHITE_COLOR } from '../../Theme';


const ToolBar = (props) => {

    const { style, onClick} = props;

    const {
        userDispatch,
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

    const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, userDispatch};
    const types = { userTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

    const onClick_logout = () => { document.location.reload(); };

    const reloadData = async () => {
        setModalIsLoading(true);
        setModalIsOpen(true);
        navigationAndApiState.backendActor.updateUsersTxHistory();
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
        bgcolor={BACKGROUND_COLOR}
        height={"53px"}
        zIndex={10}
        >
            <Grid xs={2} columns={12} display={"flex"} justifyContent={"left"} alignItems={"center"} padding={0} width={"18%"}> 
                <ButtonField
                    transparentBorder={true}
                    Icon={RefreshIcon}
                    transparentBackground={true}
                    color={WHITE_COLOR}
                    onClick={reloadData}
                    disabled={modalIsLoading}
                />
            </Grid>
            <Grid xs={6} columns={12} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={0} width={"100%"}>
                {!!tabsArray.length && <TabsComponent 
                    tabs={tabsArray} 
                    selectedTab={navigationAndApiState?.location.tab} 
                    setSelectedTab={setSelectedTab} 
                    indicatorColor={"secondary"}
                    sx={{ backgroundColor: BACKGROUND_COLOR }}
                />}
            </Grid>
            <Grid xs={4} columns={12} display={"flex"} justifyContent={"right"} alignItems={"center"} padding={0} width={"35%"}> 
                <MenuField
                    MenuIcon={NotificationIcon}
                    xs={6}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    disabled={modalIsLoading}
                    color={WHITE_COLOR}
                    menuItemProps={notificationsMenuItemProps}
                />
                <MenuField
                    
                    MenuIcon={LogoutIcon}
                    xs={6}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    disabled={modalIsLoading}
                    color={WHITE_COLOR}
                    menuItemProps={logoutMenuItemProps}
                />
            </Grid>
        </Grid>
    );
};

export default animated(ToolBar);