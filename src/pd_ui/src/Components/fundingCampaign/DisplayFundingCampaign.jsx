import React, {useMemo, useContext} from "react";
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2";
import Graph from "../Fields/Chart";
import InputBox from "../Fields/InputBox";
import { nanoSecondsToMiliSeconds, shortenHexString, millisecondsToSeconds, secondsToHours, hoursToDays, round2Decimals } from "../../functionsAndConstants/Utils";
import ButtonField from "../Fields/Button";
import DataField from "../Fields/DataField";
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { GRAPH_DATA_SETS, CHART_TYPES, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { getFundingCampaignAssetTypeAndValue } from "../../functionsAndConstants/Utils";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { mapDataMapToChartFormat } from "../../mappers/treasuryPageMapperFunctions";
import AddLiquidityOrRepayFundingCampaign, {ACTION_TYPES} from "../modalPages/financesPageModals/AddLiquidityOrRepayFundingCampaign";

const DisplayFundingCampaign = (props) => {
    const { fundingCampaign, campaignId } = props;
    const { contributions, terms } = fundingCampaign;
    const {setModalIsOpen, setModalProps, homePageState } = useContext(AppContext);

    const { value: amountToFundValue, type: amountToFundType } = getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountToFund);
    const { value: amountDisbursedToRecipientValue, type: amountDisbursedToRecipientType } = getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountDisbursedToRecipient);
    const { value: campaignWalletBalanceValue, type: campaignWalletBalanceType } = getFundingCampaignAssetTypeAndValue(fundingCampaign?.campaignWalletBalance);
    let nextPaymentDueDate = undefined;
    let paymentAmountsValue = undefined;
    let paymentAmountsType = undefined;
    let initialLoanInterestAmountValue = undefined;
    let initialLoanInterestAmountType = undefined;
    let remainingLoanInterestAmountValue = undefined;
    let remainingLoanInterestAmountType = undefined;
    let remainingLoanPrincipalAmountValue = undefined;
    let remainingLoanPrincipalAmountType = undefined;
    let remainingCollateralLockedValue = undefined;
    let remainingCollateralLockedType = undefined;
    let forfeitedCollateralValue = undefined;
    let forfeitedCollateralType = undefined;
    let amountPaidDuringCurrentPaymentIntervalValue = undefined;
    let amountPaidDuringCurrentPaymentIntervalType = undefined;
    
    if(terms[0]){
        nextPaymentDueDate = terms[0].nextPaymentDueDate[0];
        paymentAmountsValue = getFundingCampaignAssetTypeAndValue(terms[0].paymentAmounts).value;
        paymentAmountsType = getFundingCampaignAssetTypeAndValue(terms[0].paymentAmounts).type;
        initialLoanInterestAmountValue = getFundingCampaignAssetTypeAndValue(terms[0].initialLoanInterestAmount).value;
        initialLoanInterestAmountType = getFundingCampaignAssetTypeAndValue(terms[0].initialLoanInterestAmount).type;
        remainingCollateralLockedValue = getFundingCampaignAssetTypeAndValue(terms[0].remainingCollateralLocked).value;
        remainingCollateralLockedType = getFundingCampaignAssetTypeAndValue(terms[0].remainingCollateralLocked).type;
        forfeitedCollateralValue = getFundingCampaignAssetTypeAndValue(terms[0].forfeitedCollateral).value;
        forfeitedCollateralType = getFundingCampaignAssetTypeAndValue(terms[0].forfeitedCollateral).type;
        remainingLoanInterestAmountValue = getFundingCampaignAssetTypeAndValue(terms[0].remainingLoanInterestAmount).value;
        remainingLoanInterestAmountType = getFundingCampaignAssetTypeAndValue(terms[0].remainingLoanInterestAmount).type;
        remainingLoanPrincipalAmountValue = getFundingCampaignAssetTypeAndValue(terms[0].remainingLoanPrincipalAmount).value;
        remainingLoanPrincipalAmountType = getFundingCampaignAssetTypeAndValue(terms[0].remainingLoanPrincipalAmount).type;
        amountPaidDuringCurrentPaymentIntervalValue = getFundingCampaignAssetTypeAndValue(terms[0].amountRepaidDuringCurrentPaymentInterval).value;
        amountPaidDuringCurrentPaymentIntervalType = getFundingCampaignAssetTypeAndValue(terms[0].amountRepaidDuringCurrentPaymentInterval).type;
    };

    const onClickAddLiquidityOrRepayFundingCampaign = () => {
        setModalProps({
            flexDirection: "column",
            components: [
                <AddLiquidityOrRepayFundingCampaign campaignId={campaignId} actionType={fundingCampaign?.funded ? ACTION_TYPES.repayFundingCampaign : ACTION_TYPES.addLiquidity}/>
            ],
        });
        setModalIsOpen(true);
    };

    const timeUntilPaymentIsDue = useMemo(() => {
        const nextPaymentDueDateInseconds = millisecondsToSeconds(nanoSecondsToMiliSeconds(parseInt(nextPaymentDueDate)));
        const nowInSeconds = millisecondsToSeconds(Date.now());
        const secondsUntillDue = Math.max(nextPaymentDueDateInseconds - nowInSeconds, 0);
        return {seconds: secondsUntillDue, hours: round2Decimals(secondsToHours(secondsUntillDue)), days: round2Decimals(hoursToDays(secondsToHours(secondsUntillDue))) };
    },[nextPaymentDueDate]);    
    
    return (
        <>
            <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} flexDirection={"column"}>
                <DataField
                    label={"amount requested"}
                    text={`${amountToFundValue} ${amountToFundType}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Campaign Wallet Balance"}
                    text={`${campaignWalletBalanceValue} ${campaignWalletBalanceType}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Amount Disbursed"}
                    text={`${amountDisbursedToRecipientValue} ${amountDisbursedToRecipientType}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    text={homePageState?.canisterData?.userNames[fundingCampaign?.recipient]}
                    label={"Recipient: "}
                    disabled={true}
                    transparentBackground={true}
                />
                {!!terms.length && 
                    <DataField
                        text={`${remainingCollateralLockedValue} ${remainingCollateralLockedType}`}
                        label={"Collateral Locked"}
                        disabled={true}
                        transparentBackground={true}
                    />
                }
                {nextPaymentDueDate &&
                    <>
                        <DataField
                            text={`${forfeitedCollateralValue} ${forfeitedCollateralType}` }
                            label={"Collateral Forfeited"}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            text={`${remainingLoanPrincipalAmountValue} ${remainingLoanPrincipalAmountType}` }
                            label={"Remaininig Principal Owed"}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            text={`${remainingLoanInterestAmountValue} ${remainingLoanInterestAmountType}` }
                            label={"Remaining Interest Owed"}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={"Payment Due"}
                            text={`${Math.max(paymentAmountsValue - amountPaidDuringCurrentPaymentIntervalValue, 0)} ${paymentAmountsType}`}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={"Time Until Payment Is Due: "}
                            text={`${timeUntilPaymentIsDue?.days > 2 ? timeUntilPaymentIsDue?.days : timeUntilPaymentIsDue?.hours } ${timeUntilPaymentIsDue?.days > 2 ? "days" : "hours"}`}
                            disabled={true}
                            transparentBackground={true}
                        />
                    </>
                }
                <InputBox
                    value={fundingCampaign?.description }
                    label={"Description"}
                    disabled={true}
                    rows={4}
                />
                
                {/* {contributions.length > 0 &&
                <Graph
                    withoutPaper={true}
                    width={"25%"}
                    height={"400px"}
                    hideButton2={true}
                    type={CHART_TYPES.pie}
                    defaultLabel={GRAPH_DISPLAY_LABELS.icp}
                    dataSets={mapDataMapToChartFormat(contributions, GRAPH_DATA_SETS.fundingCampaignContributions, homePageState?.canisterData?.userNames)}
                    defaultDataSetName={GRAPH_DATA_SETS.fundingCampaignContributions}
                    maintainAspectRatio={false}
                />} */}
                {!fundingCampaign?.settled &&
                    <Grid display={"flex"} width={"100%"} justifyContent={"left"} alignItems={"left"} xs={12} padding={0} margin={"10px"} >
                        <ButtonField
                        color={"secondary"}
                        text={fundingCampaign?.funded ? "Repay Funding Campaign" : "Contribute To Funding Campaign"}
                        Icon={PriceCheckIcon}
                        onClick={onClickAddLiquidityOrRepayFundingCampaign}
                        iconSize={'small'}
                        />
                    </Grid>
                }
            </Grid>
        </>
    );
};

export default DisplayFundingCampaign;