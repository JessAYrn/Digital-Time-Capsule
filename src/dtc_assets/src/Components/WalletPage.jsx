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

    const openModal = () => {
        setShowModal(true);
    };

    const Transaction = (props) => {

        const {
            balanceDelta,
            increase,
            recipient,
            remainingBalance,
            timeStamp
        } = props;
        console.log(nanoSecondsToMiliSeconds(parseInt(timeStamp)));
        const date = new Date(nanoSecondsToMiliSeconds(parseInt(timeStamp)));

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
                        (recipient.length) ? 
                        <div className="balanceDeltaDiv">
                            <h4 className="balanceDeltaText">
                                Recipient Address: 
                            </h4>
                            <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                                {shortenHexString(toHexString(recipient[0]))} 
                            </p>
                        </div> : null 
                    }
                    <div className="dateDiv">
                        <h4 className="dateText">
                            Date: 
                        </h4>
                        <p className={`dateValue${increase ? " increase" : " decrease"}`}> 
                            {date.toString()} 
                        </p>
                    </div>
                    <div className="balanceDeltaDiv">
                        <h4 className="balanceDeltaText">
                            Remaining balance: 
                        </h4>
                        <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                            {` ${fromE8s(parseInt(remainingBalance.e8s))} ICP`} 
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
        console.log(journal);
        if("err" in journal){
            actor.create().then((result) => {
                console.log(result);
            });
            setIsLoading(false);
        } else {
            console.log(journal.ok);
            console.log(toHexString(new Uint8Array( [...journal.ok.address])));
            const walletData = { 
                balance : parseInt(journal.ok.balance.e8s), 
                address: toHexString(new Uint8Array( [...journal.ok.address])) };
            
            dispatch({
                payload: walletData,
                actionType: types.SET_WALLET_DATA
            });
            setIsLoading(false);
            setIsTxHistoryLoading(true);
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
            setTxHistory(transactionHistory);
            setIsTxHistoryLoading(false);
        }
    },[actor, authClient]);

    console.log(journalState.walletData);

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
                                                recipient={tx[1].recipient}
                                                remainingBalance={tx[1].remainingBalance}
                                                timeStamp={tx[1].timeStamp}
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