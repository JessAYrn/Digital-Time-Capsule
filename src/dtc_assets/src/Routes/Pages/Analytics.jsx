import React, { useContext, useState} from 'react';
import { AppContext } from '../HomePage';
import { NavBar } from '../../Components/navigation/NavBar';
import { UI_CONTEXTS } from '../../functionsAndConstants/Contexts';
import { Modal } from './modalContent/Modal';
import "./Analytics.scss"
import DataField from '../../Components/Fields/DataField';
import LoadScreen from './LoadScreen';
import { types } from '../../reducers/journalReducer';
import { MODALS_TYPES } from '../../functionsAndConstants/Constants';
import Switch from '../../Components/Fields/Switch';
import { CANISTER_DATA_FIELDS } from '../../functionsAndConstants/Constants';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import Paper from '@mui/material/Paper';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ButtonField from '../../Components/Fields/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Grid from '@mui/material/Unstable_Grid2';
import AccordionField from '../../Components/Fields/Accordion';
import { IconContext } from 'react-icons/lib';
import "../../SCSS/scrollable.scss";
import '../../SCSS/container.scss';
import '../../SCSS/contentContainer.scss'
import '../../SCSS/section.scss'
import {homePageTypes} from '../../reducers/homePageReducer';
import { inTrillions, round2Decimals, shortenHexString } from '../../functionsAndConstants/Utils';
import { copyWalletAddressHelper } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import DataTable from '../../Components/Fields/Table';
import { mapRequestsForAccessToTableRows, requestsForAccessTableColumns } from '../../mappers/dashboardMapperFunctions';


