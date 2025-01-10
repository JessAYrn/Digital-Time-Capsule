import React, { useContext } from 'react';
import Switch from '../../Components/Fields/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import {homePageTypes} from '../../reducers/homePageReducer';
import { AppContext } from '../../Context';
import RenderVotingDistributionsGraph from './RenderVotingDistribution';
import RenderProposals from './RenderProposals';
import RenderDaoParticipants from './RenderDaoParticipants';
import RenderDaoMetaData from './RenderDaoMetaData';

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
    

    return(
        <Grid columns={12} xs={11} md={9} rowSpacing={0} padding={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            
            <RenderVotingDistributionsGraph/>
            <RenderProposals/>
            <RenderDaoParticipants/>
            <RenderDaoMetaData/>
            
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