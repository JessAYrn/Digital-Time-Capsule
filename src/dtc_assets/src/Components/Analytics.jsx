import React, {useState, useEffect, useContext} from 'react';
import { AppContext } from '../HomePage';


const Analytics = () => {

    const [totalValue, setTotalValue] = useState(null);
    const [jounralCount, setJournalCount] = useState(null);

    const {actor, authClient, setIsLoaded} = useContext(AppContext);

    useEffect( async () => {

        const icpTotal = await actor.getTotalValueLocked();
        setTotalValue(pasreInt(icpTotal.e8s));

        const profilesTrieSize = await actor.getProfilesSize();
        setJournalCount(parseInt(profilesTrieSize));
    }, [authClient, actor]);

    console.log('TotalValueLocked: ', totalValue);
    console.log('JournalCount: ', jounralCount);

}

export default Analytics;