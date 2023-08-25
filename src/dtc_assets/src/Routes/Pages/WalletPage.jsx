import React, {useCallback, useContext, useEffect, useState} from 'react';
import { AppContext } from '../Wallet';
import { NavBar } from '../../Components/navigation/NavBar';
import './WalletPage.scss';
import { shortenHexString } from '../../functionsAndConstants/Utils';
import { e8sInOneICP } from '../../functionsAndConstants/Constants';
import {  RenderQrCode } from '../../functionsAndConstants/walletFunctions/GenerateQrCode';
import { copyText } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import { Transaction } from '../../functionsAndConstants/walletFunctions/Transaction';
import { loadTxHistory } from '../../functionsAndConstants/loadingFunctions';
import { testTx } from '../../testData/Transactions';
import { walletTypes } from '../../reducers/walletReducer';
import { UI_CONTEXTS } from '../../functionsAndConstants/Contexts';
import ButtonField from '../../Components/Fields/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import '../../SCSS/contentContainer.scss'
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { Paper, Typography } from '@mui/material';
import DataField from '../../Components/Fields/DataField';


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

    console.log(walletState)
    return (
        <Grid 
            container 
            className={'container_journal'} 
            columns={12} 
            xs={12} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
        >
            <NavBar context={UI_CONTEXTS.WALLET}/>
            <Grid 
                columns={12} 
                xs={11} 
                md={9} 
                rowSpacing={0} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"} 
                marginTop={"80px"}
            >
                <Paper elevation={24} className={'walletDataPaperComponent'}>
                    <RenderQrCode imgUrl={walletState.walletData.qrCodeImgUrl}/> 
                    <DataField
                        className={'walletPageDataField'}
                        label={'Balance: '}
                        text={`${walletState.walletData.balance /  e8sInOneICP} ICP`}
                        isLoading={!walletState.dataHasBeenLoaded}
                        disabled={true}
                    />
                    <DataField
                        className={'walletPageDataField'}
                        label={'Address: '}
                        text={`${shortenHexString(walletState.walletData.address)}`}
                        isLoading={!walletState.dataHasBeenLoaded}
                        onClick={() => copyText( walletState.walletData.address )}
                        buttonIcon={ContentCopyIcon}
                    />
                </Paper> 
            </Grid>
            {/* {walletState.walletData.txHistory.data.map((tx) => {
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
                        })} */}
            {/* {(showReloadButton || walletState.walletData.txHistory.data.length > 0) && 
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
            /> */}
        </Grid>
            
        
    );
} 
export default WalletPage;