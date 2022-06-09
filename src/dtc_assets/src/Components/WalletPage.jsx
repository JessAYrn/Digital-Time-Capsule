import React, {useCallback, useContext, useState, useMemo} from 'react';
import { AppContext } from '../Wallet';
import { NavBar } from './navigation/NavBar';
import { Modal } from './Modal';
import './WalletPage.scss';
import { shortenHexString } from '../Utils';
import { e8sInOneICP, MODALS_TYPES } from '../Constants';
import ModalContentOnSend from './modalContent/ModalContentOnSend';
import {  RenderQrCode } from './walletFunctions/GenerateQrCode';
import { copyWalletAddressHelper } from './walletFunctions/CopyWalletAddress';
import { Transaction } from './walletFunctions/Transaction';

const WalletPage = (props) => {

    const mql = window.matchMedia('(max-width: 675px)');
    const { journalState, dispatch } = useContext(AppContext);
    const [modalStatus, setModalStatus] = useState({show: false, which: MODALS_TYPES.onSend});

    const openModal = () => {
        setModalStatus({show: true, which: MODALS_TYPES.onSend});
    };

    const copyWalletAddress = useCallback(() => copyWalletAddressHelper(journalState.walletData.address), [journalState]);

    console.log('line 163: ',journalState.walletData);

    const ChildComponent = useMemo(() => {

        let ChildComp = ModalContentOnSend;
        return ChildComp;
    },[modalStatus]);

    return (
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
                                            imgUrl={journalState.walletData.qrCodeImgUrl}
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
                                            imgUrl={journalState.walletData.qrCodeImgUrl}
                                        /> : 
                                        null
                                    }
                                </div>                
                            </div>
                            <div className='transparentDiv'> 
                                { journalState.walletData.txHistory.isLoading ? 
                                <div className='loadGifContainer'>
                                    <div className='loadGifDiv'>
                                        <img src="Loading.gif" alt="Loading Screen" />
                                    </div>
                                </div>
                                    :
                                    journalState.walletData.txHistory.data.map((tx) => {
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