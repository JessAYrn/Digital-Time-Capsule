import React, { useContext, useMemo, useState} from 'react';
import DataField from '../Components/Fields/DataField';
import Switch from '../Components/Fields/Switch';
import { CANISTER_DATA_FIELDS, GRAPH_DISPLAY_LABELS, CHART_TYPES } from '../functionsAndConstants/Constants';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import Paper from '@mui/material/Paper';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Grid from '@mui/material/Unstable_Grid2';
import AccordionField from '../Components/Fields/Accordion';
import {homePageTypes} from '../reducers/homePageReducer';
import { fromE8s, inTrillions, round2Decimals, shortenHexString, shortenString } from '../functionsAndConstants/Utils';
import { copyText } from '../functionsAndConstants/walletFunctions/CopyWalletAddress';
import DataTable from '../Components/Fields/Table';
import { mapRequestsForAccessToTableRows, mapUsersProfileDataToTableRows, requestsForAccessTableColumns, usersTableColumns } from '../mappers/dashboardMapperFunctions';
import { AppContext } from '../Context';
import Graph, { getLabelsAndDataSetsInChartFormat, sortAndReduceDataMapArray } from '../Components/Fields/Chart';
import { Typography } from '@mui/material';
import CarouselComponent from '../Components/Fields/Carousel';
import PreviewProposal from '../Components/modalPages/proposals/PreviewProposal';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import DisplayProposal from '../Components/modalPages/proposals/DisplayProposal';

