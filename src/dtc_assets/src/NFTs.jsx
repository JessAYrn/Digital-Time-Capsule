import React, { createContext, useState, useReducer, useEffect} from 'react';
import LoginPage from './Components/LoginPage';
import journalReducer, { types, initialState } from './reducers/journalReducer';
import { generateQrCode } from './Components/walletFunctions/GenerateQrCode';
import { useLocation } from 'react-router-dom';
import { mapApiObjectToFrontEndJournalEntriesObject } from './mappers/journalPageMappers';
import LoadScreen from './Components/LoadScreen';
import { toHexString } from '@dfinity/candid/lib/cjs/utils/buffer';
import NftPage from './Components/NftPage';
import {AuthClient} from "@dfinity/auth-client";
import { canisterId, createActor } from '../../declarations/dtc/index';
import { UI_CONTEXTS } from './Contexts';


export const AppContext = createContext({
    authClient: {}, 
    setAuthClient: null,
    loginAttempted: undefined,
    setLoginAttempted: null,
    journalState:{},
    dispatch: () => {},
    actor: undefined,
    setActor: null
});


const NFTapp = () => {

    const [actor, setActor] = useState(undefined);
    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [authClient, setAuthClient] = useState(undefined);
    const [isLoaded, setIsLoaded] = useState(true);
    const [loginAttempted, setLoginAttempted] = useState(false);

    // login function used when Authenticating the client (aka user)
    useEffect(() => {
        AuthClient.create().then(async (client) => {
            setAuthClient(client);
            await client.isAuthenticated().then((result) => {
                dispatch({
                    actionType: types.SET_IS_AUTHENTICATED,
                    payload: result
                });
            });
            setIsLoaded(true);
        });
    }, [isLoaded]);

    //Creating the canisterActor that enables us to be able to call the functions defined on the backend
    useEffect(() => {
        if(!authClient) return;

        const identity = authClient.getIdentity();
        const actor = createActor(canisterId, {
            agentOptions: {
                identity
            }
        });
        setActor(actor);

    }, [authClient]);

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
    };

    useEffect(async () => {
        if(!journalState.isAuthenticated || !actor){
            return
        };
        if(journalState.reloadStatuses.nftData){
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let nftCollection = await actor.getUserNFTsInfo();
            nftCollection = nftCollection.ok;
            if("err" in nftCollection){
                actor.create().then((result) => {
                    dispatch({
                        actionType: types.SET_IS_LOADING,
                        payload: false
                    });
                });
            } else {
                dispatch({
                    payload: nftCollection,
                    actionType: types.SET_NFT_DATA
                });
                dispatch({
                    payload: false,
                    actionType: types.SET_NFT_DATA_RELOAD_STATUS
                });
                dispatch({
                    actionType: types.SET_IS_LOADING,
                    payload: false
                });
            }
        }
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await actor.readWalletData();
            const address = toHexString(new Uint8Array( [...walletDataFromApi.ok.address]))
            const walletData = { 
                balance : parseInt(walletDataFromApi.ok.balance.e8s), 
                address: address
            };

            const qrCodeImgUrl = await generateQrCode(address);
            dispatch({
                actionType: types.SET_WALLET_QR_CODE_IMG_URL,
                payload: qrCodeImgUrl
            });
            
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

        <AppContext.Provider 
            value={{
                authClient, 
                setIsLoaded,
                journalState,
                dispatch,
                loginAttempted, 
                setLoginAttempted, 
                actor
            }}
        >
            {
                isLoaded &&
                    journalState.isAuthenticated ? 
                    journalState.isLoading ? 
                        <LoadScreen/> :
                            <NftPage/> : 
                            <LoginPage
                                context={UI_CONTEXTS.NFT}
                            /> 
            }
            {
                !isLoaded && 
                    <h2> Load Screen </h2>
            }

        </AppContext.Provider>

    );

};


export default NFTapp;