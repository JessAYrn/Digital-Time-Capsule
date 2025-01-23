import React, {useMemo, useContext} from "react";
import { AppContext } from "../../../../Context";
import Grid from "@mui/material/Unstable_Grid2";
import InputBox from "../../../../components/InputBox";
import { nanoSecondsToMiliSeconds, millisecondsToSeconds, secondsToHours, hoursToDays, round2Decimals, getFundingCampaignAssetTypeAndValue } from "../../../../functionsAndConstants/Utils";
import ButtonField from "../../../../components/Button";
import DataField from "../../../../components/DataField";
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import RenderAddLiquidityOrRepayFundingCampaign, {ACTION_TYPES} from "./RenderAddLiquidityOrRepayFundingCampaign";
import RenderFundingCampaignContributions from "./RenderFundingCampaignContributions";
import { Divider } from "@mui/material";
import { DIVIDER_SX, CONTRAST_COLOR, BACKGROUND_COLOR } from "../../../../Theme";

const RenderFundingCampaign = (props) => {
    const { fundingCampaign, campaignId } = props;
    const {  terms, settled, funded } = fundingCampaign;
    const {setModalIsOpen, setModalProps, homePageState } = useContext(AppContext);


    const {
        amountToFund,
        amountDisbursedToRecipient,
        campaignWalletBalance,
        paymentDue,
        timeUntilPaymentIsDue,
        initialLoanInterestAmount,
        remainingCollateralLocked,
        forfeitedCollateral,
        remainingLoanInterestAmount,
        remainingLoanPrincipalAmount,
    } = useMemo( () => {

        let obj = {
            amountToFund: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountToFund),
            amountDisbursedToRecipient: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountDisbursedToRecipient),
            campaignWalletBalance: getFundingCampaignAssetTypeAndValue(fundingCampaign?.campaignWalletBalance),
        };

        if(fundingCampaign?.terms[0]){
            const amountRepaidDuringCurrentPaymentInterval = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.amountRepaidDuringCurrentPaymentInterval);
            const paymentAmounts = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.paymentAmounts);
            const paymentDue = {value: Math.max(paymentAmounts.value - amountRepaidDuringCurrentPaymentInterval.value, 0), type: paymentAmounts.type};

            const nextPaymentDueDateInseconds = millisecondsToSeconds(nanoSecondsToMiliSeconds(parseInt(fundingCampaign?.terms[0]?.nextPaymentDueDate[0])));
            const nowInSeconds = millisecondsToSeconds(Date.now());
            const secondsUntillDue = Math.max(nextPaymentDueDateInseconds - nowInSeconds, 0);
            const timeUntilPaymentIsDue = round2Decimals(secondsToHours(secondsUntillDue)) > 48 ? `${round2Decimals(hoursToDays(secondsToHours(secondsUntillDue)))} days` : `${round2Decimals(secondsToHours(secondsUntillDue))} hours`;

            obj = {
                ...obj,
                paymentDue,
                timeUntilPaymentIsDue,
                initialLoanInterestAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.initialLoanInterestAmount),
                remainingCollateralLocked: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingCollateralLocked),
                forfeitedCollateral: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.forfeitedCollateral),
                remainingLoanInterestAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanInterestAmount),
                remainingLoanPrincipalAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanPrincipalAmount)
            }
        }

        return obj;
    }, [fundingCampaign]);

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
        <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} flexDirection={"column"}>
            <DataField
                text={homePageState?.canisterData?.userNames[fundingCampaign?.recipient]}
                label={"Requested By: "}
                disabled={true}
                transparentBackground={true}
            />
            <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
            <DataField
                label={"Amount Requested"}
                text={`${amountToFund.value} ${amountToFund.type}`}
                disabled={true}
                transparentBackground={true}
            />
            {!funded && !settled && 
                <DataField
                label={"Amount Collected"}
                text={`${campaignWalletBalance.value} ${campaignWalletBalance.type}`}
                disabled={true}
                transparentBackground={true}
                />
            }
            { funded && 
            <DataField
                label={"Amount Disbursed"}
                text={`${amountDisbursedToRecipient.value} ${amountDisbursedToRecipient.type}`}
                disabled={true}
                transparentBackground={true}
            />}
            {!!terms.length && funded && !settled &&
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
                    <DataField
                        text={`${remainingLoanInterestAmount.value} ${remainingLoanInterestAmount.type}` }
                        label={"Remaining Interest Owed"}
                        disabled={true}
                        transparentBackground={true}
                    />
                    <DataField
                        text={`${remainingLoanPrincipalAmount.value} ${remainingLoanPrincipalAmount.type}` }
                        label={"Remaining Principal Owed"}
                        disabled={true}
                        transparentBackground={true}
                    />
                    <DataField
                        label={"Payment Due"}
                        text={`${paymentDue.value} ${paymentDue.type}`}
                        disabled={true}
                        transparentBackground={true}
                    />
                    <DataField
                        label={"Time Until Payment Is Due: "}
                        text={timeUntilPaymentIsDue}
                        disabled={true}
                        transparentBackground={true}
                    />
                </>
            }
            {!!terms.length && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
                    {!settled && <DataField
                        text={`${remainingCollateralLocked.value} ${remainingCollateralLocked.type}`}
                        label={"Collateral Deposited"}
                        disabled={true}
                        transparentBackground={true}
                    />}
                    {funded && <DataField
                        text={`${forfeitedCollateral.value} ${forfeitedCollateral.type}` }
                        label={"Collateral Forfeited"}
                        disabled={true}
                        transparentBackground={true}
                    />}
                </>
            }
            <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
            <InputBox
                width={"100%"}
                value={fundingCampaign?.description }
                label={"Description"}
                disabled={true}
                rows={4}
            />
            <RenderFundingCampaignContributions fundingCampaign={fundingCampaign} />
            {!fundingCampaign?.settled &&
                <Grid display={"flex"} position={"fixed"} bottom={"10px"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} >
                    <ButtonField
                    gridSx={{width: "350px", backgroundColor: CONTRAST_COLOR}}
                    color={BACKGROUND_COLOR}
                    text={fundingCampaign?.funded ? "Repay Funding Campaign" : "Contribute To Funding Campaign"}
                    Icon={PriceCheckIcon}
                    onClick={onClickAddLiquidityOrRepayFundingCampaign}
                    iconSize={'small'}
                    />
                </Grid>
            }
        </Grid>
    );
};

export default RenderFundingCampaign;