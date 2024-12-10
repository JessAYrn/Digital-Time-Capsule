import React, {useContext, useEffect, useState} from "react";
import DataField from "../../Components/Fields/DataField";
import { homePageTypes } from "../../reducers/homePageReducer";
import { round2Decimals, inTrillions, fromE8s } from "../../functionsAndConstants/Utils";
import Grid from '@mui/material/Unstable_Grid2';
import { getBackendActor } from "../../functionsAndConstants/authentication";
import { actorTypes } from "../../reducers/actorReducer";
import LoginIcon from '@mui/icons-material/Login';
import { AppContext } from "../../Context";
import { Paper } from "@mui/material";
import ButtonField from "../../Components/Fields/Button";

const LoginPage = (props) => {

    const { actorDispatch, homePageState, homePageDispatch } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async() => {
        setIsLoading(true);
        const {agent, actor} = await getBackendActor({anon: false});
        const principal = await agent.getPrincipal();
        actorDispatch({
            actionType: actorTypes.SET_USER_CREDENTIALS,
            payload: {agent, principal : principal.toText()}
        })
        actorDispatch({
            actionType: actorTypes.SET_BACKEND_ACTOR,
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
                <Paper color={'secondary'} sx={{
                    width: "90px", 
                    backgroundColor: 
                    "#343434", 
                    display:"flex", 
                    justifyContent:"center",
                    alignItems:"center",
                }} >
                    <ButtonField
                    text={"Login"}
                    onClick={handleLogin}
                    Icon={LoginIcon}
                    iconSize={'medium'}
                    />
                </Paper>
            </Grid>
            <Grid xs={11} md={9} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center" paddingBottom={5} paddingTop={0}>
                <DataField
                    label={'This DAO Is: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.daoIsPublic ? "Public":"Private"}`}
                    isLoading={isLoading}
                    disabled={true}
                />
                <DataField
                    label={'Founded By: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.daoFounder}`}
                    isLoading={isLoading}
                    disabled={true}
                />
                <DataField
                    label={'The Cost To Enter Is: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.costToEnterDao} $ICP`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center" paddingBottom={5} paddingTop={0}>
                <DataField
                    label={'Front-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_frontend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
                <DataField
                    label={'Back-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_backend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
                <DataField
                    label={'Treasury Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_treasury))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
                <DataField
                    label={'Manager Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_manager))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
        </Grid>
    );
}

export default LoginPage; 