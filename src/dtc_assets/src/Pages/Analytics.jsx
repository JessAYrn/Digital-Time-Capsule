import React, { useContext, useEffect, useState} from 'react';
import { getIntObserverFunc, visibilityFunctionDefault } from '../Components/animations/IntersectionObserverFunctions';
import { AppContext } from '../Routes/HomePage';
import { NavBar } from '../Components/navigation/NavBar';
import { UI_CONTEXTS } from '../Contexts';
import { Modal } from '../Components/Modal';
import "./Analytics.scss"
import DataField from '../Components/Fields/DataField';
import LoadScreen from '../Components/LoadScreen';
import { types } from '../reducers/journalReducer';
import { MODALS_TYPES } from '../Constants';
import Switch from '../Components/Fields/Switch';
import { CANISTER_DATA_FIELDS } from '../Constants';
import * as RiIcons from 'react-icons/ri';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import ButtonField from '../Components/Fields/Button';
import { IconContext } from 'react-icons/lib';
import "../SCSS/scrollable.scss";

import '../SCSS/container.scss';
import '../SCSS/contentContainer.scss'
import '../SCSS/section.scss'

import homePageReducer,{homePageInitialState,homePageTypes} from '../reducers/homePageReducer';
import actorReducer,{ actorInitialState, actorTypes } from '../reducers/actorReducer';