const Analytics = (props) => {

    const { homePageDispatch, homePageState, navigationAndApiState, treasuryState, setModalIsOpen, setModalIsLoading, setModalProps } = useContext(AppContext);

    const [requestsTableIsLoading, setRequestsTableIsLoading] = useState(false);
    const [usersTableIsLoading, setUsersTableIsLoading] = useState(false);

    let activeProposals = homePageState?.canisterData?.proposals?.filter(proposal => !proposal[1].finalized);
    let inactiveProposals = homePageState?.canisterData?.proposals?.filter(proposal => proposal[1].finalized);

    const onGrantAccess = async (args) => {
        setRequestsTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.grantAccess(principals);
        result = mapRequestsForAccessToTableRows(result);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, requestsForAccess: result }
        });
        setRequestsTableIsLoading(false)
    };

    const onDenyAccess = async (args) => {
        setRequestsTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.removeFromRequestsList(principals);
        result = mapRequestsForAccessToTableRows(result);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, requestsForAccess: result }
        });
        setRequestsTableIsLoading(false);
    };

    const subsidize = async (args) => {
        setUsersTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.updateApprovalStatus(principals, true);
        result = mapUsersProfileDataToTableRows(result.ok);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, profilesMetaData: result }
        })
        setUsersTableIsLoading(false);
    };

    const Unsubsidize = async (args) => {
        setUsersTableIsLoading(true);
        const {tableState} = args
        let selectedRows = tableState.rowSelection;
        let principals = selectedRows.map(rowId => {
            let row = tableState.rows.dataRowIdToModelLookup[rowId];
            return row.userPrincipal;
        });
        let result = await navigationAndApiState.backendActor.updateApprovalStatus(principals, false);
        result = mapUsersProfileDataToTableRows(result.ok);
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, profilesMetaData: result }
        })
        setUsersTableIsLoading(false);
    };

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

    const viewProposal = (proposal) => {
        setModalProps({
            fullScreen: true,
            components:[
                <DisplayProposal proposal={proposal}/>
            ]
        });
        setModalIsOpen(true)
    }

    //TODO: make the datasets retrieval process for all other implementations of similar to this one.  
    const {labels, datasets} = useMemo(() => {
        const dataMapArray = [];

        for(let [principal, { balances: {voting_power} }] of treasuryState?.usersTreasuryDataArray){
            const userName = homePageState?.canisterData?.userNames[principal];
            dataMapArray.push([userName, {voting_power: fromE8s(voting_power)}]);
        };
        const reducedDataMapArray = sortAndReduceDataMapArray(dataMapArray, "voting_power", 10);
        const {labels, datasets} =  getLabelsAndDataSetsInChartFormat(reducedDataMapArray, 125);
        return { labels, datasets };
    }, [treasuryState.usersTreasuryDataArray, homePageState?.canisterData?.userNames]);

    return(
        <>
            <Grid columns={12} xs={11} md={9} rowSpacing={0} padding={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} flexDirection={"column"} width={"100%"} >

                    <Typography variant="h4" color="white" marginBottom={"10px"} marginTop={"10px"} textAlign={"center"}>
                        Voting Power Distribution
                    </Typography>

                    <Graph
                        withoutPaper={true}
                        type={CHART_TYPES.pie}
                        datasets={datasets}
                        labels={labels}
                        height={"500px"}
                        maintainAspectRatio={false}
                        hideButton1={true}
                        hideButton2={true}
                    />  
                </Grid>

                <Grid xs={12} paddingBottom={5} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"}>

                    <CarouselComponent 
                        title={"Active Proposals"} 
                        defaultComponent={<Typography textAlign={"center"} component={"There are currently no active proposals"} />} 
                    >
                        {activeProposals.map((proposal) => { return <PreviewProposal proposal={proposal} onViewProposal={() => viewProposal(proposal)} /> })}
                    </CarouselComponent>

                    <AccordionField 
                        sx={{padding: "0px", marginTop:"10px"}} 
                        title={"Inactive Proposals"} 
                        defaultComponent={<Typography textAlign={"center"} component={"There are currently no proposals"} />} 
                    >
                       {inactiveProposals.map(([proposalId, proposal]) => {
                            const actionType = Object.keys(proposal.action)[0];
                            return <DataField 
                                label={`#${proposalId} ${shortenString(actionType, 10)}`} 
                                text={'view'} 
                                buttonIcon={proposal.executed ? ThumbUpIcon : ThumbDownIcon} 
                                onClick={ () => viewProposal([proposalId, proposal]) }
                            />
                        })}
                    </AccordionField>

                </Grid>

                {/* <Grid xs={12} paddingBottom={5} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                    <AccordionField>
                        <div 
                            title={"DAO Participants"} 
                            iconSize={"medium"}
                            onClick_button_1={subsidize}
                            onClick_button_2={Unsubsidize}
                            onCellClick={(e) => { if(e === "yes" || e === "no") return; else copyText(e)}}
                            text_1={'Subsidize'}
                            text_2={'Unsubsidize'}
                            transparent={true}
                            checkboxSelection={true}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={usersTableIsLoading}
                            columns={usersTableColumns}
                            rows={homePageState.canisterData.profilesMetaData}
                            Icon_1={CheckIcon}
                            Icon_2={ClearIcon}
                            CustomComponent={DataTable}
                        ></div>
                            <div 
                            title={"Principals Requesting Access"} 
                            iconSize={"medium"}
                            onClick_button_1={onGrantAccess}
                            onClick_button_2={onDenyAccess}
                            text_1={'Approve'}
                            text_2={'Deny'}
                            onCellClick={(e) => { if(e === "yes" || e === "no") return; else copyText(e)}}
                            transparent={true}
                            checkboxSelection={true}
                            disabled={!homePageState.canisterData.isAdmin}
                            isLoading={requestsTableIsLoading}
                            columns={requestsForAccessTableColumns}
                            rows={homePageState.canisterData.requestsForAccess}
                            Icon_1={CheckIcon}
                            Icon_2={ClearIcon}
                            CustomComponent={DataTable}
                        ></div>
                    </AccordionField>
                </Grid> */}
                <Paper sx={{ width: "100%", backgroundColor: "rgba(52,52,52, 0.8)" }}>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                        <DataField
                            transparentBackground={true}
                            label={'Accounts Created:'}
                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'DAO Entry Cost:'}
                            transparentBackground={true}
                            text={`${fromE8s(homePageState.canisterData[CANISTER_DATA_FIELDS.costToEnterDao]) } ICP `}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Privacy Setting:'}
                            transparentBackground={true}
                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.daoIsPublic] ? "Public":"Private"}
                            disabled={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Frontend Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            transparentBackground={true}
                            onClick={() => copyText( homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal] )}
                        />
                        <DataField
                            label={'Backend Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            transparentBackground={true}
                            onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}
                        />
                        <DataField
                            label={'Treasury Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            transparentBackground={true}
                            onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.treasuryCanisterPrincipal])}
                        />
                        <DataField
                            label={'Manager Canister Principal:'}
                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}`}
                            buttonIcon={ContentCopyIcon}
                            transparentBackground={true}
                            onClick={() => copyText(homePageState.canisterData[CANISTER_DATA_FIELDS.managerCanisterPrincipal])}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Frontend Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_frontend))} T`}
                            isCycles={true}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={'Backend Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_backend))} T`}
                            isCycles={true}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={'Treasury Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_treasury))} T`}
                            isCycles={true}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={'Manager Cycles Balance:'}
                            text={`${round2Decimals(inTrillions(homePageState.daoPublicData.currentCyclesBalance_manager))} T`}
                            isCycles={true}
                            disabled={true}
                            transparentBackground={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Cycles Burned Per Day:'}
                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]))} T`}
                            isCycles={true}
                            disabled={true}
                            transparentBackground={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Release Version Downloaded:'}
                            text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionLoaded]}`}
                            isCycles={true}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={'Release Version Installed:'}
                            text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.releaseVersionInstalled]}`}
                            isCycles={true}
                            disabled={true}
                            transparentBackground={true}
                        />
                    </Grid>
                    <Grid xs={12} display="flex" justifyContent="center" alignItems="center" paddingBottom={"15px"} paddingTop={"15px"} flexDirection={"column"}>
                        <DataField
                            label={'Support Mode:'}
                            text={`${homePageState.canisterData[CANISTER_DATA_FIELDS.supportMode]? "Enabled" : "Disabled"}`}
                            disabled={true}
                            transparentBackground={true}
                        />
                    </Grid>
                </Paper>
                <Grid columns={12} xs={12} rowSpacing={0} padding={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
                    <Switch
                        checked={homePageState.canisterData.acceptingRequests}
                        onClick={toggleAcceptRequest}
                        disabled={!homePageState.canisterData.isAdmin}
                        labelLeft={"Receive Requests:  "}
                    />
                </Grid>
            </Grid>    
        </>   
    )

}

export default Analytics;