import React, { useContext} from "react";
import { animated } from "@react-spring/web";
import Grid from "@mui/material/Unstable_Grid2";
import { AppContext } from "../../Context";
import { NAV_LINKS, navigationAndApiTypes, TABS } from "../../reducers/navigationAndApiReducer";
import ButtonField from "../Fields/Button";
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
        bottom={0}
        borderTop={"0.1px groove"}
        borderColor={"primary.dark"}
        position={"fixed"} 
        width={"100%"} 
        xs={12} 
        display={"flex"} 
        justifyContent={"center"} 
        alignItems={"center"} 
        bgcolor={"#0A0A0A"} 
        zIndex={10}
        >
            <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                <ButtonField
                    Icon={DashboardIcon}
                    transparentBackground={true}
                    color={'secondary'}
                    onClick={() => changeRoute(NAV_LINKS.dashboard)}
                    disabled={modalIsLoading}
                />
            </Grid>
            <Grid xs={6} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                <ButtonField
                    Icon={AccountBalanceIcon}
                    transparentBackground={true}
                    color={'secondary'}
                    onClick={() => changeRoute(NAV_LINKS.finances)}
                    disabled={modalIsLoading}
                />
            </Grid>
        </Grid>
    );
};

export default animated(NavBar);