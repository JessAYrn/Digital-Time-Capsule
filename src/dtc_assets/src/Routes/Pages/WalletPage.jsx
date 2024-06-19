import React, { useContext, useState} from 'react';
import { AppContext } from '../../Context';
import { NavBar } from '../../Components/navigation/NavBar';
import { e8sInOneICP, CHART_TYPES, GRAPH_DISPLAY_LABELS, GRAPH_DATA_SETS } from '../../functionsAndConstants/Constants';
import { copyText } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import { loadWalletData } from '../../functionsAndConstants/loadingFunctions';
import { walletTypes } from '../../reducers/walletReducer';
import { nanoSecondsToMiliSeconds, shortenHexString, round2Decimals, fromE8s } from '../../functionsAndConstants/Utils';
import QrCodeIcon from '@mui/icons-material/QrCode';
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
import ButtonField from '../../Components/Fields/Button';
import DisplayQrCode from '../../Components/modal/DisplayQrCode';
import Graph from '../../Components/Fields/Chart';
import Typography from '@mui/material/Typography';


const WalletPage = (props) => {

    const { walletState, walletDispatch, actorState, treasuryState } = useContext(AppContext);

    const [loadingTx, setIsLoadingTx] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const onSend = () => {
        setModalProps({
            components: [{
                Component: SendCryptoModal,
                props: {
                    onClickCancel: () => {setModalIsOpen(false); () => setModalProps({})},
                    setModalProps,
                    setModalIsOpen,
                    setIsLoadingTx
                }
            }]
        });
        setModalIsOpen(true);
    };

    const onClick_QrCode = () => {
        setModalIsOpen(true);
        setModalProps({
            components: [{
                Component: DisplayQrCode,
                props: {
                    onClose: () => {setModalIsOpen(false); () => setModalProps({})},
                }
            }]
        });
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

    const DisplayTxAddresses = (props) => {
        const {addresses} = props;
        return (
            <Grid 
            xs={12} 
            display="flex" 
            justifyContent="left" 
            alignItems="center" 
            flexDirection={"column"}
            >
                {addresses.map((address) => {
                    return (<DataField
                        label={`${address[0]}`}
                        text={`${shortenHexString(address[1])}`}
                        buttonIcon={ContentCopyIcon}
                        onClick={() => copyText(address[1])}
                    />)
                })}
            </Grid>
        )
    };

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
            <NavBar/>
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
                <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                    <Grid xs={5}  width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"left"} flexDirection={"column"}>
                        <Typography display={"flex"} justifyContent={"left"} width={"100%"}>Wallet Balance:</Typography>
                        <Typography display={"flex"} justifyContent={"left"} width={"100%"} variant="h6" color={"custom"}>
                        {`${round2Decimals(fromE8s(walletState.walletData.balance))}`} ICP
                        </Typography>
                    </Grid>
                    <Grid xs={2}  width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
                        <Typography display={"flex"} justifyContent={"center"} width={"100%"}>Treasury Deposits:</Typography>
                        <Typography display={"flex"} justifyContent={"center"} width={"100%"} variant="h6" color={"custom"}>
                        {`${round2Decimals(fromE8s(treasuryState.userTreasuryData?.balances.icp || 0))}`} ICP
                        </Typography>
                    </Grid>
                    <Grid xs={5}  width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"right"} flexDirection={"column"}>
                        <Typography display={"flex"} justifyContent={"right"} width={"100%"}>Treasury Stake:</Typography>
                        <Typography display={"flex"} justifyContent={"right"} width={"100%"} variant="h6" color={"custom"}>
                        {`${round2Decimals(fromE8s(treasuryState.userTreasuryData?.balances.icp_staked || 0))}`} ICP
                        </Typography>
                    </Grid>
                </Grid>
                <Graph 
                    type={CHART_TYPES.line} 
                    inputData={walletState.balancesData} 
                    defaultLabel={GRAPH_DISPLAY_LABELS.icp}
                    defaultDataSetName={GRAPH_DATA_SETS.week}
                />
                <Paper elevation={24} className={''} sx={{
                    backgroundColor: "rgba(52, 52, 52, 0.8)",
                    width: "100%",
                    height: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                }}>
                    <Grid width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={"0"}>
                        <DataField
                            label={'Address: '}
                            text={`${shortenHexString(walletState.walletData.address)}`}
                            isLoading={!walletState.dataHasBeenLoaded}
                            onClick={() => copyText( walletState.walletData.address )}
                            buttonIcon={ContentCopyIcon}
                        />
                        <ButtonField
                            Icon={QrCodeIcon}
                            transparentBackground={true}
                            onClick={onClick_QrCode}
                        />
                    </Grid>
                </Paper> 
            </Grid>
            <Grid 
                columns={12} 
                xs={11} 
                md={9} 
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
                        const title = `${date} `;
                        const subtitle = `${increase ? "+":"-"} ${fromE8s(balanceDelta)} ICP`
                        const source_ = ["source", source];
                        const recipient_ = ["recipient", recipient];
        
                        return (<div title={title} subtitle={subtitle} CustomComponent={DisplayTxAddresses} addresses={[source_, recipient_]}></div>)
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