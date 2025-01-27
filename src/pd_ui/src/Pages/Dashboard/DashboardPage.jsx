import React, { useContext } from 'react';
import Switch from '../../components/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import {homePageTypes} from '../../reducers/homePageReducer';
import { AppContext } from '../../Context';
import RenderVotingDistributionsGraph from './renderComponents/RenderVotingDistribution';
import RenderProposals from './renderComponents/RenderProposals';
import RenderDaoParticipants from './renderComponents/RenderDaoParticipants';
import RenderDaoMetaData from './renderComponents/RenderDaoMetaData';
import { Divider } from '@mui/material';
import { DIVIDER_SX, CONTRAST_COLOR } from '../../Theme';
import DataField from '../../components/DataField';
import Typography from "@mui/material/Typography";
import RenderRequestsForEntry from './renderComponents/RenderRequestsForEntry';
const DashboardPage = () => {

    const { homePageDispatch, homePageState, navigationAndApiState, setModalIsOpen, setModalIsLoading, setModalProps } = useContext(AppContext);

    const toggleAcceptRequest = async () => {
        setModalIsLoading(true);
        setModalIsOpen(true);
        let result = await navigationAndApiState.backendActor.toggleAcceptRequest();
        setModalIsOpen(false);
        setModalIsLoading(false);
        if('err' in result) return;
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, acceptingRequests: !homePageState.canisterData.acceptingRequests }
        });
    };

    const viewDaoMetaData = () => {
        setModalProps({
            headerComponent: <Typography variant="h6">DAO Meta Data</Typography>,
            fullScreen: true,
            components:[
                <RenderDaoMetaData/>
            ]
        });
        setModalIsOpen(true);
    }

    const viewDaoParticipants = () => {
        setModalProps({
            headerComponent: <Typography variant="h6">DAO Participants</Typography>,
            fullScreen: true,
            components:[
                <RenderDaoParticipants/>
            ]
        });
        setModalIsOpen(true);
    }

    const viewRequestsForEntry = () => {
        setModalProps({
            headerComponent: <Typography variant="h6">Requests for Entry</Typography>,
            fullScreen: true,
            components:[
                <RenderRequestsForEntry/>
            ]
        });
        setModalIsOpen(true);
    }

    return(
        <Grid columns={12} xs={11} md={9} rowSpacing={0} padding={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            <RenderVotingDistributionsGraph/>
            <Divider sx={{...DIVIDER_SX, marginBottom:"30px", marginTop:"30px"}} />
            <RenderProposals/>
            <Divider sx={{...DIVIDER_SX, marginBottom:"30px", marginTop:"30px"}} />
            <DataField 
                buttonColor={CONTRAST_COLOR}
                label={"DAO Meta Data"} 
                text={"View"}
                onClick={ () => viewDaoMetaData() }
            />
            <Divider sx={{...DIVIDER_SX, marginBottom:"30px", marginTop:"30px"}} />
            <DataField 
                buttonColor={CONTRAST_COLOR}
                label={"DAO Members"} 
                text={"View"}
                onClick={ () => viewDaoParticipants() }
            />
            <Divider sx={{...DIVIDER_SX, marginBottom:"30px", marginTop:"30px"}} />
            <DataField 
                buttonColor={CONTRAST_COLOR}
                label={"Requests for Entry"} 
                text={"View"}
                onClick={ () => viewRequestsForEntry() }
            />
            <Divider sx={{...DIVIDER_SX, marginBottom:"30px", marginTop:"30px"}} />
            <Grid columns={12} xs={12} rowSpacing={0} marginBottom={"40px"} padding={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
                <Switch
                    checked={homePageState.canisterData.acceptingRequests}
                    onClick={toggleAcceptRequest}
                    disabled={!homePageState.canisterData.isAdmin}
                    labelLeft={"Receive Requests:  "}
                />
            </Grid>
        </Grid>    
    )

}

export default DashboardPage;