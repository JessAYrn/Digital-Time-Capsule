import React, {useContext, useEffect, useState} from 'react';
import { AppContext } from '../Wallet';
import { toHexString } from '../Utils';
import { types } from '../reducers/journalReducer';
import { Modal } from './WalletModal';
import './WalletPage.scss';
import { e8sInOneICP } from '../Constants';

const WalletPage = (props) => {

    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);
    const [showModal, setShowModal] = useState(false);

    const openModal = () => {
        setShowModal(true);
    }

    useEffect(async () => {
        const journal = await actor.readJournal();
        console.log(journal);
        if("err" in journal){
            actor.create({
                userName: "admin",
                email: "admin@test.com"
        }).then((result) => {
                console.log(result);
            });
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
        }
    },[actor, authClient]);

    console.log(journalState.walletData);

    return (
        <div className={"container"}>
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