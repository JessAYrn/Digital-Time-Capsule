import React, { useContext, useEffect} from 'react';
import { getIntObserverFunc, visibilityFunctionDefault } from './animations/IntersectionObserverFunctions';
import { AppContext } from '../HomePage';

import "./Analytics.scss"

const DataField = (props) => {
    const {
        journalState,
        dataField,
        dataSubField,
        label
    } = props;

    return(
        <div className={'canisterDataDiv'}>
            <div className={'section'}>
                <h3 className={'lebelH3'}>
                    {label} 
                </h3>
            </div>
            <div className={'section'}>
                { journalState.isLoading ? 
                    <img src="../assets/Loading.gif" alt="Loading Screen" /> : 
                    <h3 className={'h3DataField'}>
                        {journalState[dataField][dataSubField] || journalState[dataField]}
                    </h3>
                }   
            </div>
        </div>
    )
}

const Analytics = () => {
    const { journalState, dispatch } = useContext(AppContext);

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
        <div className='container_homePage'>
            <div className={'transparentDiv__homePage__journalsCount  animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
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
            <div className={'transparentDiv__homePage__journalsCount  animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                <div className={'AnalyticsDiv'}>
                    <div className={'AnalyticsContentContainer'}>
                        <DataField
                            label={'Approved Principals:'}
                            dispatch={dispatch}
                            journalState={journalState}
                            dataField={'canisterData'}
                            dataSubField={'approvedUsers'}
                        />
                    </div>
                </div>
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
    )

}

export default Analytics;