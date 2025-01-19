import React, {useContext, useEffect, useState} from "react";
import DataField from "../../components/DataField";
import { homePageTypes } from "../../reducers/homePageReducer";
import { round2Decimals, inTrillions, fromE8s } from "../../functionsAndConstants/Utils";
import Grid from '@mui/material/Unstable_Grid2';
import { getBackendActor } from "../../functionsAndConstants/authentication";
import { navigationAndApiTypes } from "../../reducers/navigationAndApiReducer";
import LoginIcon from '@mui/icons-material/Login';
import { AppContext } from "../../Context";
import ButtonField from "../../components/Button";
import { BACKGROUND_COLOR, CONTRAST_COLOR, DIVIDER_SX } from "../../Theme";
import Divider from "@mui/material/Divider";

const LoginPage = (props) => {

    const { navigationAndApiDispatch, homePageState, homePageDispatch } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async() => {
        setIsLoading(true);
        const {agent, actor} = await getBackendActor({anon: false});
        const principal = await agent.getPrincipal();
        navigationAndApiDispatch({
            actionType: navigationAndApiTypes.SET_USER_CREDENTIALS,
            payload: {agent, principal : principal.toText()}
        })
        navigationAndApiDispatch({
            actionType: navigationAndApiTypes.SET_BACKEND_ACTOR,
            payload: actor
        });
        setIsLoading(false);
    };

    useEffect(async () => {
        setIsLoading(true);
        const {actor} = await getBackendActor({anon: true});
        const {
            currentCyclesBalance_backend, currentCyclesBalance_frontend, currentCyclesBalance_treasury, currentCyclesBalance_manager,daoFounder, costToEnterDao, daoIsPublic
        } = await actor.getDaoPublicData();
        actor.heartBeat();
        homePageDispatch({
            payload: {
                daoFounder,
                costToEnterDao: fromE8s(parseInt(costToEnterDao)),
                daoIsPublic,
                currentCyclesBalance_backend: parseInt(currentCyclesBalance_backend),
                currentCyclesBalance_frontend: parseInt(currentCyclesBalance_frontend),
                currentCyclesBalance_treasury: parseInt(currentCyclesBalance_treasury),
                currentCyclesBalance_manager: parseInt(currentCyclesBalance_manager)
            },
            actionType: homePageTypes.SET_DAO_PUBLIC_DATA
        });
        setIsLoading(false);
    },[]);
    
    return(
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <img 
                    style={{maxWidth: "50vw", maxHeight: "50vh"}}
                    className={`img`}
                    src={'P2.svg'}
                    alt="Logo"
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center" paddingBottom={5} paddingTop={0}>
                    <ButtonField
                    gridSx={{backgroundColor: CONTRAST_COLOR, width: "50%", height: "50px"}}
                    color={BACKGROUND_COLOR}
                    text={"Login"}
                    onClick={handleLogin}
                    Icon={LoginIcon}
                    iconSize={'medium'}
                    />
            </Grid>

            <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}} />
            <Grid xs={11} md={9} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center" paddingBottom={5} paddingTop={0}>
                <DataField
                    label={'This DAO Is: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.daoIsPublic ? "Public":"Private"}`}
                    isLoading={isLoading}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Founded By: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.daoFounder}`}
                    isLoading={isLoading}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'The Cost To Enter Is: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.costToEnterDao} $ICP`}
                    isLoading={isLoading}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}} />
            <Grid xs={11} md={9} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center" paddingBottom={5} paddingTop={0}>
                <DataField
                    label={'Front-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_frontend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Back-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_backend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Treasury Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_treasury))} T`}
                    isLoading={isLoading}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Manager Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_manager))} T`}
                    isLoading={isLoading}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
        </Grid>
    );
}

export default LoginPage; 