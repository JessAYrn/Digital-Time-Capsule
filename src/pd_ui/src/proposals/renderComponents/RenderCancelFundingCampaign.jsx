import React, {useState, useContext} from 'react';
import { AppContext } from '../../Context';
import ButtonField from '../../components/Button';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuField from '../../components/MenuField';
import { CONTRAST_COLOR, BACKGROUND_COLOR } from '../../Theme';

const CancelFundingCampaign = (props) => {
    const {onSubmitProposal, action, payload, disabled} = props;
    const { treasuryState } = useContext(AppContext);
    const [fundingCampaignId, setFundingCampaignId] = useState(payload?.fundingCampaignId ? parseInt(payload?.fundingCampaignId) : null);

    const submitProposal = async () => { 
        await onSubmitProposal({[action]: {fundingCampaignId}}); 
    };

    const fundingCampaignMenuItemProps = treasuryState?.fundingCampaigns?.filter(([campaign, fundingCampaign]) => {
        return !fundingCampaign?.funded;
    }).map(([campaignId, fundingCampaign]) => {
        return {
            text: parseInt(campaignId),
            onClick: () => setFundingCampaignId(parseInt(campaignId)),
            selected: parseInt(campaignId) === parseInt(fundingCampaignId)
        };
    });

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={CONTRAST_COLOR}
                disabled={disabled}
                label={"Funding Campaign To Cancel"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={fundingCampaignMenuItemProps}
            />
            {(!!fundingCampaignId && fundingCampaignId !== 0) && 
            <>
                <Typography varient={"h6"} color={"#bdbdbd"}> Funding Campaign Selected: {fundingCampaignId} </Typography>
                {!disabled && 
                    <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} bottom={"10px"} width={"100%"} >
                        <ButtonField
                            disabled={disabled}
                            color={BACKGROUND_COLOR}
                            gridSx={{ width: "230px", backgroundColor: CONTRAST_COLOR }}
                            text={'Submit Proposal'}
                            onClick={submitProposal}
                        />
                    </Grid>
                }
            </>
        }
        </Grid>
    );
};

export default CancelFundingCampaign;