import React, { useContext } from 'react';
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Divider, Typography } from "@mui/material";
import ButtonField from '../../components/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RenderBalancesSection from './renderComponents/RenderBalancesSection';
import { copyText } from '../../functionsAndConstants/Utils';
import RenderNeuronsSection from './renderComponents/renderNeuronsSection/RenderNeuronsSection';
import { DIVIDER_SX } from '../../Theme';
import RenderFundingCampaignsSection from './renderComponents/renderFundingCampaignsSection/RenderFundingCampaignsSection';


const TreasuryTab = () => {

    const { treasuryState, setModalIsOpen, setModalProps } = useContext(AppContext);

    const displayTreasuryAccountId = () => {
        let chars = [...treasuryState.daoIcpAccountId];
        chars.splice(21, 0, " ");
        chars.splice(43, 0, " ");
        const accountId = chars.join('');
        setModalProps({
            flexDirection: "column",
            components: [
                <Typography padding={"10px"} variant='h6' children={"Treasury ICP Account ID:"} />,
                <Typography padding={"10px"} textAlign={"center"} children={accountId} />,
                <ButtonField text={"Copy To Clipboard"} onClick={() => copyText(treasuryState.daoIcpAccountId)} Icon={ContentCopyIcon} iconSize={'small'}/>
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    const openTreasuryAccountIdModal = () => {  
        setModalIsOpen(true);
        setModalProps({
            flexDirection: "column",
            components: [
                <Typography padding={"10px"} varient={"h6"} children={"Be Careful!"}/>,
                <WarningAmberIcon color='secondary'/>,
                <Typography padding={"10px"} marginBottom={"15px"} children={"Sending ICP directly to this account ID will result in no treasury contribution being recorded from your account. In other words, you're essentially donating to the treasury without receiving any credit. If you're not sure what you're doing, do NOT proceed."}/>,
                <ButtonField text={"I understand, proceed"} onClick={displayTreasuryAccountId} iconSize="small" />,
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    

    return (
        <Grid columns={12} xs={11} md={9} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} paddingTop={"15px"}>
            <RenderBalancesSection/>
            <Divider sx={{...DIVIDER_SX, marginTop: "70px", marginBottom: "70px"}}/>
            <RenderFundingCampaignsSection/>
            <Divider sx={{...DIVIDER_SX, marginTop: "70px", marginBottom: "70px"}}/>
            <RenderNeuronsSection/>
            <ButtonField
                gridSx={{marginTop: "20px", marginBottom: "60px"}}
                text={"View Treasury Account ID"}
                onClick={openTreasuryAccountIdModal}
                iconSize={'large'}
            />
        </Grid>
    )
};

export default TreasuryTab;