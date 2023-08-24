import React, {useCallback, useContext, useEffect, useState} from 'react';
import { AppContext } from '../Wallet';
import { NavBar } from '../../Components/navigation/NavBar';
import './WalletPage.scss';
import { shortenHexString } from '../../functionsAndConstants/Utils';
import { e8sInOneICP } from '../../functionsAndConstants/Constants';
import {  RenderQrCode } from '../../functionsAndConstants/walletFunctions/GenerateQrCode';
import { copyWalletAddressHelper } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import { Transaction } from '../../functionsAndConstants/walletFunctions/Transaction';
import { loadTxHistory } from '../../functionsAndConstants/loadingFunctions';
import * as GrIcons from 'react-icons/gr';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai'
import { testTx } from '../../testData/Transactions';
import LoadScreen from './LoadScreen';
import { types } from '../../reducers/journalReducer';
import { walletTypes } from '../../reducers/walletReducer';
import { UI_CONTEXTS } from '../../functionsAndConstants/Contexts';
import ButtonField from '../../Components/Fields/Button';
import '../../SCSS/contentContainer.scss'


const WalletPage = (props) => {

    const { 
        walletState, walletDispatch, actorState, actorDispatch
    } = useContext(AppContext);
    const [loadingTx, setIsLoadingTx] = useState(false);
    const [showReloadButton, setShowReloadButton] = useState(false);

    const openModal = () => {

    };

    const loadTxs = async () => {
        setIsLoadingTx(true);
        setShowReloadButton(true);
        let result = await loadTxHistory(actorState, walletDispatch, walletTypes);
        setIsLoadingTx(false);
    };

    const copyWalletAddress = useCallback(() => copyWalletAddressHelper(walletState.walletData.address), [walletState]);

    return (
        <div className={"container"}>
            <NavBar context={UI_CONTEXTS.WALLET}/>
            <div className={"container__wallet"}>
                <div className={'transparentDiv__wallet'}>
                    <div className={`infoDiv_wallet contentContainer `} >
                        <RenderQrCode
                            imgUrl={walletState.walletData.qrCodeImgUrl}
                        />  
                        <div className={'textsDiv'}>
                            <div className="balanceDiv">
                                Wallet Balance: {walletState.walletData.balance /  e8sInOneICP} ICP
                            </div>
                            <div className={'walletInfoDiv'}>
                                <div className='walletAddressDiv'>
                                    <p className='firstPTag'>
                                        Wallet Address:  
                                    </p>
                                    <p className='secondPTag'>
                                        {shortenHexString(walletState.walletData.address)} 
                                    </p> 
                                    <ButtonField
                                        Icon={FaIcons.FaCopy}
                                        iconSize={17.5}
                                        onClick={copyWalletAddress}
                                        withBox={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    { loadingTx ? 
                        <div className={`loadGifContainer contentContainer `}>
                            <div className='loadGifDiv'>
                                <img src="Loading.gif" alt="Loading Screen" />
                            </div>
                        </div> :
                        !walletState.walletData.txHistory.data.length ? 
                            !showReloadButton && 
                            <ButtonField
                                text={'Load Transaction History'}
                                className={'loadTxHistory active'}
                                onClick={loadTxs}
                                withBox={true}
                            /> :
                            walletState.walletData.txHistory.data.map((tx) => {
                                return(
                                        <Transaction
                                            class_={`contentContainer `}
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
                {(showReloadButton || walletState.walletData.txHistory.data.length > 0) && 
                    <ButtonField
                        Icon={AiIcons.AiOutlineReload}
                        className={'reloadTxData'}
                        iconSize={25}
                        onClick={loadTxs}
                        withBox={true}
                    />}
                <ButtonField
                    Icon={GrIcons.GrSend}
                    className={'sendTxDiv'}
                    iconSize={25}
                    onClick={openModal}
                    withBox={true}
                />
            </div>
            
        </div>
        
    );
} 
export default WalletPage;