import React, {useContext, useState} from 'react';
import { AppContext } from "../../Context";
import DataField from '../Fields/DataField';
import QrCodeIcon from '@mui/icons-material/QrCode';
import Grid from '@mui/material/Unstable_Grid2';
import ButtonField from '../Fields/Button';
import { inTrillions, round2Decimals, shortenHexString } from '../../functionsAndConstants/Utils';
import { copyText } from '../../functionsAndConstants/walletFunctions/CopyWalletAddress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DisplayQrCode from '../../Components/modal/DisplayQrCode';
import ModalComponent from '../modal/Modal';


const DisplayUserData = (props) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const { journalState, walletState } = useContext(AppContext);
    const { userMetaData } = journalState;
    const { userPrincipal, cyclesBalance, rootCanisterPrincipal } = userMetaData;

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

    return (
        <Grid
        columns={12} 
        rowSpacing={8} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        flexDirection={"column"}
        width={"300px"}
        >
            <Grid
            container 
            columns={12} 
            xs={11} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
            width={"100%"}
            >
                <DataField
                    label={'User ID: '}
                    text={`${shortenHexString(userPrincipal)}`}
                    disabled={true} 
                    buttonColor="secondary"
                    labelColor="#343434"
                />
            </Grid>
            <Grid
            container 
            columns={12} 
            xs={11} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
            width={"100%"}
            >
                <DataField
                    label={`Asset Canister ID (${round2Decimals(inTrillions(cyclesBalance))} T Cycles): `}
                    text={`${shortenHexString(rootCanisterPrincipal)}`}
                    buttonIcon={ContentCopyIcon}
                    buttonColor="secondary"
                    labelColor="#343434"
                    onClick={() => copyText(rootCanisterPrincipal)}
                />
            </Grid>
            <Grid width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={"0"}>
                <DataField
                    label={'Wallet Address: '}
                    text={`${shortenHexString(walletState.walletData.address)}`}
                    isLoading={!walletState.dataHasBeenLoaded}
                    onClick={() => copyText( walletState.walletData.address )}
                    labelColor="#343434"
                    buttonColor="secondary"
                    buttonIcon={ContentCopyIcon}
                />
                <ButtonField
                    Icon={QrCodeIcon}
                    active={true}
                    transparentBackground={true}
                    sx={{ color: "#343434" }}
                    onClick={onClick_QrCode}
                />
            </Grid>
            <ModalComponent
                open={modalIsOpen}
                handleClose={() => setModalIsOpen(false)}
                {...modalProps}
            />
        </Grid>
    )

};

export default DisplayUserData;