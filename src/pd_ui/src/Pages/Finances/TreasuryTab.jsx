import React, { useContext, useMemo } from 'react';
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import CarouselComponent from '../../components/Carousel';
import RenderPreviewNeuron from './renderComponents/RenderPreviewNeuron';
import ButtonField from '../../components/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RenderBalances from './renderComponents/RenderBalances';
import { copyText } from '../../functionsAndConstants/Utils';

const TreasuryTab = () => {

    const { treasuryState, setModalIsOpen, setModalProps } = useContext(AppContext);

    const activeFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === false} );
    const inactiveFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === true} );
    

    
    const {activeNeurons, inactiveNeurons} = useMemo(() => {
        const activeNeurons = [];
        const inactiveNeurons = [];
        for (const [neuronId, neuronData] of treasuryState?.neurons?.icp) {
            if(!!neuronData?.neuronInfo) activeNeurons.push([neuronId, neuronData]); else inactiveNeurons.push([neuronId, neuronData]);
        }
        return { activeNeurons, inactiveNeurons };
    }, [treasuryState?.neurons]);


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
            <RenderBalances/>
            <CarouselComponent 
                title={"Active Neurons"} 
                sx={{marginTop: "75px"}}
                defaultComponent={<Typography textAlign={"center"} component={"There are currently no neurons staked in this treasury"} />}
            >
                { activeNeurons.map(([neuronId, neuronData]) => { return (<RenderPreviewNeuron neuronData={neuronData} neuronId={neuronId} />); }) }
            </CarouselComponent>

            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                {/* <AccordionField>
                <div 
                    title={"Active Funding Campaigns"} 
                    fundingCampaigns={activeFundingCampaigns}
                    CustomComponent={DisplayAllFundingCampaigns}
                ></div>
                <div 
                    title={"Inactive Funding Campaigns"} 
                    fundingCampaigns={inactiveFundingCampaigns}
                    CustomComponent={DisplayAllFundingCampaigns}
                ></div>
                </AccordionField> */}
            </Grid>
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