import React, {useContext, useEffect, useState} from "react";
import DataField from "../../Components/Fields/DataField";
import { homePageTypes } from "../../reducers/homePageReducer";
import { round2Decimals, inTrillions } from "../../functionsAndConstants/Utils";
import AccordionField from "../../Components/Fields/Accordion";
import Grid from '@mui/material/Unstable_Grid2';
import { getBackendActor, IDENTITY_PROVIDERS } from "../../functionsAndConstants/authentication";
import { actorTypes } from "../../reducers/actorReducer";
import MenuField from "../../Components/Fields/MenuField";
import LoginIcon from '@mui/icons-material/Login';
import { AppContext } from "../../Context";
import { Paper } from "@mui/material";

export const accordionContent=[    
    {
        title:"1.) Navigate to your Personal DAO's unique URL and press the share button circled below ", 
        image: `dtcscreengrab2.png`
    },
    {  
        title:"2.) Select the 'Add to Home Screen' button", 
        image:`dtcscreengrab3.png`
    },
    {
        title:"3.) Enter a title and then press the 'add' button", 
        image: `dtcscreengrab4.png`
    },
    {
        title:"4.) Your Personal DAO app will then be installed and visible on yoru Home Screen", 
        image:`dtcscreengrab1.png`
    },

];

const LoginPage = (props) => {

    const { 
        journalState, 
        journalDispatch, 
        actorState, 
        actorDispatch,
        walletState,
        walletDispatch,
        accountState,
        accountDispatch,
        homePageState,
        homePageDispatch 
    } = useContext(AppContext);
    
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async(provider) => {
        setIsLoading(true);
        const {userObject, actor} = await getBackendActor(provider);
        actorDispatch({
            actionType: actorTypes.SET_USER_OBJECT,
            payload: userObject
        })
        actorDispatch({
            actionType: actorTypes.SET_BACKEND_ACTOR,
            payload: actor
        });
        setIsLoading(false);
        console.log({userObject: {...userObject}, actor: {...actor}} );
        // const actor = getBackendActor(userObject);
        // console.log(result);
        // Handle code will go here...
    };

    const mainMenuItemProps = [
        {text: "Internet Idenity", onClick: () => handleLogin(IDENTITY_PROVIDERS.identity)},
        {text: "Plug", onClick: () => handleLogin(IDENTITY_PROVIDERS.plug)},
        {text: "Stoic", onClick: () => handleLogin(IDENTITY_PROVIDERS.stoic)},
        {text: "NFID", onClick: () => handleLogin(IDENTITY_PROVIDERS.nfid)}
    ];

    useEffect(async () => {
        const {userObject, actor: anonActor} = await getBackendActor();
        let promises = [anonActor.getCanisterCyclesBalances(), anonActor.heartBeat()];
        let [result_0, result_1] = await Promise.all(promises);
        const {
            currentCyclesBalance_backend, 
            currentCyclesBalance_frontend, 
            currentCyclesBalance_treasury, 
            currentCyclesBalance_manager
        } = result_0;
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
                    width: "200px", 
                    backgroundColor: 
                    "#343434", 
                    display:"flex", 
                    justifyContent:"center",
                    alignItems:"center",
                }} >
                    <MenuField
                        MenuIcon={LoginIcon}
                        xs={6}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        active={true}
                        label={"Log In"}
                        disabled={isLoading}
                        color={"custom"}
                        menuItemProps={mainMenuItemProps}
                    />
                </Paper>
            </Grid>
        
            <Grid xs={11} md={9} display="flex" justifyContent="center" alignItems="center">
                <AccordionField>
                    <div title={accordionContent[0].title} image={accordionContent[0].image}></div>
                    <div title={accordionContent[1].title} image={accordionContent[1].image}></div>
                    <div title={accordionContent[2].title} image={accordionContent[2].image}></div>
                    <div title={accordionContent[3].title} image={accordionContent[3].image}></div>
                </AccordionField>
            </Grid>
        </Grid>
    );
}

export default LoginPage; 