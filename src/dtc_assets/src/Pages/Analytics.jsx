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



const Analytics = () => {
    const { journalState, dispatch } = useContext(AppContext);
    const [showUserPrincipals, setShowUserPrincipals] = useState(false);

    const handleDenyAccess = async (principal) => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await journalState.backendActor.removeFromRequestsList(principal);
        result = result.ok;
        dispatch({
            actionType: types.SET_CANISTER_DATA,
            payload: { ...journalState.canisterData, requestsForApproval: result }
        });
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const handleGrantAccess = async (principal) => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await journalState.backendActor.grantAccess(principal);
        result = result.ok;
        dispatch({
            actionType: types.SET_CANISTER_DATA,
            payload: { ...journalState.canisterData, requestsForApproval: result }
        });
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const handleUpdateApprovalStatus = async (principal, newApprovalStatus) => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await journalState.backendActor.updateApprovalStatus(principal, newApprovalStatus);
        result = result.ok;
        dispatch({
            actionType: types.SET_CANISTER_DATA,
            payload: { ...journalState.canisterData, profilesMetaData: result }
        });
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleAcceptRequest = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let success = false;
        let result = await journalState.backendActor.toggleAcceptRequest();
        if('ok' in result)  {
            success = true;
            dispatch({
                actionType: types.SET_CANISTER_DATA,
                payload: { ...journalState.canisterData, acceptingRequests: !journalState.canisterData.acceptingRequests }
            });
        }
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        });
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleSupportMode = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let success = false;
        let result = await journalState.backendActor.toggleSupportMode();
        if('ok' in result)  {
            success = true;
            dispatch({
                actionType: types.SET_CANISTER_DATA,
                payload: { ...journalState.canisterData, supportMode: !journalState.canisterData.supportMode }
            });
        }
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        });

        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    }

    const handleRegistration = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let success;
        let result = await journalState.backendActor.registerOwner();
        if('err' in result) success = false;
        else success = true;
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const handleUpgrade = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let success = true;
        try{
            let canisterData = await journalState.backendActor.upgradeApp_exceptForBackendCanister();
            await journalState.managerActor.installCode_backendCanister(canisterData);
            
        } catch(e){
            console.log("Error: ", e);
            success = false;
        };
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
    };

    const toggleCyclesSaveMode = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let success = true;
        try{
            let canisterData = await journalState.backendActor.toggleCyclesSaveMode();
            await journalState.managerActor.installCode_backendCanister(canisterData);
            dispatch({
                actionType: types.SET_CANISTER_DATA,
                payload: { ...journalState.canisterData, cyclesSaveMode: !journalState.canisterData.cyclesSaveMode }
            });
            
        } catch(e){
            console.log("Error: ", e);
            success = false;
        };
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onRegisterNewOwner, success: success}
        })
        dispatch({
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
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.journalCount]}
                                            />
                                            <DataField
                                                label={'Frontend Canister Principal:'}
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.frontEndPrincipal]}
                                                isPrincipal={true}
                                            />
                                            <DataField
                                                label={'Backend Canister Principal:'}
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.backEndPrincipal]}
                                                isPrincipal={true}
                                            />
                                            <DataField
                                                label={'Cycles Burned Per Day:'}
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay]}
                                                isCycles={true}
                                            />
                                            <DataField
                                                label={'Frontend Cycles Balance:'}
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_frontend]}
                                                isCycles={true}
                                            />
                                            <DataField
                                                label={'Backend Cycles Balance:'}
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.currentCyclesBalance_backend]}
                                                isCycles={true}
                                            />
                                            <DataField
                                                label={'Canister Owner:'}
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.nftOwner]}
                                                isPrincipal={true}
                                            />
                                            <DataField
                                                label={'NFT ID:'}
                                                text={journalState.canisterData[CANISTER_DATA_FIELDS.nftId]}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {   journalState.canisterData.isOwner &&
                                    <div className={'transparentDiv__homePage__dataFields animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                        <div className={'AnalyticsDiv'}>
                                            <div className={'AnalyticsContentContainer array'}>
                                                <h4 className='requestingAccessH4'>  Principals Requesting Access </h4>
                                                {journalState.canisterData.requestsForApproval && 
                                                    journalState.canisterData.requestsForApproval.map(([principal, approvalStatus]) => {
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
                                            journalState.canisterData.profilesMetaData.map(([principal, approvalStatus]) => {
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
                                                            buttonIcon_1={journalState.canisterData.isOwner ? RiIcons.RiDeleteBin2Line : null}
                                                            buttonIcon_0={journalState.canisterData.isOwner ? FaIcons.FaCheckSquare : null}
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
                                {journalState.canisterData.isOwner && 
                                <div className={'switchDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className='section'>
                                        <h5 className={'lebelH5'}> 
                                            Activate Support Mode:  
                                        </h5>
                                    </div>
                                    <div className='section'>
                                        <Switch
                                            active={journalState.canisterData.supportMode}
                                            onClick={toggleSupportMode}
                                        />
                                    </div>
                                </div>}
                                {journalState.canisterData.isOwner && 
                                <div className={'switchDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className='section'>
                                        <h5 className={'lebelH5'}> 
                                            Receive Requests:  
                                        </h5>
                                    </div>
                                    <div className='section'>
                                        <Switch
                                            active={journalState.canisterData.acceptingRequests}
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
                                {journalState.canisterData.isOwner &&
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