import React, { useContext, useMemo } from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import RenderPreviewFundingCampaign from "./RenderPreviewFundingCampaign";
import CarouselComponent from "../../../../components/Carousel";
import { AppContext } from "../../../../Context";
import Typography from "@mui/material/Typography";
import { BACKGROUND_COLOR, CONTRAST_COLOR } from "../../../../Theme";
import ButtonField from "../../../../components/Button";
import DataField from "../../../../components/DataField";
import CreateProposalForm from "../../../../proposals/CreateProposalForm";
import { PROPOSAL_ACTIONS } from "../../../../proposals/utils";
import RenderConcludedCampaignsList from "./RenderConcludedCampaignsList";


const RenderFundingCampaignsSection = () => {

    const { treasuryState, setModalIsOpen, setModalProps } = useContext(AppContext);

    const { fundingCampaigns } = treasuryState;

    const {activeFundingCampaigns, inactiveFundingCampaigns} = useMemo(() => {
        const activeFundingCampaigns = [];
        const inactiveFundingCampaigns = [];
        for (const [campaignId, fundingCampaign] of fundingCampaigns) {
            if (fundingCampaign.finalized) {
                activeFundingCampaigns.push([campaignId, fundingCampaign]);
            } else {
                inactiveFundingCampaigns.push([campaignId, fundingCampaign]);
            }
        }
        return {activeFundingCampaigns, inactiveFundingCampaigns};
    }, [fundingCampaigns]);

    console.log(activeFundingCampaigns);

    const onViewConcludedCampaigns = () => {
        setModalIsOpen(true);
        setModalProps({ 
            headerComponent: <Typography variant="h6">Concluded Campaigns</Typography>,
            fullScreen: true,
            components: [ 
                <RenderConcludedCampaignsList concludedCampaigns={inactiveFundingCampaigns} />
            ] 
        });
    }

    const onCreateFundingCampaign = () => {
        setModalIsOpen(true);
        setModalProps({ 
            headerComponent: <Typography variant="h6">Create Proposal</Typography>,
            fullScreen: true,
            components: [ 
                <CreateProposalForm proposalAction={PROPOSAL_ACTIONS.CreateFundingCampaign} proposalPayload={{}}/>
            ] 
        });
    };

    const RenderEmptyFundingCampaigns = () => {
        return (
            <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} padding={0} flexDirection={"column"} paddingTop={"20px"}>
                <Typography textAlign={"center"} >
                    {"There are currently no active funding campaigns. Funding campaigns are used to raise funds in the form of loans or donations issued by fellow members of this DAO community."}
                    </Typography>
                <ButtonField gridSx={{backgroundColor: CONTRAST_COLOR, marginTop: "20px"}} color={BACKGROUND_COLOR} text={"Create Funding Campaign"} onClick={onCreateFundingCampaign}/>
            </Grid>
        )
    }

    return (
        <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} padding={0} flexDirection={"column"}>
            <CarouselComponent 
                title={"Campaigns"} 
                defaultComponent={<RenderEmptyFundingCampaigns/>}
            >
                { activeFundingCampaigns.map(([campaignId, fundingCamapaign]) => { return (<RenderPreviewFundingCampaign campaignId={campaignId} fundingCampaign={fundingCamapaign}/>); }) }
            </CarouselComponent>

            <DataField gridSx={{marginTop: "20px"}} label={"Concluded Campaigns"} text={"View"} buttonColor={CONTRAST_COLOR}  onClick={onViewConcludedCampaigns}/>
        </Grid>
    )
}

export default RenderFundingCampaignsSection;