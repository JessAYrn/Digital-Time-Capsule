import React, {useCallback, useContext, useEffect, useState} from 'react';
import { AppContext } from '../Wallet';
import { toHexString } from '../Utils';
import { types } from '../reducers/journalReducer';
import { Link } from "react-router-dom";
import { Modal } from './WalletModal';
import './WalletPage.scss';
import { e8sInOneICP } from '../Constants';
import LoadScreen from './LoadScreen';

const WalletPage = (props) => {

    const mql = window.matchMedia('(max-width: 675px)');

    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const openModal = () => {
        setShowModal(true);
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
                    </div>
                </nav>
            </div> 
            <div className="background center">
                { showModal ? 
                    <Modal showModal={showModal} setShowModal={setShowModal} /> :
                    <div className='scrollable'>
                        <div className={'transparentDiv'}>
                            <div className='infoDiv' >
                                <div className="balanceDiv">
                                    Wallet Balance: {journalState.walletData.balance /  e8sInOneICP} ICP
                                </div>
                                <div className='walletAddressDiv'>
                                    <p className='firstPTag'>
                                        Wallet Address:  
                                    </p>
                                    <p className='secondPTag'>
                                        {journalState.walletData.address.slice(0,9)} ... {journalState.walletData.address.slice(-10)} 
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
                }
            </div>
        </div>
    );
} 
export default WalletPage;