const Analytics = () => {
    const { journalState, journalDispatch, homePageDispatch, homePageState, actorDispatch, actorState} = useContext(AppContext);
    const [showUserPrincipals, setShowUserPrincipals] = useState(false);



    const handleDenyAccess = async (principal) => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.removeFromRequestsList(principal);
        result = result.ok;
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, RequestsForAccess: result }
        });
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const handleGrantAccess = async (principal) => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.grantAccess(principal);
        result = result.ok;
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, RequestsForAccess: result }
        });
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const handleUpdateApprovalStatus = async (principal, newApprovalStatus) => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.updateApprovalStatus(principal, newApprovalStatus);
        result = result.ok;

        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, profilesMetaData: result }
        })

        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleAcceptRequest = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = false;
        let result = await actorState.backendActor.toggleAcceptRequest();
        if('ok' in result)  {
            success = true;
            homePageDispatch({
                actionType: homePageTypes.SET_CANISTER_DATA,
                payload: { ...homePageState.canisterData, acceptingRequests: !homePageState.canisterData.acceptingRequests }
            });
        }
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        });
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleSupportMode = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = false;
        let result = await actorState.backendActor.toggleSupportMode();
        if('ok' in result)  {
            success = true;
            homePageDispatch({
                actionType: homePageTypes.SET_CANISTER_DATA,
                payload: { ...homePageState.canisterData, supportMode: !homePageState.canisterData.supportMode }
            });
        }
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        });

        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    }

    const handleRegistration = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success;
        let result = await actorState.backendActor.registerOwner();
        if('err' in result) success = false;
        else success = true;
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const handleUpgrade = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = true;
        try{
            await actorState.backendActor.upgradeApp_exceptForBackendCanister();
            await actorState.managerActor.installCode_backendCanister();
        } catch(e){
            console.log("Error: ", e);
            success = false;
        };
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleCyclesSaveMode = async () => {
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: true
        });
        let success = true;
        try{
            let canisterData = await actorState.backendActor.toggleCyclesSaveMode();
            await actorState.managerActor.installCode_backendCanister(canisterData);
            homePageDispatch({
                actionType: homePageTypes.SET_CANISTER_DATA,
                payload: { ...homePageState.canisterData, cyclesSaveMode: !homePageState.canisterData.cyclesSaveMode }
            });
            
        } catch(e){
            console.log("Error: ", e);
            success = false;
        };
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        homePageDispatch({
            actionType: homePageTypes.SET_IS_LOADING,
            payload: false
        });
    };

    return(
        <Grid container columns={12} xs={12} rowSpacing={8} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            {   
                journalState.modalStatus.show ?
                    <Modal context={UI_CONTEXTS.HOME_PAGE} /> : 
                    <>
                        <Grid 
                        columns={12}
                        xs={12} 
                        rowSpacing={8} 
                        display="flex" 
                        justifyContent="center" 
                        alignItems="center" 
                        flexDirection={"column"}
                        >
                            <NavBar
                                walletLink={true}
                                journalLink={true}
                                accountLink={true}
                                dashboardLink={false}
                                notificationIcon={false}
                                context={UI_CONTEXTS.HOME_PAGE}
                            />
                        </Grid>
                        {
                            homePageState.isLoading ? 
                            <LoadScreen/> :
                            <>
                                <Grid 
                                columns={12}
                                xs={9} 
                                rowSpacing={0} 
                                display="flex" 
                                justifyContent="center" 
                                alignItems="center" 
                                flexDirection={"column"}
                                >
                                    <Paper className='analytics paper'>
                                        <DataField
                                            label={'Journals Created:'}
                                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Frontend Canister Principal:'}
                                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal])}`}
                                            isPrincipal={true}
                                            buttonIcon={ContentCopyIcon}
                                            onClick={
                                                () => copyWalletAddressHelper(
                                                    homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal]
                                                )
                                            }
                                        />
                                        <DataField
                                            label={'Backend Canister Principal:'}
                                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal])}`}
                                            isPrincipal={true}
                                            buttonIcon={ContentCopyIcon}
                                            onClick={
                                                () => copyWalletAddressHelper(
                                                    homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal]
                                                )
                                            }
                                        />
                                        <DataField
                                            label={'Cycles Burned Per Day:'}
                                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]))} T`}
                                            isCycles={true}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Frontend Cycles Balance:'}
                                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_frontend]))} T`}
                                            isCycles={true}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Backend Cycles Balance:'}
                                            text={`${round2Decimals(inTrillions(homePageState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_backend]))} T`}
                                            isCycles={true}
                                            disabled={true}
                                        />
                                        <DataField
                                            label={'Canister Owner:'}
                                            text={`${shortenHexString(homePageState.canisterData[CANISTER_DATA_FIELDS.nftOwner])}`}
                                            isPrincipal={true}
                                            buttonIcon={ContentCopyIcon}
                                            onClick={
                                                () => copyWalletAddressHelper(
                                                    homePageState.canisterData[CANISTER_DATA_FIELDS.nftOwner]
                                                )
                                            }
                                        />
                                        <DataField
                                            label={'NFT ID:'}
                                            text={homePageState.canisterData[CANISTER_DATA_FIELDS.nftId]}
                                            disabled={true}
                                        />
                                    </Paper>
                                </Grid>
                                {   
                                    homePageState.canisterData.isOwner &&
                                    <Grid 
                                        columns={12}
                                        xs={9} 
                                        rowSpacing={0} 
                                        display="flex" 
                                        justifyContent="center" 
                                        alignItems="center" 
                                        flexDirection={"column"}
                                    >
                                        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                                            <AccordionField content={[{title: "Principals Requesting Access", text: "test"}]}/>
                                        </Grid>
                                        <DataTable
                                        columns={requestsForAccessTableColumns}
                                        rows={mapRequestsForAccessToTableRows(homePageState.canisterData.requestsForAccess)}
                                        />
                                        {/* <Paper className='analytics paper'>

                                             <div className={'AnalyticsContentContainer array'}>
                                                <h4 className='requestingAccessH4'>  Principals Requesting Access </h4>
                                                {homePageState.canisterData.RequestsForAccess && 
                                                    homePageState.canisterData.RequestsForAccess.map(([principal, approvalStatus]) => {
                                                    return (
                                                        <div className={'dataFieldRow'}>
                                                            <DataField
                                                                text={principal}
                                                                isPrincipal={true}
                                                                buttonIcon_1={ClearIcon}
                                                                buttonIcon_0={CheckIcon}
                                                                onClick_1={() => handleDenyAccess(principal)}
                                                                onClick_0={() => handleGrantAccess(principal)}
                                                            />
                                                            {approvalStatus &&
                                                            <div className={'approvalStatusDiv'}>
                                                                <IconContext.Provider value={{ size: '15px', margin: '5px'}}>
                                                                    <AiIcons.AiTwotoneLike/>
                                                                </IconContext.Provider>
                                                                <h6>   approved </h6>
                                                            </div>}
                                                            {!approvalStatus &&
                                                            <div className={'approvalStatusDiv'}>
                                                                <IconContext.Provider value={{ size: '15px', margin: '5px'}}>
                                                                    <AiIcons.AiTwotoneDislike/>
                                                                </IconContext.Provider>
                                                                <h6>   not yet approved </h6>
                                                            </div>}
                                                        </div>
                                                    )
                                                })}    
                                            </div>
                                        </Paper> */}
                                    </Grid> 
                                }
                                <div className={'transparentDiv__homePage__dataFields contentContainer '}>
                                    <div className={'AnalyticsDiv'}>
                                        <div className={'AnalyticsContentContainer array'}>
                                        <h4 className='requestingAccessH4'>  User Principals </h4>
                                        {   
                                            !showUserPrincipals &&
                                            <ButtonField
                                                Icon={ArrowCircleDownIcon}
                                                iconSize={'medium'}
                                                onClick={() => {setShowUserPrincipals(!showUserPrincipals)}}
                                            />
                                        }
                                        {
                                            showUserPrincipals &&

                                            homePageState.canisterData.profilesMetaData.map(({userPrincipal, approvalStatus, canisterId}) => {
                                                const onClick1 = (approvalStatus) ? 
                                                () => handleUpdateApprovalStatus(userPrincipal, !approvalStatus) : 
                                                () => {};

                                                const onClick0 = (approvalStatus) ? 
                                                () => {} : 
                                                () => handleUpdateApprovalStatus(userPrincipal, !approvalStatus);
                                                return (
                                                    <div className={'dataFieldRow'}>
                                                        <DataField
                                                            text={userPrincipal}
                                                            isPrincipal={true}
                                                            buttonIcon_1={homePageState.canisterData.isOwner ? ClearIcon : null}
                                                            buttonIcon_0={homePageState.canisterData.isOwner ? CheckIcon : null}
                                                            onClick_1={onClick1}
                                                            onClick_0={onClick0}
                                                        />
                                                        {approvalStatus &&
                                                        <div className={'approvalStatusDiv'}>
                                                                <ThumbUpIcon/>
                                                            <h6> Suibsidized </h6>
                                                        </div>}
                                                        {!approvalStatus &&
                                                        <div className={'approvalStatusDiv'}>
                                                                <ThumbDownIcon/>
                                                            <h6> Unsubsidized </h6>
                                                        </div>}
                                                    </div>
                                                )
                                            })
                                        }
                                        </div>
                                    </div>
                                </div>
                                {homePageState.canisterData.isOwner && 
                                <div className={'switchDiv contentContainer '}>
                                    <div className='section'>
                                        <h5 className={'lebelH5'}> 
                                            Activate Support Mode:  
                                        </h5>
                                    </div>
                                    <div className='section'>
                                        <Switch
                                            active={homePageState.canisterData.supportMode}
                                            onClick={toggleSupportMode}
                                        />
                                    </div>
                                </div>}
                                {homePageState.canisterData.isOwner && 
                                <div className={'switchDiv contentContainer '}>
                                    <div className='section'>
                                        <h5 className={'lebelH5'}> 
                                            Receive Requests:  
                                        </h5>
                                    </div>
                                    <div className='section'>
                                        <Switch
                                            active={homePageState.canisterData.acceptingRequests}
                                            onClick={toggleAcceptRequest}
                                        />
                                    </div>
                                </div>}
                                {homePageState.canisterData.isOwner && 
                                <div className={'switchDiv contentContainer '}>
                                    <div className='section'>
                                        <h5 className={'lebelH5'}> 
                                            Cycles Saver Mode:  
                                        </h5>
                                    </div>
                                    <div className='section'>
                                        <Switch
                                            active={homePageState.canisterData.cyclesSaveMode}
                                            onClick={toggleCyclesSaveMode}
                                        />
                                    </div>
                                </div>}
                                <ButtonField
                                    text={' Register As New Owner '}
                                    onClick={handleRegistration}
                                />
                                {homePageState.canisterData.isOwner &&
                                    <ButtonField
                                        text={' Upgrade Application '}
                                        onClick={handleUpgrade}
                                    />
                                }
                                { showUserPrincipals && <ButtonField
                                    Icon={ArrowCircleUpIcon}
                                    iconSize={'medium'}
                                    onClick={() => {setShowUserPrincipals(!showUserPrincipals)}}
                                />}
                            </>
                        }
                    </>
            }
        </Grid>
        
    )

}

export default Analytics;