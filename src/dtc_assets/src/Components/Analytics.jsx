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

const DataFieldArray = (props) => {
    const {
        journalState,
        dataField,
        dataSubField,
        label
    } = props;
    let array = journalState[dataField][dataSubField] || journalState[dataField];
    console.log(array);

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
                            return (
                                <h3 className={'h3DataField'}>
                                    {principal[0]}
                                </h3>
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
        journalState.isLoading ? 
            <LoadScreen/> :
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
                                            dataSubField={'frontEndPrincipal'}
                                        />
                                        <DataField
                                            label={'Back End Canister Principal:'}
                                            journalState={journalState}
                                            dispatch={dispatch}
                                            dataField={'canisterData'}
                                            dataSubField={'backEndPrincipal'}
                                        />
                                        <DataField
                                            label={'Cycles Burned Per Day:'}
                                            journalState={journalState}
                                            dispatch={dispatch}
                                            dataField={'canisterData'}
                                            dataSubField={'backEndCyclesBurnRatePerDay'}
                                        />
                                        <DataField
                                            label={'Cycles Balance:'}
                                            journalState={journalState}
                                            dispatch={dispatch}
                                            dataField={'canisterData'}
                                            dataSubField={'lastRecordedBackEndCyclesBalance'}
                                        />
                                        <DataField
                                            label={'Canister Owner:'}
                                            journalState={journalState}
                                            dispatch={dispatch}
                                            dataField={'canisterData'}
                                            dataSubField={'nftOwner'}
                                        />
                                        <DataField
                                            label={'NFT ID:'}
                                            journalState={journalState}
                                            dispatch={dispatch}
                                            dataField={'canisterData'}
                                            dataSubField={'nftId'}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={'transparentDiv__homePage__dataFields approvedPrincipals  animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                <div className={'AnalyticsDiv'}>
                                    <div className={'AnalyticsContentContainer'}>
                                        <DataFieldArray
                                            label={'Approved Principals:'}
                                            dispatch={dispatch}
                                            journalState={journalState}
                                            dataField={'canisterData'}
                                            dataSubField={'approvedUsers'}
                                        />
                                    </div>
                                </div>
                            </div>
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
                    </div>
                </div>

        
    )

}

export default Analytics;