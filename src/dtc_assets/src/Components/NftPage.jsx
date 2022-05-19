import React, {useEffect, useReducer, useState, useContext } from "react";
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import { AppContext } from "../NFTs";
const NftPage = () => {
    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const {actor, authClient, setIsLoaded, setSubmissionsMade, submissionsMade} = useContext(AppContext);

    useEffect(async () => {
        setIsLoading(true);
        const nftCollection = await actor.getUserNFTs();
        console.log('line 11: ',nftCollection);
        if("err" in nftCollection){
            console.log('line 13: ',nftCollection);
            setIsLoading(false);
        } else {
            console.log(nftCollection);
            // dispatch({
            //     payload: walletData,
            //     actionType: types.SET_WALLET_DATA
            // });
            setIsLoading(false);
        }
    },[actor, authClient]);

    return(
        <div>  </div>
    );

};

export default NftPage;