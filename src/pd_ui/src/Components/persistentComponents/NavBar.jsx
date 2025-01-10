import React, { useContext} from "react";
import { animated } from "@react-spring/web";
import Grid from "@mui/material/Unstable_Grid2";
import { AppContext } from "../../Context";
import { NAV_LINKS, navigationAndApiTypes, TABS } from "../../reducers/navigationAndApiReducer";
import ButtonField from "../Button";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DashboardIcon from '@mui/icons-material/Dashboard';

const NavBar = (props) => {

    const {style, onClick} = props;

    const {modalIsLoading, navigationAndApiDispatch} = useContext(AppContext);

    const changeRoute = (route) => {
        let tab;
        if(route === NAV_LINKS.finances) tab = TABS.treasury
        navigationAndApiDispatch({
            actionType: navigationAndApiTypes.SET_LOCATION,
            payload: {route, tab}
        });
    };

    return (
        <Grid 
        onClick={onClick}
        style={style}
        borderTop={"0.1px groove"}
        borderColor={"primary.dark"}
        width={"100%"} 
        position={"absolute"}
        xs={12} 
        display={"flex"} 
        justifyContent={"center"} 
        alignItems={"center"} 
        bgcolor={"#0A0A0A"} 
        bottom={0}
        padding={0}
        >
            <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={0}>
                <ButtonField
                    Icon={DashboardIcon}
                    transparentBackground={true}
                    color={'primary'}
                    onClick={() => changeRoute(NAV_LINKS.dashboard)}
                    disabled={modalIsLoading}
                />
            </Grid>
            <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={0}>
                <ButtonField
                    Icon={AccountBalanceIcon}
                    transparentBackground={true}
                    color={'primary'}
                    onClick={() => changeRoute(NAV_LINKS.finances)}
                    disabled={modalIsLoading}
                />
            </Grid>
        </Grid>
    );
};

export default animated(NavBar);