import React, { useContext, useEffect, useState} from 'react';
import { getIntObserverFunc, visibilityFunctionDefault } from './animations/IntersectionObserverFunctions';
import { AppContext } from '../HomePage';
import { NavBar } from './navigation/NavBar';
import { UI_CONTEXTS } from '../Contexts';
import { Modal } from './Modal';
import "./Analytics.scss"
import DataField from './Fields/DataField';
import LoadScreen from './LoadScreen';
import { types } from '../reducers/journalReducer';
import { MODALS_TYPES } from '../Constants';
import Switch from './Fields/Switch';
import { CANISTER_DATA_FIELDS } from '../Constants';
import * as RiIcons from 'react-icons/ri';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import ButtonField from './Fields/Button';
import { IconContext } from 'react-icons/lib';


const Analytics = () => {
    const { journalState, dispatch } = useContext(AppContext);
    const [showUserPrincipals, setShowUserPrincipals] = useState(false);

    const handleDenyAccess = async (principal) => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result = await journalState.actor.removeFromRequestsList(principal);
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
        let result = await journalState.actor.grantAccess(principal);
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
        let result = await journalState.actor.updateApprovalStatus(principal, newApprovalStatus);
        result = result.ok;
        console.log(result);
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
        let result = await journalState.actor.toggleAcceptRequest();
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
        let result = await journalState.actor.toggleSupportMode();
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
        let result = await journalState.actor.registerOwner();
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
                        nftLink={true}
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
                                            <div className={'AnalyticsContentContainer'}>
                                                <h4 className='requestingAccessH4'>  Principals Requesting Access </h4>
                                                {journalState.canisterData.requestsForApproval.map(([principal, approvalStatus]) => {
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
                                        <div className={'AnalyticsContentContainer'}>
                                        <h4 className='requestingAccessH4'>  User Principals </h4>
                                        {   
                                            !showUserPrincipals &&
                                            <ButtonField
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
                                                            buttonIcon_1={RiIcons.RiDeleteBin2Line}
                                                            buttonIcon_0={FaIcons.FaCheckSquare}
                                                            onClick_1={onClick1}
                                                            onClick_0={onClick0}
                                                        />
                                                        {approvalStatus &&
                                                        <div className={'approvalStatusDiv'}>
                                                            <IconContext.Provider value={{ size: '15px', margin: '5px'}}>
                                                                <AiIcons.AiTwotoneLike/>
                                                            </IconContext.Provider>
                                                            <h6> Subsidized </h6>
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
                                <ButtonField
                                    text={' Register As New Owner '}
                                    className={'registryButtonDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}
                                    onClick={handleRegistration}
                                    withBox={true}
                                />
                                { showUserPrincipals && <ButtonField
                                    Icon={AiIcons.AiOutlineArrowUp}
                                    iconSize={25}
                                    className={'collapseArrayButton'}
                                    onClick={() => {setShowUserPrincipals(!showUserPrincipals)}}
                                    withBox={true}
                                />}
                            </div>
                        </div>}
                </div>

        
    )

}

export default Analytics;