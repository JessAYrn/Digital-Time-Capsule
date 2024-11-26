import React, {useContext, useEffect, useState} from "react";
import DataField from "../../Components/Fields/DataField";
import { homePageTypes } from "../../reducers/homePageReducer";
import { round2Decimals, inTrillions } from "../../functionsAndConstants/Utils";
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
        const balances = await actor.getCanisterCyclesBalances();
        actor.heartBeat();
        const { currentCyclesBalance_backend, currentCyclesBalance_frontend, currentCyclesBalance_treasury, currentCyclesBalance_manager} = balances;
        homePageDispatch({
            payload: {
                currentCyclesBalance_backend: parseInt(currentCyclesBalance_backend),
                currentCyclesBalance_frontend: parseInt(currentCyclesBalance_frontend),
                currentCyclesBalance_treasury: parseInt(currentCyclesBalance_treasury),
                currentCyclesBalance_manager: parseInt(currentCyclesBalance_manager)
            },
            actionType: homePageTypes.SET_CANISTERS_CYCLES_BALANCES
        });
        setIsLoading(false);
    },[]);
    
    return(
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center">
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <img 
                    style={{maxWidth: "50vw", maxHeight: "50vh"}}
                    className={`img`}
                    src={'P2.svg'}
                    alt="Logo"
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center" paddingBottom={0} paddingTop={0}>
                <DataField
                    label={'Front-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_frontend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center" paddingBottom={0} paddingTop={0}>
                <DataField
                    label={'Back-end Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_backend))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center" paddingBottom={0} paddingTop={0}>
                <DataField
                    label={'Treasury Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_treasury))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center" paddingBottom={0} paddingTop={0}>
                <DataField
                    label={'Manager Canister Balance: '}
                    className={'loginPage'}
                    text={`${round2Decimals(inTrillions(homePageState.canistersCyclesBalances.currentCyclesBalance_manager))} T`}
                    isLoading={isLoading}
                    disabled={true}
                />
            </Grid>
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center" paddingBottom={0} paddingTop={0}>
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
        </Grid>
    );
}

export default LoginPage; 