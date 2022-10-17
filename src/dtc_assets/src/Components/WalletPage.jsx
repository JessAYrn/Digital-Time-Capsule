import React, {useCallback, useContext, useEffect, useMemo} from 'react';
import { AppContext } from '../Wallet';
import { NavBar } from './navigation/NavBar';
import { Modal } from './Modal';
import './WalletPage.scss';
import { shortenHexString } from '../Utils';
import { e8sInOneICP, MODALS_TYPES } from '../Constants';
import {  RenderQrCode } from './walletFunctions/GenerateQrCode';
import { copyWalletAddressHelper } from './walletFunctions/CopyWalletAddress';
import { Transaction } from './walletFunctions/Transaction';
import { types } from '../reducers/journalReducer';
import { UI_CONTEXTS } from '../Contexts';
import { visibilityFunctionDefault, getIntObserverFunc } from './animations/IntersectionObserverFunctions';

const WalletPage = (props) => {

    const mql = window.matchMedia('(max-width: 939px)');
    const { journalState, dispatch } = useContext(AppContext);

    const openModal = () => {
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: true, which: MODALS_TYPES.onSend}
        });
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
        <div className={"container__wallet"}>
            { journalState.modalStatus.show ? 
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
                    <div className='scrollable__wallet'>
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
                                        </div>
                                        <div className={"copyWalletAddressButton"}>
                                            <button className='button' onClick={copyWalletAddress}> Copy Wallet Address </button>
                                        </div>
                                        <div className="buttonsDiv" >
                                            <button className='button' onClick={openModal}> Send </button>
                                        </div>
                                    </div>
                                </div>
                                { !mql.matches &&
                                    <RenderQrCode
                                        imgUrl={journalState.walletData.qrCodeImgUrl}
                                    />  
                                }
                            </div>
                            { journalState.walletData.txHistory.isLoading ? 
                            <div className={`loadGifContainer contentContainer _${contentContainerIndex} animatedLeft`}>
                                <div className='loadGifDiv'>
                                    <img src="Loading.gif" alt="Loading Screen" />
                                </div>
                            </div>
                                :
                                journalState.walletData.txHistory.data.map((tx) => {
                                    return(
                                            <Transaction
                                                class_={`contentContainer _${contentContainerIndex++} animatedLeft`}
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
        
    );
} 
export default WalletPage;