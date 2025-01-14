import React, {useMemo, useContext} from "react";
import { AppContext } from "../../../Context";
import Grid from "@mui/material/Unstable_Grid2";
import Graph from "../../../components/Chart";
import InputBox from "../../../components/InputBox";
import { nanoSecondsToMiliSeconds, millisecondsToSeconds, secondsToHours, hoursToDays, round2Decimals, getFundingCampaignAssetTypeAndValue } from "../../../functionsAndConstants/Utils";
import ButtonField from "../../../components/Button";
import DataField from "../../../components/DataField";
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import { CHART_TYPES, GRAPH_DISPLAY_LABELS } from "../../../functionsAndConstants/Constants";
import { mapDataMapToChartFormat } from "../../../mappers/treasuryPageMapperFunctions";
import RenderAddLiquidityOrRepayFundingCampaign, {ACTION_TYPES} from "./RenderAddLiquidityOrRepayFundingCampaign";
import { fromE8s } from "../../../functionsAndConstants/Utils";

const RenderFundingCampaign = (props) => {
    const { fundingCampaign, campaignId } = props;
    const { contributions, terms } = fundingCampaign;
    const {setModalIsOpen, setModalProps, homePageState } = useContext(AppContext);

    console.log(fundingCampaign);

    const {
        amountToFund,
        amountDisbursedToRecipient,
        campaignWalletBalance,
        nextPaymentDueDate,
        paymentAmounts,
        initialLoanInterestAmount,
        remainingCollateralLocked,
        forfeitedCollateral,
        remainingLoanInterestAmount,
        remainingLoanPrincipalAmount,
        amountRepaidDuringCurrentPaymentInterval
    } = useMemo( () => {

        let obj = {
            amountToFund: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountToFund),
            amountDisbursedToRecipient: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountDisbursedToRecipient),
            campaignWalletBalance: getFundingCampaignAssetTypeAndValue(fundingCampaign?.campaignWalletBalance),
        };

        if(fundingCampaign?.terms[0]){
            obj = {
                ...obj,
                nextPaymentDueDate: fundingCampaign?.terms[0]?.nextPaymentDueDate[0],
                paymentAmounts: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.paymentAmounts),
                initialLoanInterestAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.initialLoanInterestAmount),
                remainingCollateralLocked: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingCollateralLocked),
                forfeitedCollateral: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.forfeitedCollateral),
                remainingLoanInterestAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanInterestAmount),
                remainingLoanPrincipalAmount: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.remainingLoanPrincipalAmount),
                amountRepaidDuringCurrentPaymentInterval: getFundingCampaignAssetTypeAndValue(fundingCampaign?.terms[0]?.amountRepaidDuringCurrentPaymentInterval)
            }
        }

        return obj;
    }, []);

    const onClickAddLiquidityOrRepayFundingCampaign = () => {
        setModalProps({
            flexDirection: "column",
            components: [
                <RenderAddLiquidityOrRepayFundingCampaign campaignId={campaignId} actionType={fundingCampaign?.funded ? ACTION_TYPES.repayFundingCampaign : ACTION_TYPES.addLiquidity}/>
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
    
    // const {chartLabels, chartDataSets} = useMemo(() => {
    //     const dataMapArray = [];

    //     for(let [principal, {stake_e8s}] of contributions){
    //         const label = homePageState?.canisterData?.userNames[principal];
    //         const dataPointObj = { stake_e8s: fromE8s(parseInt(stake_e8s)) }; 
    //         dataMapArray.push([label, dataPointObj ]);
    //     };

    //     const reducedDataMapArray = sortAndReduceDataMapArray(dataMapArray, "stake_e8s", 10);
    //     const {labels: chartLabels, datasets} =  getLabelsAndDataSetsInChartFormat(reducedDataMapArray, 125);
    //     const chartDataSets = [{...datasets[0], label: GRAPH_DISPLAY_LABELS.icp_staked}]

    //     return {chartLabels, chartDataSets};
    // }, [contributions]);

    // const {chartLabels, chartDataSets} = useMemo(() => {
    //     const dataMapArray = [];

    //     for(let [principal, contribution] of contributions){
    //         const 
    //         const label = homePageState?.canisterData?.userNames[principal];
    //         const dataPointObj = { stake_e8s: fromE8s(parseInt(stake_e8s)) }; 
    //         dataMapArray.push([label, dataPointObj ]);
    //     };
    // }, [contributions]);

    console.log(contributions);
    
    return (
        <>
            <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} flexDirection={"column"}>
                <DataField
                    label={"amount requested"}
                    text={`${amountToFund.value} ${amountToFund.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Campaign Wallet Balance"}
                    text={`${campaignWalletBalance.value} ${campaignWalletBalance.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Amount Disbursed"}
                    text={`${amountDisbursedToRecipient.value} ${amountDisbursedToRecipient.type}`}
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
                        text={`${remainingCollateralLocked.value} ${remainingCollateralLocked.type}`}
                        label={"Collateral Locked"}
                        disabled={true}
                        transparentBackground={true}
                    />
                }
                {nextPaymentDueDate &&
                    <>
                        <DataField
                            text={`${forfeitedCollateral.value} ${forfeitedCollateral.type}` }
                            label={"Collateral Forfeited"}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            text={`${remainingLoanPrincipalAmount.value} ${remainingLoanPrincipalAmount.type}` }
                            label={"Remaininig Principal Owed"}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            text={`${remainingLoanInterestAmount.value} ${remainingLoanInterestAmount.type}` }
                            label={"Remaining Interest Owed"}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={"Payment Due"}
                            text={`${Math.max(paymentAmounts.value - amountRepaidDuringCurrentPaymentInterval.value, 0)} ${paymentAmounts.type}`}
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
                
                {/* {!!contributions.length &&
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

export default RenderFundingCampaign;