const Analytics = () => {
    const { journalState, journalDispatch, homePageDispatch, homePageState, actorDispatch, actorState} = useContext(AppContext);
    const [showUserPrincipals, setShowUserPrincipals] = useState(false);



    const handleDenyAccess = async (principal) => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.removeFromRequestsList(principal);
        result = result.ok;
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, requestsForApproval: result }
        });
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const handleGrantAccess = async (principal) => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.grantAccess(principal);
        result = result.ok;
        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, requestsForApproval: result }
        });
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const handleUpdateApprovalStatus = async (principal, newApprovalStatus) => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await actorState.backendActor.updateApprovalStatus(principal, newApprovalStatus);
        result = result.ok;

        homePageDispatch({
            actionType: homePageTypes.SET_CANISTER_DATA,
            payload: { ...homePageState.canisterData, profilesMetaData: result }
        })

        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleAcceptRequest = async () => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
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
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleSupportMode = async () => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
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

        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    }

    const handleRegistration = async () => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
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
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const handleUpgrade = async () => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
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
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleCyclesSaveMode = async () => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let success = true;
        try{
            let canisterData = await actorState.backendActor.toggleCyclesSaveMode();
            await actorState.managerActor.installCode_backendCanister(canisterData);
            journalDispatch({
                actionType: types.SET_CANISTER_DATA,
                payload: { ...journalState.canisterData, cyclesSaveMode: !journalState.canisterData.cyclesSaveMode }
            });
            
        } catch(e){
            console.log("Error: ", e);
            success = false;
        };
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    useEffect(() => {
        const containers = document.querySelectorAll(".contentContainer.animatedLeft");
        containers.forEach( (container, index) => {
            let props_ = {
                className: "animatedLeft",
                containerIndex: index,
                visibilityFunction: visibilityFunctionDefault
            };
            const observer = new IntersectionObserver(getIntObserverFunc(props_), {threshold: .05});
            observer.observe(container);
        });
    }, [journalState]);
    
    let animatedLeftElementIndex = 0;

    return(
            journalState.modalStatus.show ?
                <div className={"container"}>
                    <Modal 
                        context={UI_CONTEXTS.HOME_PAGE}
                    />
                </div> : 
                <div className="container">
                    <NavBar
                        walletLink={true}
                        journalLink={true}
                        accountLink={true}
                        dashboardLink={false}
                        notificationIcon={false}
                        context={UI_CONTEXTS.HOME_PAGE}
                    />
                    {journalState.isLoading ? 
                        <LoadScreen/> :
                        <div class={'scrollable'}>
                            <div className='container_homePage'>
                                <div className={'transparentDiv__homePage__dataFields  animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className={'AnalyticsDiv'}>
                                        <div className={'AnalyticsContentContainer'}>
                                            <DataField
                                                label={'Journals Created:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                                            />
                                            <DataField
                                                label={'Frontend Canister Principal:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal]}
                                                isPrincipal={true}
                                            />
                                            <DataField
                                                label={'Backend Canister Principal:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal]}
                                                isPrincipal={true}
                                            />
                                            <DataField
                                                label={'Cycles Burned Per Day:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]}
                                                isCycles={true}
                                            />
                                            <DataField
                                                label={'Frontend Cycles Balance:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_frontend]}
                                                isCycles={true}
                                            />
                                            <DataField
                                                label={'Backend Cycles Balance:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_backend]}
                                                isCycles={true}
                                            />
                                            <DataField
                                                label={'Canister Owner:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.nftOwner]}
                                                isPrincipal={true}
                                            />
                                            <DataField
                                                label={'NFT ID:'}
                                                text={homePageState.canisterData[CANISTER_DATA_FIELDS.nftId]}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {   homePageState.canisterData.isOwner &&
                                    <div className={'transparentDiv__homePage__dataFields animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                        <div className={'AnalyticsDiv'}>
                                            <div className={'AnalyticsContentContainer array'}>
                                                <h4 className='requestingAccessH4'>  Principals Requesting Access </h4>
                                                {homePageState.canisterData.requestsForApproval && 
                                                    homePageState.canisterData.requestsForApproval.map(([principal, approvalStatus]) => {
                                                    return (
                                                        <div className={'dataFieldRow'}>
                                                            <DataField
                                                                text={principal}
                                                                isPrincipal={true}
                                                                buttonIcon_1={RiIcons.RiDeleteBin2Line}
                                                                buttonIcon_0={FaIcons.FaCheckSquare}
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
                                        </div>
                                    </div> 
                                }
                                <div className={'transparentDiv__homePage__dataFields  animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className={'AnalyticsDiv'}>
                                        <div className={'AnalyticsContentContainer array'}>
                                        <h4 className='requestingAccessH4'>  User Principals </h4>
                                        {   
                                            !showUserPrincipals &&
                                            <ButtonField
                                                className={'active'}
                                                Icon={AiIcons.AiOutlineArrowDown}
                                                iconSize={25}
                                                onClick={() => {setShowUserPrincipals(!showUserPrincipals)}}
                                                withBox={true}
                                            />
                                        }
                                        {
                                            showUserPrincipals &&
                                            homePageState.canisterData.profilesMetaData.map(([principal, approvalStatus]) => {
                                                const onClick1 = (approvalStatus) ? 
                                                () => handleUpdateApprovalStatus(principal, !approvalStatus) : 
                                                () => {};

                                                const onClick0 = (approvalStatus) ? 
                                                () => {} : 
                                                () => handleUpdateApprovalStatus(principal, !approvalStatus);
                                                return (
                                                    <div className={'dataFieldRow'}>
                                                        <DataField
                                                            text={principal}
                                                            isPrincipal={true}
                                                            buttonIcon_1={homePageState.canisterData.isOwner ? RiIcons.RiDeleteBin2Line : null}
                                                            buttonIcon_0={homePageState.canisterData.isOwner ? FaIcons.FaCheckSquare : null}
                                                            onClick_1={onClick1}
                                                            onClick_0={onClick0}
                                                        />
                                                        {approvalStatus &&
                                                        <div className={'approvalStatusDiv'}>
                                                            <IconContext.Provider value={{ size: '15px', margin: '5px'}}>
                                                                <AiIcons.AiTwotoneLike/>
                                                            </IconContext.Provider>
                                                            <h6> Suibsidized </h6>
                                                        </div>}
                                                        {!approvalStatus &&
                                                        <div className={'approvalStatusDiv'}>
                                                            <IconContext.Provider value={{ size: '15px', margin: '5px'}}>
                                                                <AiIcons.AiTwotoneDislike/>
                                                            </IconContext.Provider>
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
                                <div className={'switchDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
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
                                <div className={'switchDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
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
                                {journalState.canisterData.isOwner && 
                                <div className={'switchDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className='section'>
                                        <h5 className={'lebelH5'}> 
                                            Cycles Saver Mode:  
                                        </h5>
                                    </div>
                                    <div className='section'>
                                        <Switch
                                            active={journalState.canisterData.cyclesSaveMode}
                                            onClick={toggleCyclesSaveMode}
                                        />
                                    </div>
                                </div>}
                                <ButtonField
                                    text={' Register As New Owner '}
                                    className={'ownerButtonsnDiv active animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}
                                    onClick={handleRegistration}
                                    withBox={true}
                                />
                                {homePageState.canisterData.isOwner &&
                                    <ButtonField
                                        text={' Upgrade Application '}
                                        className={'ownerButtonsnDiv ButtonDiv active animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}
                                        onClick={handleUpgrade}
                                        withBox={true}
                                    />
                                }
                                { showUserPrincipals && <ButtonField
                                    Icon={AiIcons.AiOutlineArrowUp}
                                    iconSize={25}
                                    className={'collapseArrayButton active'}
                                    onClick={() => {setShowUserPrincipals(!showUserPrincipals)}}
                                    withBox={true}
                                />}
                            </div>
                        </div>}
                </div>

        
    )

}

export default Analytics;