import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Graph from "../Fields/Chart";
import { Typography } from "@mui/material";
import InputBox from "../Fields/InputBox";
import { fromE8s, nanoSecondsToMiliSeconds, shortenHexString } from "../../functionsAndConstants/Utils";
import ButtonField from "../Fields/Button";
import DataField from "../Fields/DataField";
import DataTable from "../Fields/Table";
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { GRAPH_DATA_SETS, CHART_TYPES, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { getFundingCampaignAssetTypeAndValue } from "../../functionsAndConstants/Utils";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { mapDataMapToChartFormat } from "../../mappers/treasuryPageMapperFunctions";
import DatePickerField from "../Fields/DatePicker";

const DisplayFundingCampaign = (props) => {
    const { fundingCampaign, campaignId } = props;
    const { contributions, terms } = fundingCampaign;
    console.log(campaignId, fundingCampaign);

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
        amountPaidDuringCurrentPaymentIntervalValue = getFundingCampaignAssetTypeAndValue(terms[0].amountPaidDuringCurrentPaymentInterval).value;
        amountPaidDuringCurrentPaymentIntervalType = getFundingCampaignAssetTypeAndValue(terms[0].amountPaidDuringCurrentPaymentInterval).type;
    };
    
    return (
        <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} flexDirection={"column"}>
            <DataField
                label={"amount requested"}
                text={`${amountToFundValue} ${amountToFundType}`}
                disabled={true}
            />
            <DataField
                label={"Campaign Wallet Balance"}
                text={`${campaignWalletBalanceValue} ${campaignWalletBalanceType}`}
                disabled={true}
            />
            <DataField
                text={`${parseInt(fundingCampaign?.percentageOfDaoRewardsAllocated)}`}
                label={"Percentage of DAO rewards allocated"}
                disabled={true}
            />
            <DataField
                label={"Amount Disbursed"}
                text={`${amountDisbursedToRecipientValue} ${amountDisbursedToRecipientType}`}
                disabled={true}
            />
            <DataField
                text={`${shortenHexString(fundingCampaign?.recipient)}`}
                label={"Recipient Principal ID"}
                buttonIcon={ContentCopyIcon}
                onClick={() => copyText(fundingCampaign?.recipient)}
            />
            <DataField
                text={`${remainingCollateralLockedValue} ${remainingCollateralLockedType}`}
                label={"Collateral Locked"}
                disabled={true}
            />
            <DataField
                text={`${forfeitedCollateralValue} ${forfeitedCollateralType}` }
                label={"Collateral Forfeited"}
                disabled={true}
            />
            {nextPaymentDueDate &&
                <>
                    <DataField
                        text={`${remainingLoanPrincipalAmountValue} ${remainingLoanPrincipalAmountType}` }
                        label={"Remaininig Principal Owed"}
                        disabled={true}
                    />
                    <DataField
                        text={`${remainingLoanInterestAmountValue} ${remainingLoanInterestAmountType}` }
                        label={"Remaining Interest Owed"}
                        disabled={true}
                    />
                    <DataField
                        label={"Payment Due"}
                        text={`${Math.max(paymentAmountsValue - amountPaidDuringCurrentPaymentIntervalValue, 0)} ${paymentAmountsType}`}
                        disabled={true}
                    />
                    <DatePickerField
                        disabled={true}
                        width={"100% !important"}
                        value={new Date(nanoSecondsToMiliSeconds(nextPaymentDueDate))}
                        label={"Next Payment Due Date"}
                    />
                </>
            }
            <InputBox
                value={fundingCampaign?.description }
                label={"Description"}
                disabled={true}
                rows={4}
            />
            
            {contributions.length > 0 &&
            <Graph
                withoutPaper={true}
                width={"25%"}
                height={"400px"}
                hideButton2={true}
                type={CHART_TYPES.pie}
                defaultLabel={GRAPH_DISPLAY_LABELS.icp}
                inputData={mapDataMapToChartFormat(contributions, GRAPH_DATA_SETS.fundingCampaignContributions)}
                defaultDataSetName={GRAPH_DATA_SETS.fundingCampaignContributions}
                maintainAspectRatio={false}
            />}
            <Grid display={"flex"} width={"100%"} justifyContent={"left"} alignItems={"left"} xs={12} padding={0} margin={"10px"} >
                <ButtonField
                active={true}
                text={"Provide Liquidity"}
                Icon={PriceCheckIcon}
                onClick={() => { }}
                iconSize={'small'}
                />
            </Grid>

        </Grid>
    );
};

export default DisplayFundingCampaign;