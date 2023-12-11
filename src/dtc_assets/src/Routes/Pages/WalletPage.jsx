import React, { useContext, useState} from 'react';
import { AppContext } from '../Wallet';
import { NavBar } from '../../Components/navigation/NavBar';
import './WalletPage.scss';
import { shortenHexString } from '../../functionsAndConstants/Utils';
import { e8sInOneICP } from '../../functionsAndConstants/Constants';
import {  RenderQrCode } from '../../functionsAndConstants/walletFunctions/GenerateQrCode';
import { copyText } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import { loadWalletData } from '../../functionsAndConstants/loadingFunctions';
import { walletTypes } from '../../reducers/walletReducer';
import { UI_CONTEXTS } from '../../functionsAndConstants/Contexts';
import { nanoSecondsToMiliSeconds } from '../../functionsAndConstants/Utils';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import Paper  from '@mui/material/Paper';
import DataField from '../../Components/Fields/DataField';
import AccordionField from '../../Components/Fields/Accordion';
import SpeedDialField from '../../Components/Fields/SpeedDialField';
import ModalComponent from '../../Components/modal/Modal';
import SendCryptoModal from '../../Components/modal/SendCryptoModal';


const WalletPage = (props) => {

    const { walletState, walletDispatch, actorState, actorDispatch } = useContext(AppContext);

    const [loadingTx, setIsLoadingTx] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const onSend = () => {
        setModalProps({
            components: [{
                Component: SendCryptoModal,
                props: {
                    onClickSend: () => {},
                    onClickCancel: () => {},
                    onClickScanQrCode: () => {}
                }
            }]
        });
        setModalIsOpen(true);
    };

    const loadTxs = async () => {
        setIsLoadingTx(true);
        setModalIsOpen(true);
        await loadWalletData(actorState, walletDispatch, walletTypes);
        setModalIsOpen(false);
        setIsLoadingTx(false);
    };

    const speedDialActions = [
        {name: "Refresh", icon: RefreshIcon, onClick: loadTxs},
        {name: "New Transaction", icon: SendIcon , onClick: onSend}
    ]

    return (
        <Grid 
            container 
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
                md={5} 
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
            <Grid 
                columns={12} 
                xs={11} 
                md={5} 
                rowSpacing={0} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
            >
                {walletState.walletData.txHistory.data.length && 
                <AccordionField>
                    {walletState.walletData.txHistory.data.map(([mapKey, tx]) => {
                        const {balanceDelta, increase, recipient, timeStamp, source} = tx;
                        const date = new Date(nanoSecondsToMiliSeconds(parseInt(timeStamp))).toString()
                        const title = `${increase ? "+":"-"} ${balanceDelta / e8sInOneICP} ICP // ${date} `;
                        const text_1 = `source: ${shortenHexString(source)} ICP`;
                        const text_2 = `Recipient: ${shortenHexString(recipient)} ICP`;
                        return (<div title={title} texts={[text_1, text_2]}></div>)
                    })}
                </AccordionField>}

            </Grid>
            <SpeedDialField actions={speedDialActions} position={"right"}/>
            <ModalComponent
                open={modalIsOpen}
                isLoading={loadingTx}
                handleClose={() => setModalIsOpen(false)}
                {...modalProps}
            />
        </Grid>
            
        
    );
} 
export default WalletPage;