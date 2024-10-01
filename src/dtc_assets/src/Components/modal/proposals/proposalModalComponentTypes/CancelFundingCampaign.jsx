import React, {useState, useContext} from 'react';
import { AppContext } from '../../../../Context';
import ButtonField from '../../../Fields/Button';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuField from '../../../Fields/MenuField';

const CancelFundingCampaign = (props) => {
    const {onSubmitProposal, action, payload, disabled} = props;
    const { treasuryState } = useContext(AppContext);
    const [fundingCampaignId, setFundingCampaignId] = useState(payload?.fundingCampaignId ? parseInt(payload?.fundingCampaignId) : null);
    const submitProposal = async () => { 
        await onSubmitProposal({[action]: {fundingCampaignId}}); 
    };

    const fundingCampaignMenuItemProps = treasuryState?.fundingCampaigns?.map(([campaignId, fundingCampaign]) => {
        return {
            text: parseInt(campaignId),
            onClick: () => setFundingCampaignId(parseInt(campaignId)),
            selected: parseInt(campaignId) === parseInt(fundingCampaignId)
        };
    }).filter(([campaignId, fundingCampaign]) => !fundingCampaign?.funded);

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                active={true}
                color={"custom"}
                label={"Funding Campaign To Cancel"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={fundingCampaignMenuItemProps}
            />
            {(!!fundingCampaignId && fundingCampaignId !== 0) && 
            <>
                <Typography varient={"h6"} color={"#bdbdbd"}> Funding Campaign Selected: {fundingCampaignId} </Typography>
                <ButtonField
                    disabled={disabled}
                    active={true}
                    text={'Submit Proposal'}
                    onClick={submitProposal}
                />
            </>
        }
        </Grid>
    );
};

export default CancelFundingCampaign;