import React, { useContext } from 'react';
import { AppContext } from '../Context';
import { NavBar } from '../Components/navigation/NavBar';
import { CHART_TYPES, GRAPH_DISPLAY_LABELS, GRAPH_DATA_SETS } from '../functionsAndConstants/Constants';
import { copyText } from '../functionsAndConstants/walletFunctions/CopyWalletAddress';

import { nanoSecondsToMiliSeconds, shortenHexString, round2Decimals, fromE8s } from '../functionsAndConstants/Utils';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import DataField from '../Components/Fields/DataField';
import AccordionField from '../Components/Fields/Accordion';
import Graph from '../Components/Fields/Chart';
import Typography from '@mui/material/Typography';
import ActionButton from '../Components/ActionButton';


const WalletPage = (props) => {

    const { walletState, treasuryState } = useContext(AppContext);

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
                {/* <Graph 
                    type={CHART_TYPES.line} 
                    dataSets={walletState.balancesData} 
                    defaultLabel={GRAPH_DISPLAY_LABELS.icp}
                    defaultDataSetName={GRAPH_DATA_SETS.balancesHistory.week}
                    maintainAspectRatio={false}
                    height={"500px"}
                    width={"100%"}
                /> */}
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
                {!!walletState?.walletData?.txHistory?.data?.length && 
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
            <ActionButton/>
        </Grid>
            
        
    );
} 
export default WalletPage;