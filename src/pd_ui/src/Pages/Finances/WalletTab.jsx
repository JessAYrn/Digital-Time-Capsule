import React, { useContext } from 'react';
import { AppContext } from '../../Context';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import RenderWalletBalancesSection from './renderComponents/RenderWalletBalancesSection';
import RenderTxHistory from './renderComponents/RenderTxHistory';
import Typography from '@mui/material/Typography';
import { shortenHexString, copyText } from '../../functionsAndConstants/Utils';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataField from '../../components/DataField';
import { CONTRAST_COLOR } from '../../Theme';


const WalletTab = (props) => {

    const { walletState, navigationAndApiState, setModalIsOpen, setModalProps } = useContext(AppContext);

    const onViewTxHistory = () => {
        setModalIsOpen(true);
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography variant="h6">Transaction History</Typography>,
            components: [<RenderTxHistory/>],
        });
    }

    const onCopyWalletAddress = () => {
        navigationAndApiState.backendActor.updateUsersTxHistory();
        copyText(walletState.walletData.address);
    }

    return (
        <Grid 
            columns={12} 
            xs={11} 
            md={9}
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
            paddingTop={"15px"}
            marginBottom={"70px"}
        >
            <RenderWalletBalancesSection/>
            <DataField gridSx={{marginTop: "60px"}} transparentBorder={true} transparentBackground={true} label={"Wallet Address"} text={shortenHexString(walletState.walletData.address)} buttonIcon={ContentCopyIcon} onClick={onCopyWalletAddress}/>
            <DataField gridSx={{marginTop: "20px"}} label={"Transaction History"} text={"View"} onClick={onViewTxHistory} buttonColor={CONTRAST_COLOR}/>    
        </Grid>
            
        
    );
} 
export default WalletTab;