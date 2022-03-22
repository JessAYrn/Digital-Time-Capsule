import React, {useContext, useEffect, useState} from 'react';
import { AppContext } from '../Wallet';
import { toHexString } from '../Utils';
import { types } from '../reducers/journalReducer';
import { Link } from "react-router-dom";
import { Modal } from './WalletModal';
import './WalletPage.scss';
import { e8sInOneICP } from '../Constants';
import LoadScreen from './LoadScreen';

const WalletPage = (props) => {

    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const openModal = () => {
        setShowModal(true);
    }

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
                <div className='scrollable'>
                    <div className={'transparentDiv'}>
                        <div className='infoDiv' >
                            <div className="balanceDiv">
                                Wallet Balance: {journalState.walletData.balance /  e8sInOneICP} ICP
                            </div>
                            <div className='walletAddressDiv'>
                                Wallet Address: {journalState.walletData.address}
                            </div>
                            <div className="buttonsDiv" >
                                <button className='button' onClick={openModal}> Send </button>
                            </div>
                            <Modal showModal={showModal} setShowModal={setShowModal} />
                        </div>                
                    </div>
                </div>
            </div>
        </div>
    );
} 
export default WalletPage;