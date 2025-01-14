import React, { useMemo } from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { getFundingCampaignAssetTypeAndValue } from "../../../functionsAndConstants/Utils";
import DataField from "../../../components/DataField";
import { WHITE_COLOR } from "../../../Theme";
import ButtonField from "../../../components/Button";
import { CONTRAST_COLOR } from "../../../Theme";

const RenderPreviewFundingCampaign = (props) => {
    const { campaignId, fundingCampaign } = props;


    const {
        amountToFund,
        amountDisbursedToRecipient,
        remainingCollateralLocked,
        remainingLoanPrincipalAmount,
    } = useMemo( () => {

        let obj = {
            amountToFund: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountToFund),
            amountDisbursedToRecipient: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountDisbursedToRecipient),
        };

        if(fundingCampaign?.terms[0]){
            obj = {
                ...obj,
                remainingCollateralLocked: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingCollateralLocked),
                remainingLoanPrincipalAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanPrincipalAmount),
            }
        }

        return obj;
    }, []);

    return (
        <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} padding={0} flexDirection={"column"}>
            <DataField
                label={"ID: "}
                text={parseInt(campaignId)}
                buttonColor={WHITE_COLOR}
                transparentBackground={true}
                transparentBorder={true}
                disabled={true}
            />
            <DataField
                label={"Amount Requested: "}
                text={`${amountToFund.value} ${amountToFund.type}`}
                buttonColor={WHITE_COLOR}
                transparentBackground={true}
                transparentBorder={true}
                disabled={true}
            />
            <DataField
                label={"Amount Disbursed: "}
                text={`${amountDisbursedToRecipient.value} ${amountDisbursedToRecipient.type}`}
                buttonColor={WHITE_COLOR}
                transparentBackground={true}
                transparentBorder={true}
                disabled={true}
            />
            {remainingLoanPrincipalAmount && <DataField
                label={"Remaining Principal: "}
                text={`${remainingLoanPrincipalAmount.value} ${remainingLoanPrincipalAmount.type}`}
                buttonColor={WHITE_COLOR}
                transparentBackground={true}
                transparentBorder={true}
                disabled={true}
            />}
            {remainingCollateralLocked && <DataField
                label={"Collateral Locked: "}
                text={`${remainingCollateralLocked.value} ${remainingCollateralLocked.type}`}
                buttonColor={WHITE_COLOR}
                transparentBackground={true}
                transparentBorder={true}
                disabled={true}
            />}
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                <Grid xs={6} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                    <ButtonField
                        color={CONTRAST_COLOR}
                        gridSx={{width: "115px", backgroundColor: WHITE_COLOR}}
                        elevation={24}
                        text={"Lend"}
                        onClick={() => {}}
                        iconSize={'small'}
                    />
                </Grid>
                <Grid xs={6} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                    <ButtonField
                        color={CONTRAST_COLOR}
                        gridSx={{width: "115px"}}
                        elevation={24}
                        text={"View"}
                        onClick={() => {}}
                        iconSize={'small'}
                    />
                </Grid>
            </Grid>
        </Grid>
    )
}

export default RenderPreviewFundingCampaign;