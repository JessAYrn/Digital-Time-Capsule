import React, {useCallback, useContext, useReducer, useEffect, useState, useMemo} from 'react';
import { useLocation } from 'react-router-dom';
import journalReducer, {initialState} from "../reducers/journalReducer";
import { AppContext } from '../Wallet';
import { toHexString } from '../Utils';
import { types } from '../reducers/journalReducer';
import { NavBar } from './navigation/NavBar';
import { Modal } from './Modal';
import './WalletPage.scss';
import { mapApiObjectToFrontEndJournalEntriesObject } from '../mappers/journalPageMappers';
import { toHexString, shortenHexString } from '../Utils';
import { e8sInOneICP, MODALS_TYPES } from '../Constants';
import LoadScreen from './LoadScreen';
import ModalContentOnSend from './modalContent/ModalContentOnSend';
import { generateQrCode, RenderQrCode } from './walletFunctions/GenerateQrCode';
import { copyWalletAddressHelper } from './walletFunctions/CopyWalletAddress';
import { Transaction } from './walletFunctions/Transaction';
import { testTx } from '../testData/Transactions';

const WalletPage = (props) => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    //gets state from previous route
    let location = useLocation();
    //dispatch state from previous route to redux store if that state exists
    if(location.state){
        dispatch({
            actionType: types.SET_ENTIRE_REDUX_STATE,
            payload: location.state
        });
        //wipe previous location state to prevent infinite loop
        location.state = null;
    }

    const mql = window.matchMedia('(max-width: 675px)');
    const { actor, authClient } = useContext(AppContext);
    const [modalStatus, setModalStatus] = useState({show: false, which: MODALS_TYPES.onSend});
    const [isLoading, setIsLoading] = useState(false);
    const [txHistory, setTxHistory] = useState([]);
    const [isTxHistoryLoading, setIsTxHistoryLoading] = useState(false);
    const [imgUrl, setImgUrl] = useState('');

    const openModal = () => {
        setModalStatus({show: true, which: MODALS_TYPES.onSend});
    };

    const loadTxHistory = async () => {
        setIsTxHistoryLoading(true);
        setImgUrl(await generateQrCode(journalState.walletData.address));

        const tx = await actor.readTransaction();
        const transactionHistory = tx.ok.sort(function(a,b){
            const mapKeyOfA = parseInt(a[0]);
            const mapKeyOfB = parseInt(b[0]);
            if (mapKeyOfA > mapKeyOfB){
                return -1
            } else {
                return 1
            }
        });
        console.log('line 159: ',transactionHistory);
        setTxHistory(transactionHistory);
        setIsTxHistoryLoading(false);
    };

    const copyWalletAddress = useCallback(() => copyWalletAddressHelper(journalState.walletData.address), [journalState]);

    //Loading Time Capsule Data
    useEffect(async () => {
        if(journalState.reloadStatuses.walletData){
            setIsLoading(true);
            const walletDataFromApi = await actor.readWalletData();
            console.log('line 122: ',walletDataFromApi);
            if("err" in walletDataFromApi){
                actor.create().then((result) => {
                    console.log('line 125: ',result);
                });
                setIsLoading(false);
            } else {
                console.log('line 129: ',walletDataFromApi.ok);
                console.log('line 130: ',toHexString(new Uint8Array( [...walletDataFromApi.ok.address])));
                const walletData = { 
                    balance : parseInt(walletDataFromApi.ok.balance.e8s), 
                    address: toHexString(new Uint8Array( [...walletDataFromApi.ok.address])) };
                
                dispatch({
                    payload: walletData,
                    actionType: types.SET_WALLET_DATA
                });
                dispatch({
                    actionType: types.SET_WALLET_DATA_RELOAD_STATUS,
                    payload: false,
                });
                setIsLoading(false);
                await loadTxHistory();

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
        } else {
            await loadTxHistory();
        }
    },[actor, authClient]);

    console.log('line 163: ',journalState.walletData);

    const ChildComponent = useMemo(() => {

        let ChildComp = ModalContentOnSend;
        return ChildComp;
    },[modalStatus]);

    return (
        isLoading ?
        <LoadScreen/> :
        <div className={"container"}>
            <div className="background center">
                { modalStatus.show ? 
                    <Modal 
                        modalStatus={modalStatus} 
                        setModalStatus={setModalStatus} 
                        ChildComponent={ChildComponent} /> :
                    <>
                        <NavBar
                            walletLink={false}
                            journalLink={true}
                            nftLink={true}
                            accountLink={true}
                            dashboardLink={true}
                            notificationIcon={false}
                            journalState={journalState}
                        />
                        <div className='scrollable'>
                            <div className={'transparentDiv'}>
                                <div className='infoDiv' >
                                    <div className="balanceDiv">
                                        Wallet Balance: {journalState.walletData.balance /  e8sInOneICP} ICP
                                    </div>
                                    { mql.matches ? 
                                        <RenderQrCode
                                            imgUrl={imgUrl}
                                        /> : 
                                        null
                                    }
                                    <div className={'walletInfoDiv'}>
                                        <div className='walletAddressDiv'>
                                            <p className='firstPTag'>
                                                Wallet Address:  
                                            </p>
                                            <p className='secondPTag'>
                                                {shortenHexString(journalState.walletData.address)} 
                                            </p> 
                                        </div>
                                        <div className={"copyWalletAddressButton"}>
                                            <button className='button' onClick={copyWalletAddress}> Copy Wallet Address </button>
                                        </div>
                                        <div className="buttonsDiv" >
                                            <button className='button' onClick={openModal}> Send </button>
                                        </div>
                                    </div>
                                    { !mql.matches ? 
                                        <RenderQrCode
                                            imgUrl={imgUrl}
                                        /> : 
                                        null
                                    }
                                </div>                
                            </div>
                            <div className='transparentDiv'> 
                                { isTxHistoryLoading ? 
                                <div className='loadGifContainer'>
                                    <div className='loadGifDiv'>
                                        <img src="Loading.gif" alt="Loading Screen" />
                                    </div>
                                </div>
                                    :
                                    txHistory.map((tx) => {
                                        return(
                                                <Transaction
                                                    balanceDelta={tx[1].balanceDelta}
                                                    increase={tx[1].increase}
                                                    recipient={tx[1].recipient[0]}
                                                    timeStamp={tx[1].timeStamp[0]}
                                                    source={tx[1].source[0]}
                                                />
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </>
                }
            </div>
        </div>
        
    );
} 
export default WalletPage;