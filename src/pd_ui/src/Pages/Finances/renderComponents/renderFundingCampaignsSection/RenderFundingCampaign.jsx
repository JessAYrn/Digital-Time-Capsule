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
import { DIVIDER_SX, CONTRAST_COLOR, WHITE_COLOR, BACKGROUND_COLOR } from "../../../../Theme";
import Typography from "@mui/material/Typography";

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
        initialCollateralLocked,
        remainingCollateralLocked,
        forfeitedCollateral,
        remainingLoanInterestAmount,
        remainingLoanPrincipalAmount,
        collateralReturned
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

            const initialCollateralLocked = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.initialCollateralLocked);
            const remainingCollateralLocked = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingCollateralLocked);
            const forfeitedCollateral = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.forfeitedCollateral);
            const remainingLoanPrincipalAmount = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanPrincipalAmount);
            const remainingLoanInterestAmount = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanInterestAmount);
            const collateralReturned = {...initialCollateralLocked, value: initialCollateralLocked.value - remainingCollateralLocked.value - forfeitedCollateral.value};
            const initialLoanInterestAmount = getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.initialLoanInterestAmount);

            obj = {
                ...obj,
                paymentDue,
                timeUntilPaymentIsDue,
                initialLoanInterestAmount,
                remainingCollateralLocked,
                forfeitedCollateral,
                remainingLoanInterestAmount,
                initialCollateralLocked,
                remainingLoanPrincipalAmount,
                collateralReturned
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

    const RenderCampaignDetails = () => {

        let campaignStatus; 
        if(!!settled && !!funded) campaignStatus = "Settled"
        else if(!!settled && !funded) campaignStatus = "Canceled"
        else if(!settled && !!funded) campaignStatus = "Funded"
        else if(!settled && !funded) campaignStatus = "Unfunded"

        return (
            <>
                <Typography color={CONTRAST_COLOR} textAlign={"center"}>Campaign Details</Typography>
                <DataField
                    text={homePageState?.canisterData?.userNames[fundingCampaign?.recipient]}
                    label={ !!funded ? "Recipient:" : "Requested By:"}
                    disabled={true}
                    transparentBackground={true}
                />

                <DataField
                    label={"Campaign Type:"}
                    text={!!terms.length ? "Loan" : "Donation"}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Campaign Status:"}
                    text={campaignStatus}
                    disabled={true}
                    transparentBackground={true}
                />
                {funded &&
                    <DataField
                        label={!!terms.length ? "Loan Amount:" : "Donation Amount:"}
                        text={`${amountDisbursedToRecipient?.value} ${amountDisbursedToRecipient?.type}`}
                        disabled={true}
                        transparentBackground={true}
                    />
                }
                {!funded && <DataField
                    label={`${!!terms.length ? "Loan Amount Requested:" : "Donation Amount Requested:"}`}
                    text={`${amountToFund?.value} ${amountToFund?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />}
                {!!terms.length &&
                    <DataField
                        text={`${initialLoanInterestAmount?.value} ${initialLoanInterestAmount?.type}` }
                        label={"Loan Interest Offered:"}
                        disabled={true}
                        transparentBackground={true}
                    />
                }
                {!!terms.length &&
                    <DataField
                        label={"Loan Collateral Provided:"}
                        text={`${initialCollateralLocked?.value} ${initialCollateralLocked?.type}`}
                        disabled={true}
                        transparentBackground={true}
                    />
                }
                {!funded && !settled && 
                    <DataField
                    label={"Funding Amount Collected: "}
                    text={`${campaignWalletBalance?.value} ${campaignWalletBalance?.type}`}
                    disabled={true}
                    transparentBackground={true}
                    />
                }
            </>
        );
    };

    const RenderLoanObligations = () => {
        return (
            <>
                <Typography color={CONTRAST_COLOR} textAlign={"center"}>Outstanding Loan Obligations</Typography>
                <DataField
                    label={"Remaining Owed:"}
                    text={`${remainingLoanPrincipalAmount?.value + remainingLoanInterestAmount?.value} ${remainingLoanPrincipalAmount?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                 <DataField
                    label={"Amount Due:"}
                    text={`${paymentDue?.value} ${paymentDue?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Payment Is Due In: "}
                    text={timeUntilPaymentIsDue}
                    disabled={true}
                    transparentBackground={true}
                />
            </>
        );
    };

    const RenderCollateralDetails = () => {
        return (
            <>
                <Typography color={CONTRAST_COLOR} textAlign={"center"}>Collateral Details</Typography>
                <DataField
                    label={"Unreleased Collateral:"}
                    text={`${remainingCollateralLocked?.value} ${remainingCollateralLocked?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Released Collateral:"}
                    text={`${collateralReturned?.value} ${collateralReturned?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Forfeited Collateral:"}
                    text={`${forfeitedCollateral?.value} ${forfeitedCollateral?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
            </>
        );
    };
    
    return (
        <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} flexDirection={"column"}>
            <RenderCampaignDetails />

            {!!terms.length && !!funded && !settled &&
            <>
                <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
                <RenderLoanObligations />
            </>}

            {!!terms.length && !!funded &&
            <>
                <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
                <RenderCollateralDetails />
            </>}

            <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />

            <InputBox
                width={"100%"}
                value={fundingCampaign?.description }
                label={"Description"}
                disabled={true}
                rows={4}
            />

            {!!fundingCampaign?.contributions?.length && 
            <>
                <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
                <RenderFundingCampaignContributions fundingCampaign={fundingCampaign} />
            </>}

            {!fundingCampaign?.settled &&
                <Grid display={"flex"} position={"fixed"} maxWidth={"700px"} bottom={0} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12}  >
                    <ButtonField
                    gridSx={{margin: "2.5%", width: "95%", backgroundColor: fundingCampaign?.funded ? WHITE_COLOR : CONTRAST_COLOR}}
                    color={fundingCampaign?.funded ? CONTRAST_COLOR : BACKGROUND_COLOR}
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