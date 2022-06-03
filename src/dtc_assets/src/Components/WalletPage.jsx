import React, {useCallback, useContext, useEffect, useState, useMemo} from 'react';
import { AppContext } from '../Wallet';
import { toHexString } from '../Utils';
import { types } from '../reducers/journalReducer';
import { NavBar } from './navigation/NavBar';
import { Modal } from './Modal';
import './WalletPage.scss';
import { toHexString, shortenHexString } from '../Utils';
import { e8sInOneICP, MODALS_TYPES } from '../Constants';
import LoadScreen from './LoadScreen';
import ModalContentOnSend from './modalContent/ModalContentOnSend';
import { generateQrCode, RenderQrCode } from './walletFunctions/GenerateQrCode';
import { copyWalletAddressHelper } from './walletFunctions/CopyWalletAddress';
import { Transaction } from './walletFunctions/Transaction';
import { testTx } from '../testData/Transactions';

const WalletPage = (props) => {

    const mql = window.matchMedia('(max-width: 675px)');

    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);
    const [modalStatus, setModalStatus] = useState({show: false, which: MODALS_TYPES.onSend});
    const [isLoading, setIsLoading] = useState(false);
    const [txHistory, setTxHistory] = useState([]);
    const [isTxHistoryLoading, setIsTxHistoryLoading] = useState(false);
    const [imgUrl, setImgUrl] = useState('');

    const openModal = () => {
        setModalStatus({show: true, which: MODALS_TYPES.onSend});
    };

    const copyWalletAddress = useCallback(() => copyWalletAddressHelper(journalState.walletData.address), [journalState]);

    useEffect(async () => {
        setIsLoading(true);
        const journal = await actor.readJournal();
        console.log('line 122: ',journal);
        if("err" in journal){
            actor.create().then((result) => {
                console.log('line 125: ',result);
            });
            setIsLoading(false);
        } else {
            console.log('line 129: ',journal.ok);
            console.log('line 130: ',toHexString(new Uint8Array( [...journal.ok.address])));
            const walletData = { 
                balance : parseInt(journal.ok.balance.e8s), 
                address: toHexString(new Uint8Array( [...journal.ok.address])) };
            
            dispatch({
                payload: walletData,
                actionType: types.SET_WALLET_DATA
            });
            setIsLoading(false);

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