import React, {useMemo, useContext} from "react";
import { AppContext } from "../../../../Context";
import Grid from "@mui/material/Unstable_Grid2";
import InputBox from "../../../../components/InputBox";
import { getFundingCampaignAssetTypeAndValue, getDateInNanoSeconds, fromE8s, nanoSecondsToDays, nanoSecondsToMiliSeconds, round8Decimals } from "../../../../functionsAndConstants/Utils";
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
    const {  loanAgreement, settled, funded } = fundingCampaign;
    const {setModalIsOpen, setModalProps, homePageState } = useContext(AppContext);


    const {
        amountToFund,
        amountDisbursedToRecipient,
        campaignWalletBalance,
        nextDuePayment,
        collateralLocked,
        collateralForfeited,
        collateralReleased,
        collateralProvided,
        totalOwed,
        loanInterest,
        numberOfPayments,
        paymentTermPeriod,
        loanPrincipal,
        payments
    } = useMemo( () => {

        let obj = {
            amountToFund: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountToFund),
            amountDisbursedToRecipient: getFundingCampaignAssetTypeAndValue(fundingCampaign?.amountDisbursedToRecipient),
            campaignWalletBalance: getFundingCampaignAssetTypeAndValue(fundingCampaign?.campaignWalletBalance),
        };

        if(loanAgreement[0]){
            const { payments, collateralProvided, loanPrincipal, loanInterest, numberOfPayments, paymentTermPeriod } = loanAgreement[0];

            const nowInNanoSeconds = getDateInNanoSeconds(new Date());

            let nextDuePayment = payments[0];
            let totalCollateralReleased = 0;
            let totalCollateralForfeited = 0;
            let totalOwed = 0;

            for(let payment of payments){
                totalCollateralReleased += parseInt(payment.collateralReleased.icp_staked.e8s);
                totalCollateralForfeited += parseInt(payment.collateralForfeited.icp_staked.e8s);
                totalOwed += parseInt(payment.owed.icp.e8s);
                if(payment.dueDate < nowInNanoSeconds) continue;
                if(payment.dueDate < nextDuePayment.dueDate) nextDuePayment = payment;
            };

            const remainingCollateralLocked = getFundingCampaignAssetTypeAndValue(collateralProvided).value - fromE8s(totalCollateralReleased + totalCollateralForfeited);

            obj = {
                ...obj,
                payments,
                nextDuePayment,
                numberOfPayments,
                paymentTermPeriod,
                loanInterest: getFundingCampaignAssetTypeAndValue(loanInterest),
                loanPrincipal: getFundingCampaignAssetTypeAndValue(loanPrincipal),
                collateralProvided: getFundingCampaignAssetTypeAndValue(collateralProvided),
                totalOwed: {...getFundingCampaignAssetTypeAndValue(loanPrincipal), value: fromE8s(totalOwed)},
                collateralLocked: {...getFundingCampaignAssetTypeAndValue(collateralProvided), value: remainingCollateralLocked},
                collateralForfeited: {...getFundingCampaignAssetTypeAndValue(collateralProvided), value: fromE8s(totalCollateralForfeited)},
                collateralReleased: { ...getFundingCampaignAssetTypeAndValue(collateralProvided), value: fromE8s(totalCollateralReleased)},
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
                    text={!!loanAgreement?.length ? "Loan" : "Donation"}
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
                        label={!!loanAgreement?.length ? "Loan Amount:" : "Donation Amount:"}
                        text={`${round8Decimals(loanPrincipal?.value)} ${loanPrincipal?.type}`}
                        disabled={true}
                        transparentBackground={true}
                    />
                }
                {!funded && <DataField
                    label={`${!!loanAgreement?.length ? "Loan Amount Requested:" : "Donation Amount Requested:"}`}
                    text={`${round8Decimals(amountToFund?.value)} ${amountToFund?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />}
                {!!loanAgreement?.length &&
                    <>
                        <DataField
                            text={`${loanInterest?.value} ${loanInterest?.type}` }
                            label={"Interest Offered:"}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={"Collateral Provided:"}
                            text={`${collateralProvided?.value} ${collateralProvided?.type}`}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={"Number of Payments:"}
                            text={`${numberOfPayments}`}
                            disabled={true}
                            transparentBackground={true}
                        />
                        <DataField
                            label={"Payment Term Period:"}
                            text={`${nanoSecondsToDays(parseInt(paymentTermPeriod))} days`}
                            disabled={true}
                            transparentBackground={true}
                        />
                    </>
                }
                {!funded && !settled && 
                    <DataField
                    label={"Funding Amount Collected: "}
                    text={`${round8Decimals(campaignWalletBalance?.value)} ${campaignWalletBalance?.type}`}
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
                    text={`${round8Decimals(totalOwed?.value)} ${totalOwed?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                 <DataField
                    label={"Amount Due:"}
                    text={`${round8Decimals(getFundingCampaignAssetTypeAndValue(nextDuePayment?.owed).value)} ${getFundingCampaignAssetTypeAndValue(nextDuePayment?.owed).type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Due Date: "}
                    text={new Date(nanoSecondsToMiliSeconds(parseInt(nextDuePayment?.dueDate))).toLocaleDateString()}
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
                    text={`${round8Decimals(collateralLocked?.value)} ${collateralLocked?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Released Collateral:"}
                    text={`${round8Decimals(collateralReleased?.value)} ${collateralReleased?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
                <DataField
                    label={"Forfeited Collateral:"}
                    text={`${round8Decimals(collateralForfeited?.value)} ${collateralForfeited?.type}`}
                    disabled={true}
                    transparentBackground={true}
                />
            </>
        );
    };
    
    return (
        <Grid display={"flex"} width={"100%"} justifyContent={"center"} alignItems={"center"} xs={12} padding={0} margin={"10px"} flexDirection={"column"}>
            <RenderCampaignDetails />

            {!!loanAgreement?.length && !!funded && !settled &&
            <>
                <Divider sx={{...DIVIDER_SX, marginTop: "30px", marginBottom: "30px"}} />
                <RenderLoanObligations />
            </>}

            {!!loanAgreement?.length && !!funded &&
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