import React, {useState, useEffect, useContext} from 'react';
import { AppContext } from '../HomePage';


const Analytics = () => {

    const [jounralCount, setJournalCount] = useState(null);

    const {actor, authClient, setIsLoaded} = useContext(AppContext);

    useEffect( async () => {

        await actor.getProfilesSize().then((profilesTrieSize) => {
            setJournalCount(parseInt(profilesTrieSize));
        });
    }, [authClient, actor]);

    console.log('JournalCount: ', jounralCount);

    return(
        <div className={'transparentDiv__homePage'}>
            <div className={'carouselDiv'}>
                <div className={'videoContainerDiv'}>
                </div>
            </div>
        </div>
    )

}

export default Analytics;