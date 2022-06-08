import React, {useEffect, useReducer, useState, useContext } from "react";
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import { useLocation } from "react-router-dom";
import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { AppContext } from "../NFTs";
import { toHexString } from "../Utils";
import { NavBar } from "./navigation/NavBar";
import "./NftPage.scss";
const NftPage = () => {
    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    //gets state from previous route
    const location = useLocation();
    //dispatch state from previous route to redux store if that state exists
    if(location.state){
        dispatch({
            actionType: types.SET_ENTIRE_REDUX_STATE,
            payload: location.state
        });
        //wipe previous location state to prevent infinite loop
        location.state = null;
    }

    const [isLoading, setIsLoading] = useState(false);
    const {actor, authClient, setIsLoaded, setSubmissionsMade, submissionsMade} = useContext(AppContext);

    useEffect(async () => {
        if(journalState.reloadStatuses.nftData){
            setIsLoading(true);
            const nftCollection = await actor.getUserNFTsInfo();
            console.log('line 11: ',nftCollection);
            if("err" in nftCollection){
                actor.create().then((result) => {
                    console.log(result);
                    setIsLoading(false);
                });
            } else {
                console.log(nftCollection);
                dispatch({
                    payload: nftCollection,
                    actionType: types.SET_NFT_DATA
                });
                dispatch({
                    payload: false,
                    actionType: types.SET_NFT_DATA_RELOAD_STATUS
                });
                setIsLoading(false);
            }
        }
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await actor.readWalletData();
            const walletData = { 
                balance : parseInt(walletDataFromApi.ok.balance.e8s), 
                address: toHexString(new Uint8Array( [...walletDataFromApi.ok.address])) 
            };
            
            dispatch({
                payload: walletData,
                actionType: types.SET_WALLET_DATA
            });

            dispatch({
                actionType: types.SET_WALLET_DATA_RELOAD_STATUS,
                payload: false,
            });
        }
        if(journalState.reloadStatuses.journalData){
            //Load Journal Data in the background
            const journal = await actor.readJournal();

            const journalEntriesObject = mapApiObjectToFrontEndJournalEntriesObject(journal);
            let journalEntries = journalEntriesObject.allEntries;
            let unreadEntries = journalEntriesObject.unreadEntries;

            dispatch({
                payload: unreadEntries,
                actionType: types.SET_JOURNAL_UNREAD_ENTRIES
            })

            const journalBio = journal.ok.userJournalData[1];
            const metaData = {email : journal.ok.email, userName: journal.ok.userName};
            
            dispatch({
                payload: metaData,
                actionType: types.SET_METADATA
            })
            dispatch({
                payload: journalBio,
                actionType: types.SET_BIO
            })
            dispatch({
                payload: journalEntries,
                actionType: types.SET_JOURNAL
            });
            dispatch({
                actionType: types.SET_JOURNAL_DATA_RELOAD_STATUS,
                payload: false,
            });
            
        }
    },[actor, authClient]);

    return(
        <div className='container'>
            <div className={"background"}>
            <NavBar
                walletLink={true}
                journalLink={true}
                nftLink={false}
                accountLink={true}
                dashboardLink={true}
                notificationIcon={false}
                journalState={journalState}
            />
            </div>
        </div>
    );

};

export default NftPage;