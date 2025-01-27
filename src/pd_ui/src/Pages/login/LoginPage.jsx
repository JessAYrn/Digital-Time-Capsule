import React, {useContext, useEffect, useState} from "react";
import DataField from "../../components/DataField";
import { homePageTypes } from "../../reducers/homePageReducer";
import { fromE8s } from "../../functionsAndConstants/Utils";
import Grid from '@mui/material/Unstable_Grid2';
import { getBackendActor } from "../../functionsAndConstants/authentication";
import { navigationAndApiTypes } from "../../reducers/navigationAndApiReducer";
import LoginIcon from '@mui/icons-material/Login';
import { AppContext } from "../../Context";
import ButtonField from "../../components/Button";
import { BACKGROUND_COLOR, CONTRAST_COLOR,  } from "../../Theme";
import Typography from "@mui/material/Typography";
import RenderGreetingScreen from "./renderComponents/RenderGreetingScreen";

const LoginPage = (props) => {

    const { navigationAndApiDispatch, homePageState, homePageDispatch } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(true);
    
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
        const { daoFounder, costToEnterDao, daoIsPublic } = await actor.getDaoPublicData();
        actor.heartBeat();
        homePageDispatch({
            payload: {
                daoFounder,
                costToEnterDao: fromE8s(parseInt(costToEnterDao)),
                daoIsPublic,
            },
            actionType: homePageTypes.SET_DAO_PUBLIC_DATA
        });
        setIsLoading(false);
    },[]);
    
    return(
        isLoading ? <RenderGreetingScreen /> :
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            <Grid xs={11} md={9} display="flex" flexDirection={"column"} justifyContent="center" alignItems="center"  marginTop={"60px"}>
                <DataField
                    label={'This DAO Is: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.daoIsPublic ? "Public":"Private"}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'Founded By: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.daoFounder}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={'The Cost To Enter Is: '}
                    className={'loginPage'}
                    text={`${homePageState.daoPublicData.costToEnterDao} $ICP`}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            <Grid xs={12} md={9} display="flex" justifyContent="center" alignItems="center" paddingBottom={5} paddingTop={0} marginTop={"60px"}>
                <ButtonField
                gridSx={{backgroundColor: CONTRAST_COLOR, width: "200px", height: "50px"}}
                color={BACKGROUND_COLOR}
                text={"Enter"}
                onClick={handleLogin}
                Icon={LoginIcon}
                iconSize={'medium'}
                />
            </Grid>
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" padding={0} position={"fixed"} maxWidth={"700px"} bottom={0}>
                <Typography sx={{fontSize: "12px", color: CONTRAST_COLOR}}>
                    This is a Personal DAO. Get your own soon.
                </Typography>
                <img style={{width: "40px", height: "40px", padding: 0, margin: 0}} src={'P2.svg'} alt="Logo"/>
            </Grid>
        </Grid>
    );
}

export default LoginPage; 