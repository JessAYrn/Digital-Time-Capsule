import React, {useCallback, useContext, useEffect, useState} from 'react';
import { AppContext } from '../Wallet';
import { NavBar } from './navigation/NavBar';
import { Modal } from './Modal';
import './WalletPage.scss';
import { shortenHexString } from '../Utils';
import { e8sInOneICP, MODALS_TYPES } from '../Constants';
import {  RenderQrCode } from './walletFunctions/GenerateQrCode';
import { copyWalletAddressHelper } from './walletFunctions/CopyWalletAddress';
import { Transaction } from './walletFunctions/Transaction';
import { loadTxHistory } from './loadingFunctions';
import * as GrIcons from 'react-icons/gr';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai'
import { IconContext } from 'react-icons/lib';
import { testTx } from '../testData/Transactions';
import LoadScreen from './LoadScreen';
import { types } from '../reducers/journalReducer';
import { UI_CONTEXTS } from '../Contexts';
import { visibilityFunctionDefault, getIntObserverFunc } from './animations/IntersectionObserverFunctions';
import ButtonField from './Fields/Button';

const WalletPage = (props) => {

    const mql = window.matchMedia('(max-width: 939px)');
    const { journalState, dispatch } = useContext(AppContext);
    const [loadingTx, setIsLoadingTx] = useState(false);
    const [showReloadButton, setShowReloadButton] = useState(false);

    const openModal = () => {
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onSend}
        });
    };

    const loadTxs = async () => {
        setIsLoadingTx(true);
        setShowReloadButton(true);
        let result = await loadTxHistory(journalState, dispatch, types);
        setIsLoadingTx(false);
    };

    const copyWalletAddress = useCallback(() => copyWalletAddressHelper(journalState.walletData.address), [journalState]);

    useEffect(() => {
        const containers = document.querySelectorAll(".contentContainer.animatedLeft");
        containers.forEach( (container, index) => {
            let props_ = {
                className: "animatedLeft",
                containerIndex: index,
                visibilityFunction: visibilityFunctionDefault
            };
            const observer = new IntersectionObserver(getIntObserverFunc(props_), {threshold: .1});
            observer.observe(container);
        });
    }, [journalState])

    let contentContainerIndex = 0;

    return (
        <div className={"container"}>
            {journalState.modalStatus.show ? 
            
                <Modal 
                    context={UI_CONTEXTS.WALLET}
                /> :
                <>
                    <NavBar
                        walletLink={false}
                        journalLink={true}
                        nftLink={true}
                        accountLink={true}
                        dashboardLink={true}
                        notificationIcon={false}
                        context={UI_CONTEXTS.WALLET}
                    />
                    {journalState.isLoading ?
                        <LoadScreen/> :
                        <div className={"container__wallet"}>
                            <div className={'transparentDiv__wallet'}>
                                <div className={`infoDiv contentContainer _${contentContainerIndex++} animatedLeft`} >
                                    { mql.matches &&
                                        <RenderQrCode
                                            imgUrl={journalState.walletData.qrCodeImgUrl}
                                        />  
                                    }
                                    <div className={'textsDiv'}>
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
                                                <ButtonField
                                                    Icon={FaIcons.FaCopy}
                                                    iconSize={17.5}
                                                    onClick={copyWalletAddress}
                                                    withBox={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    { !mql.matches &&
                                        <RenderQrCode
                                            imgUrl={journalState.walletData.qrCodeImgUrl}
                                        />  
                                    }
                                </div>
                                { loadingTx ? 
                                    <div className={`loadGifContainer contentContainer _${contentContainerIndex} animatedLeft`}>
                                        <div className='loadGifDiv'>
                                            <img src="Loading.gif" alt="Loading Screen" />
                                        </div>
                                    </div> :
                                    !journalState.walletData.txHistory.data.length ? 
                                        !showReloadButton && 
                                        <ButtonField
                                            text={'Load Transaction History'}
                                            className={'loadTxHistory'}
                                            onClick={loadTxs}
                                            withBox={true}
                                        /> :
                                        journalState.walletData.txHistory.data.map((tx) => {
                                            return(
                                                    <Transaction
                                                        class_={`contentContainer _${contentContainerIndex++}`}
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
                            {(showReloadButton || journalState.walletData.txHistory.data.length > 0) && 
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
                        </div>}
                </>
            }
        </div>
        
    );
} 
export default WalletPage;