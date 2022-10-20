import React, { useContext, useEffect} from 'react';
import { getIntObserverFunc, visibilityFunctionDefault } from './animations/IntersectionObserverFunctions';
import { AppContext } from '../HomePage';
import { NavBar } from './navigation/NavBar';
import { UI_CONTEXTS } from '../Contexts';
import { Modal } from './Modal';
import "./Analytics.scss"
import LoadScreen from './LoadScreen';
import { types } from '../reducers/journalReducer';
import { MODALS_TYPES } from '../Constants';
import Switch from './Fields/Switch';
import { CANISTER_DATA_FIELDS } from '../Constants';
import * as RiIcons from 'react-icons/ri';
import * as FaIcons from 'react-icons/fa';
import { IconContext } from 'react-icons/lib';


const DataFieldArray = (props) => {
    const {
        journalState,
        dataField,
        dataSubField,
        label,
        tuples,
        isOwner,
        dispatch
    } = props;
    let array = journalState[dataField][dataSubField] || journalState[dataField];

    const handleAddPrincipal = async (principal) => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result_0 = await journalState.actor.removePrincipalFromRequestsArray(principal);
        let result_1 = await journalState.actor.addApprovedUser(principal);
        let success = false;
        if("ok" in result_1 && "ok" in result_0){
            success = true;
            result_0 = result_0.ok;
            result_1 = result_1.ok;
            dispatch({
                actionType: types.SET_CANISTER_DATA,
                payload: {...journalState.canisterData, requestsForApproval: result_0, approvedUsers: result_1}
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

    const handleRemovePrincipal = async (principal, requestingApproval) => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let apiFunctionToCall = requestingApproval ? journalState.actor.removePrincipalFromRequestsArray : journalState.actor.removeApprovedUser;
        let result = await apiFunctionToCall(principal);
        let success = false;
        if("ok" in result){
            success = true;
            result = result.ok;
            let payload = requestingApproval ? { ...journalState.canisterData, requestsForApproval: result } : { ...journalState.canisterData, approvedUsers: result }
            dispatch({
                actionType: types.SET_CANISTER_DATA,
                payload: payload
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

    let requestingApproval = dataSubField === CANISTER_DATA_FIELDS.requestsForApproval;

    return(
        <div className={'canisterDataDiv'}>
            <div className={'section'}>
                <h3 className={'lebelH3'}>
                    {label} 
                </h3>
            </div>
            <div className={'section array'}>
                <>
                    {
                        array.map((principal, index) => {
                            principal = tuples ? principal[0] : principal
                            return (
                                <div className={'dataFieldRow'}>
                                    {isOwner && dataSubField === CANISTER_DATA_FIELDS.requestsForApproval && 
                                    <IconContext.Provider value={{ size: '25px'}}>
                                        <FaIcons.FaCheckSquare onClick={() => handleAddPrincipal(principal)}/>
                                    </IconContext.Provider>}
                                    <h3 className={'h3DataField'}>
                                        {principal}
                                    </h3>
                                    {isOwner && 
                                    <IconContext.Provider value={{ size: '25px'}}>
                                        <RiIcons.RiDeleteBin2Line onClick={() => handleRemovePrincipal(principal, requestingApproval)}/>
                                    </IconContext.Provider>}
                                </div>
                            )
                        })
                    }
                </>
            </div>
        </div>
    )
};

const DataField = (props) => {
    const {
        journalState,
        dataField,
        dataSubField,
        label
    } = props;
    let text;
    if(journalState[dataField][dataSubField] || journalState[dataField][dataSubField] === 0) text = journalState[dataField][dataSubField]
    else text = journalState[dataField];

    return(
        <div className={'canisterDataDiv'}>
            <div className={'section'}>
                <h3 className={'lebelH3'}>
                    {label} 
                </h3>
            </div>
            <div className={'section'}>
                <h3 className={'h3DataField'}>
                    {text}
                </h3>
            </div>
        </div>
    )
};

const Analytics = () => {
    const { journalState, dispatch } = useContext(AppContext);

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
                                                journalState={journalState}
                                                dispatch={dispatch}
                                                dataField={'journalCount'}
                                            />
                                            <DataField
                                                label={'Front End Canister Principal:'}
                                                journalState={journalState}
                                                dispatch={dispatch}
                                                dataField={'canisterData'}
                                                dataSubField={CANISTER_DATA_FIELDS.frontEndPrincipal}
                                            />
                                            <DataField
                                                label={'Back End Canister Principal:'}
                                                journalState={journalState}
                                                dispatch={dispatch}
                                                dataField={'canisterData'}
                                                dataSubField={CANISTER_DATA_FIELDS.backEndPrincipal}
                                            />
                                            <DataField
                                                label={'Cycles Burned Per Day:'}
                                                journalState={journalState}
                                                dispatch={dispatch}
                                                dataField={'canisterData'}
                                                dataSubField={CANISTER_DATA_FIELDS.backEndCyclesBurnRatePerDay}
                                            />
                                            <DataField
                                                label={'Cycles Balance:'}
                                                journalState={journalState}
                                                dispatch={dispatch}
                                                dataField={'canisterData'}
                                                dataSubField={CANISTER_DATA_FIELDS.lastRecordedBackEndCyclesBalance}
                                            />
                                            <DataField
                                                label={'Canister Owner:'}
                                                journalState={journalState}
                                                dispatch={dispatch}
                                                dataField={'canisterData'}
                                                dataSubField={CANISTER_DATA_FIELDS.nftOwner}
                                            />
                                            <DataField
                                                label={'NFT ID:'}
                                                journalState={journalState}
                                                dispatch={dispatch}
                                                dataField={'canisterData'}
                                                dataSubField={CANISTER_DATA_FIELDS.nftId}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {   journalState.canisterData.isOwner &&
                                    <div className={'transparentDiv__homePage__dataFields approvedPrincipals  animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                        <div className={'AnalyticsDiv'}>
                                            <div className={'AnalyticsContentContainer'}>
                                                <DataFieldArray
                                                    label={'Principals Requesting Approval:'}
                                                    dispatch={dispatch}
                                                    journalState={journalState}
                                                    dataField={'canisterData'}
                                                    dataSubField={CANISTER_DATA_FIELDS.requestsForApproval}
                                                    tuples={false}
                                                    isOwner={journalState.canisterData.isOwner}
                                                />
                                            </div>
                                        </div>
                                    </div> 
                                }
                                <div className={'transparentDiv__homePage__dataFields approvedPrincipals  animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className={'AnalyticsDiv'}>
                                        <div className={'AnalyticsContentContainer'}>
                                            <DataFieldArray
                                                label={'Approved Principals:'}
                                                dispatch={dispatch}
                                                tuples={true}
                                                journalState={journalState}
                                                dataField={'canisterData'}
                                                dataSubField={CANISTER_DATA_FIELDS.approvedUsers}
                                                isOwner={journalState.canisterData.isOwner}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {journalState.canisterData.isOwner && 
                                <div className={'switchDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className='section'>
                                        <h3 className={'lebelH3'}> 
                                            Activate Support Mode:  
                                        </h3>
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
                                        <h3 className={'lebelH3'}> 
                                            Receive Requests:  
                                        </h3>
                                    </div>
                                    <div className='section'>
                                        <Switch
                                            active={journalState.canisterData.acceptingRequests}
                                            onClick={toggleAcceptRequest}
                                        />
                                    </div>
                                </div>}
                                <div className={'registryButtonDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <button className={'registryButton'} onClick={handleRegistration}> Register As New Owner </button>
                                </div>
                                <div className={'transparentDiv__homePage__roadMap animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                    <div className={'roadMapContentDiv'}>
                                        <div className={'missionStatementContentContainer'}>
                                            <div className={'roadMapDiv'}>
                                                <h3> Road Map: </h3>
                                                <ul>
                                                    <li>
                                                        Transaction history displayed in wallet section

                                                    </li>
                                                    <li>
                                                        Transaction summaries when sending ICP from wallets

                                                    </li>
                                                    <li>
                                                        Journal entry streak counter

                                                    </li>
                                                    <li>
                                                        Bitcoin Integration and wallet compatability

                                                    </li>
                                                    <li>
                                                        Ethereum Integration and wallet compatability

                                                    </li>
                                                    <li>
                                                        Digital Time Capsule Token

                                                    </li>
                                                    <li>
                                                        Digital Time Capsule Token price analytics and graphing viewable from wallet section

                                                    </li>
                                                    <li>
                                                        Reduce load time
                                                        
                                                    </li>
                                                    <li>
                                                        Digital Time Capsule Governance System

                                                    </li>
                                                    <li>
                                                        Video Compatability for journal entries

                                                    </li>
                                                    <li>
                                                        Group/Community Time Capsules

                                                    </li>
                                                </ul>
                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>}
                </div>

        
    )

}

export default Analytics;