import React, {useCallback, useContext, useEffect, useState} from 'react';
import { AppContext } from '../Wallet';
import { nanoSecondsToMiliSeconds, toHexString } from '../Utils';
import { types } from '../reducers/journalReducer';
import { Link } from "react-router-dom";
import { Modal } from './Modal';
import './WalletPage.scss';
import { fromE8s, toHexString, shortenHexString } from '../Utils';
import { e8sInOneICP } from '../Constants';
import LoadScreen from './LoadScreen';
import ModalContentOnSend from './ModalContentOnSend';
import QRCode from 'qrcode';


const WalletPage = (props) => {

    const mql = window.matchMedia('(max-width: 675px)');

    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [txHistory, setTxHistory] = useState([]);
    const [isTxHistoryLoading, setIsTxHistoryLoading] = useState(false);
    const [imgUrl, setImgUrl] = useState('');

    const openModal = () => {
        setShowModal(true);
    };

    const generateQrCode = async () => {
        try{
           const response = await QRCode.toDataURL(journalState.walletData.address);
           setImgUrl(response);
        } catch (error){
            console.log('line 40: ',error);
        }
    };

    const unavailble = 'unavailble';

    const Transaction = (props) => {

        const {
            balanceDelta,
            increase,
            recipient,
            timeStamp,
            source
        } = props;
        console.log('line 53: ',nanoSecondsToMiliSeconds(parseInt(timeStamp)));
        const date = timeStamp ? new Date(nanoSecondsToMiliSeconds(parseInt(timeStamp))).toString() : unavailble;
        const sourceOfTx = source ? shortenHexString(toHexString(source)) : unavailble;
        const recipientOfTx = recipient ? shortenHexString(toHexString(recipient)) : unavailble;

        return(
                <div className='transactionHistoryDiv' >
                    <div className="balanceDeltaDiv">
                        <h4 className="balanceDeltaText">
                            Change in balance: 
                        </h4>
                        <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                            {` ${increase ? "+ " : "- "}  ${fromE8s(parseInt(balanceDelta))} ICP`} 
                        </p>
                    </div>
                    {
                        (recipientOfTx !== unavailble) ? 
                        <div className="balanceDeltaDiv">
                            <h4 className="balanceDeltaText">
                                Recipient Address: 
                            </h4>
                            <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                                {recipientOfTx} 
                            </p>
                        </div> : null 
                    }
                    <div className="dateDiv">
                        <h4 className="dateText">
                            Date: 
                        </h4>
                        <p className={`dateValue${increase ? " increase" : " decrease"}`}> 
                            {date} 
                        </p>
                    </div>
                    <div className="balanceDeltaDiv">
                        <h4 className="balanceDeltaText">
                            Source Address: 
                        </h4>
                        <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                            {sourceOfTx} 
                        </p>
                    </div>
                </div>                
        )
    };

    const copyWalletAddress = useCallback(() => {
        const address = journalState.walletData.address;

        const addressTextArea = document.createElement("input");

        document.body.appendChild(addressTextArea);

        addressTextArea.setAttribute("id", "addressTextArea_id");

        document.getElementById("addressTextArea_id").value = address;


        addressTextArea.select();

        document.execCommand("copy");

        document.body.removeChild(addressTextArea);

        alert("Wallet Address Copied To Clip Board");

    }, [journalState]);

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

            await generateQrCode();

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
            let tocDetails = await actor.tipOfChainDetails();
            let startIndex = await actor.getStartIndex();
            let resultOfUpdatedProfiles = await actor.populateAccountIdTrie();
            console.log('line 156: ', resultOfUpdatedProfiles);
            console.log('line 157: ',transactionHistory);
            console.log('tip of Chain: ',tocDetails);
            console.log('startIndex: ', startIndex);
            setTxHistory(transactionHistory);
            setIsTxHistoryLoading(false);
        }
    },[actor, authClient]);

    console.log('line 163: ',journalState.walletData);

    return (
        isLoading ?
        <LoadScreen/> :
        <div className={"container"}>
            <div className={'linkDiv_Wallet'}>
                <nav className={'navBar_Wallet'}>
                    <div className="linkContainer">
                        <div className="timeCapsuleLinkDiv">
                            <Link className={"navLink_Wallet"} to="/app">Time Capsule</Link>
                        </div>
                        <div className="accountIconLinkDiv">
                            <Link className={"navLink_Wallet"} to='/account'>
                                <img src={"account-icon.png"} alt="image preview" className="accountIcon_Wallet"/> 
                            </Link>
                        </div>
                        <div className="dashboardIconDiv">
                            <Link className={"navLink_Journal"} to='/'>
                                <img src={"dashboard-icon.png"} alt="image preview" className="dashboardIcon_Wallet"/> 
                            </Link>
                        </div>
                    </div>
                </nav>
            </div> 
            <div className="background center">
                { showModal ? 
                    <Modal showModal={showModal} setShowModal={setShowModal} ChildComponent={ModalContentOnSend} /> :
                    <div className='scrollable'>
                        <div className={'transparentDiv'}>
                            <div className='infoDiv' >
                                <div className="balanceDiv">
                                    Wallet Balance: {journalState.walletData.balance /  e8sInOneICP} ICP
                                </div>
                                { mql.matches ? 
                                    <div className={'imgDiv'}>
                                        <img className='img' src={imgUrl} alt='Wallet QR Code'/>
                                    </div> : 
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
                                    <div className={'imgDiv'}>
                                        <img src={imgUrl} alt='Wallet QR Code'/>
                                    </div> : 
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
                }
            </div>
        </div>
    );
} 
export default WalletPage;