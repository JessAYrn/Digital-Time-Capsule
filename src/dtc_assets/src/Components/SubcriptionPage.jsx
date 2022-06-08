import React, { useEffect, useContext, useReducer, useState} from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import  InputBox  from './Fields/InputBox';
import { types } from '../reducers/journalReducer'
import { mapApiObjectToFrontEndJournalEntriesObject } from '../mappers/journalPageMappers';
import { toHexString } from '../Utils';
import CardInput from './CardInput';
import AdminSection from './AdminSection';
import "./SubscriptionPage.scss";
import { AppContext } from '../AccountPage';
import LoadScreen from './LoadScreen';
import { NavBar } from './navigation/NavBar';



const SubcriptionPage = (props) => {

    const { actor, authClient } = useContext(AppContext);
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    //gets state from previous route
    const location = useLocation();
    //dispatch state from previous route to redux store if that state exists
    if(location.state){
        console.log('location state:',location.state);
        dispatch({
            actionType: types.SET_ENTIRE_REDUX_STATE,
            payload: location.state
        });
        //wipe previous location state to prevent infinite loop
        location.state = null;
        console.log('location state:',location.state);

    }
    console.log('journalState: ', journalState);
    useEffect(async () => {
        if(journalState.reloadStatuses.journalData){
            setIsLoading(true);
            const journal = await actor.readJournal();
            setUserName(journal.ok.userName[0]);
            if("err" in journal){
                actor.create().then((result) => {
                    console.log(result);
                });
                setIsLoading(false);
            } else {
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

                setIsLoading(false);
            }
        }
        if(journalState.reloadStatuses.nftData){
            const nftCollection = await actor.getUserNFTsInfo();
            console.log(nftCollection);
            dispatch({
                payload: nftCollection,
                actionType: types.SET_NFT_DATA
            });
            dispatch({
                payload: false,
                actionType: types.SET_NFT_DATA_RELOAD_STATUS
            });
            
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
    },[actor, authClient]);

    const stripe = useStripe();
    const elements = useElements();

    const handleUpdate = async () => {

        const profileInput = {
            userName: (journalState.metaData.userName[0]) ? journalState.metaData.userName: [],
            email: (journalState.metaData.email[0]) ? journalState.metaData.email: []
        };
        console.log("input: ",profileInput);
        let result = await actor.updateProfile(profileInput);
        console.log(result);
        // if("err" in result){
        //     showErrorMessage();
        // };

    };

    console.log(journalState.metaData);

return(
    isLoading ?
    <LoadScreen/> :
    <div className='container'>
        <div className={"background"}>
            <NavBar
                walletLink={true}
                journalLink={true}
                nftLink={true}
                accountLink={false}
                dashboardLink={true}
                notificationIcon={false}
                journalState={journalState}
            />
            <div className={"logoDivContainer"}>
                <div className={'logoDiv'}>
                    <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo"/>
                    <div className={'subscriptionSection'}>
                        <InputBox
                            divClassName={"email"}
                            label={"Email: "}
                            rows={"1"}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_EMAIL}
                            value={journalState.metaData.email}
                        />
                        <InputBox
                            divClassName={"userName"}
                            label={"Username: "}
                            rows={"1"}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_USERNAME}
                            value={journalState.metaData.userName}
                        />
                        <div className={'updateButtonDiv'}>
                            <button className={'updateButton'} type="submit" onClick={handleUpdate}> Update Username & Email </button>
                        </div>
                        {userName === 'admin' && <AdminSection/>}
                        {/* <CardInput/>
                        <div className={'subscribeButtonDiv'}>
                            <button className={'subscriptionButton'} type="submit" onClick={handleSubmitSub}> Subscribe </button>
                        </div> */}
                    </div> 
                </div>
            </div>
        </div>
    </div>
)

};

export default SubcriptionPage;