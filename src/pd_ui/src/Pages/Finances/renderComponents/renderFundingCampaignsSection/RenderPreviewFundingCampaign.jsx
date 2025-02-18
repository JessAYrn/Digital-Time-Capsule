import React, { useMemo, useContext } from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { fromE8s, getFundingCampaignAssetTypeAndValue } from "../../../../functionsAndConstants/Utils";
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
        remainingCollateralLocked,
        loanInterest,
        campaignWalletBalance,
        totalOwed,
        funded,
        isALoan
    } = useMemo( () => {

        let obj = {
            amountToFund: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountToFund),
            campaignWalletBalance: getFundingCampaignAssetTypeAndValue(fundingCampaign?.campaignWalletBalance),
            funded: fundingCampaign?.funded,
            isALoan: !!fundingCampaign?.loanAgreement[0],
        };

        if(fundingCampaign?.loanAgreement[0]){
            const { collateralProvided, loanPrincipal, loanInterest, payments, numberOfPayments } = fundingCampaign?.loanAgreement[0];

            let totalCollateralReleased = 0;
            let totalCollateralForfeited = 0;
            let totalOwed = 0;

            for(let payment of payments){
                totalCollateralReleased += parseInt(payment.collateralReleased.icp_staked.e8s);
                totalCollateralForfeited += parseInt(payment.collateralForfeited.icp_staked.e8s);
                totalOwed += parseInt(payment.owed.icp.e8s);
            }

            const remainingCollateralLocked = {
                ...getFundingCampaignAssetTypeAndValue(collateralProvided),
                value: getFundingCampaignAssetTypeAndValue(collateralProvided).value - fromE8s(totalCollateralReleased + totalCollateralForfeited),
            };

            const totalOwed_ = { ...getFundingCampaignAssetTypeAndValue(loanPrincipal), value: fromE8s(totalOwed) };
            const totalCollateralForfeited_ = { ...getFundingCampaignAssetTypeAndValue(collateralProvided), value: fromE8s(totalCollateralForfeited) };
            const totalCollateralReleased_ = { ...getFundingCampaignAssetTypeAndValue(collateralProvided), value: fromE8s(totalCollateralReleased) };
            
            obj = {
                ...obj,
                remainingCollateralLocked,
                totalOwed : totalOwed_,
                totalCollateralForfeited : totalCollateralForfeited_,
                totalCollateralReleased : totalCollateralReleased_,
                loanInterest: getFundingCampaignAssetTypeAndValue(loanInterest),
                loanPrincipal: getFundingCampaignAssetTypeAndValue(loanPrincipal),
                collateralProvided: getFundingCampaignAssetTypeAndValue(collateralProvided),
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
            {!!fundingCampaign?.loanAgreement?.length && 
                <>
                    {funded ?
                        <DataField
                            label={"Remaining Owed: "}
                            text={`${totalOwed.value} ${totalOwed.type}`}
                            buttonColor={WHITE_COLOR}
                            transparentBackground={true}
                            transparentBorder={true}
                            disabled={true}
                        /> :
                        <DataField
                                label={"Interest Offered: "}
                                text={`${loanInterest.value} ${loanInterest.type}`}
                                buttonColor={WHITE_COLOR}
                                transparentBackground={true}
                                transparentBorder={true}
                            disabled={true}
                        /> 
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
                        text={isALoan ? "Lend" : "Donate"}
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