import React, { useContext } from "react";
import { AppContext } from "../../../Context";
import DataField from "../../../components/DataField";
import { CONTRAST_COLOR } from "../../../Theme";
import Typography from "@mui/material/Typography";
import RenderFundingCampaign from "./RenderFundingCampaign";
import Grid from "@mui/material/Unstable_Grid2";

const RenderConcludedCampaignsList = (props) => {
    const { concludedCampaigns } = props;

    const { setModalProps, setModalIsOpen } = useContext(AppContext);

    const onViewConcludedCampaign = (campaignId, campaign) => {
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography variant="h6">Campaign #{parseInt(campaignId)}</Typography>,
            components:[
                <RenderFundingCampaign fundingCampaign={campaign} campaignId={campaignId}/>
            ],
            handleReturn: () => {
                setModalProps({
                    fullScreen: true,
                    headerComponent: <Typography variant="h6">Concluded Campaigns</Typography>,
                    components: [<RenderConcludedCampaignsList concludedCampaigns={concludedCampaigns}/>],
                });
            }
        });
        setModalIsOpen(true)
    }

    return (
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"} padding={0}>
            {concludedCampaigns.map(([campaignId, campaign]) => {
                return <DataField buttonColor={CONTRAST_COLOR} label={`Campaign #${campaignId}`} text={"details"} onClick={() => onViewConcludedCampaign(campaignId, campaign)}/>
            })}
        </Grid>
    )
}

export default RenderConcludedCampaignsList;