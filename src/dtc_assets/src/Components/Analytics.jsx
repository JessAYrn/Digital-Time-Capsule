import React, {useState, useEffect, useReducer, useContext} from 'react';
import { AppContext } from '../HomePage';
import "./Analytics.scss"


const Analytics = () => {

    const [jounralCount, setJournalCount] = useState(null);

    const [isLoading, setIsLoading] = useState(false);

    const {actor, authClient, setIsLoaded} = useContext(AppContext);

    useEffect( async () => {
        setIsLoading(true);
        await actor.getProfilesSize().then((profilesTrieSize) => {
            setJournalCount(parseInt(profilesTrieSize));
        });
        setIsLoading(false);
    }, [authClient, actor]);

    console.log('JournalCount: ', jounralCount);

    return(
        <>
            <div className={'transparentDiv__homePage__journalsCount'}>
                <div className={'AnalyticsDiv'}>
                    <div className={'AnalyticsContentContainer'}>
                        <div className={'jountalsCountDiv'}>
                            <h3 className={'infoH3'}>
                                Journals Created: 
                            </h3>
                            { isLoading ? 
                                <img src="Loading.gif" alt="Loading Screen" /> : 
                                <h1 className={'infoH1'}>
                                    {jounralCount}
                                </h1>
                            }   
                        </div>
                    </div>
                </div>
            </div>
            <div className={'transparentDiv__homePage__roadMap'}>
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
        </>
    )

}

export default Analytics;