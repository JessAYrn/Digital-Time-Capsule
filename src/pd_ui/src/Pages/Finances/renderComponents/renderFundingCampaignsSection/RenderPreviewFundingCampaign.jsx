import React, { useMemo, useContext } from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { getFundingCampaignAssetTypeAndValue } from "../../../../functionsAndConstants/Utils";
import DataField from "../../../../components/DataField";
import { WHITE_COLOR } from "../../../../Theme";
import ButtonField from "../../../../components/Button";
import RenderFundingCampaign from "./RenderFundingCampaign";
import RenderAddLiquidityOrRepayFundingCampaign from "./RenderAddLiquidityOrRepayFundingCampaign";
import { CONTRAST_COLOR } from "../../../../Theme";
import { ACTION_TYPES } from "./RenderAddLiquidityOrRepayFundingCampaign";
import { AppContext } from "../../../../Context";
import Typography from "@mui/material/Typography";

const RenderPreviewFundingCampaign = (props) => {
    const { campaignId, fundingCampaign } = props;
    const { setModalIsOpen, setModalProps } = useContext(AppContext);

    const {
        amountToFund,
        amountDisbursedToRecipient,
        remainingCollateralLocked,
        remainingLoanPrincipalAmount,
        initialLoanInterestAmount,
        campaignWalletBalance,
        forfeitedCollateral,
        remainingLoanInterestAmount,
        funded
    } = useMemo( () => {

        let obj = {
            amountToFund: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountToFund),
            amountDisbursedToRecipient: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountDisbursedToRecipient),
            campaignWalletBalance: getFundingCampaignAssetTypeAndValue(fundingCampaign?.campaignWalletBalance),
            forfeitedCollateral: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.forfeitedCollateral),
            remainingLoanInterestAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanInterestAmount),
            funded: fundingCampaign?.funded,
        };

        if(fundingCampaign?.terms[0]){
            obj = {
                ...obj,
                remainingCollateralLocked: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingCollateralLocked),
                remainingLoanPrincipalAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanPrincipalAmount),
                initialLoanInterestAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.initialLoanInterestAmount),
            }
        }

        return obj;
    }, []);
    
    const onView = () => {
        setModalIsOpen(true);
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography variant="h6">Funding Campaign</Typography>,
            components: [<RenderFundingCampaign fundingCampaign={fundingCampaign} campaignId={campaignId}/>],
        })
    }

    const onClickAddLiquidityOrRepayFundingCampaign = () => {
        setModalProps({
            flexDirection: "column",
            fullScreen: true,
            headerComponent: <Typography variant="h6">{fundingCampaign?.funded ? "Repay Funding Campaign" : "Add Funding"}</Typography>,
            components: [
                <RenderAddLiquidityOrRepayFundingCampaign campaignId={campaignId} actionType={fundingCampaign?.funded ? ACTION_TYPES.repayFundingCampaign : ACTION_TYPES.addLiquidity}/>
            ],
        });
        setModalIsOpen(true);
    };

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
                label={ funded ? "Amount Borrowed: " : "Amount Requested: " }
                text={`${amountToFund.value} ${amountToFund.type}`}
                buttonColor={WHITE_COLOR}
                transparentBackground={true}
                transparentBorder={true}
                disabled={true}
            /> 
            {!!fundingCampaign?.terms?.length && 
                <>
                    {funded &&
                        <>
                            <DataField
                                    label={"Interest Offered: "}
                                    text={`${initialLoanInterestAmount.value} ${initialLoanInterestAmount.type}`}
                                    buttonColor={WHITE_COLOR}
                                    transparentBackground={true}
                                    transparentBorder={true}
                                disabled={true}
                            />
                            <DataField
                                label={"Remaining Owed: "}
                                text={`${remainingLoanPrincipalAmount.value + remainingLoanInterestAmount.value} ${remainingLoanPrincipalAmount.type}`}
                                buttonColor={WHITE_COLOR}
                                transparentBackground={true}
                                transparentBorder={true}
                                disabled={true}
                            /> 
                        </>
                    }
                    <DataField
                        label={ "Collateral Locked: "}
                        text={`${remainingCollateralLocked.value} ${remainingCollateralLocked.type}`}
                        buttonColor={WHITE_COLOR}
                        transparentBackground={true}
                        transparentBorder={true}
                        disabled={true}
                    />
                </>
            }
            {!funded && <DataField
                label={"Amount Collected: "}
                text={`${campaignWalletBalance.value} ${campaignWalletBalance.type}`}
                buttonColor={WHITE_COLOR}
                transparentBackground={true}
                transparentBorder={true}
                disabled={true}
            />}
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                {!fundingCampaign?.funded && 
                    <ButtonField
                        color={CONTRAST_COLOR}
                        gridSx={{margin: "2.5%", width: "40%", backgroundColor: WHITE_COLOR}}
                        elevation={24}
                        text={"Lend"}
                        onClick={onClickAddLiquidityOrRepayFundingCampaign}
                        iconSize={'small'}
                    />
                }
                    <ButtonField
                        color={CONTRAST_COLOR}
                        gridSx={{margin: "2.5%", width: !fundingCampaign?.funded ? "40%" : "95%"}}
                        elevation={24}
                        text={"View"}
                        onClick={onView}
                        iconSize={'small'}
                    />
            </Grid>
        </Grid>
    )
}

export default RenderPreviewFundingCampaign;