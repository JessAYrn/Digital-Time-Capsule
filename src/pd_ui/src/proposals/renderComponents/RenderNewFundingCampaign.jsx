import React, {useContext, useState, useEffect, useMemo} from 'react';
import InputBox from '../../components/InputBox';
import { Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { AppContext } from "../../Context";
import MenuField from "../../components/MenuField";
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { daysToNanoSeconds, fromE8s, toE8s, nanoSecondsToDays, getFundingCampaignAssetTypeAndValue } from '../../functionsAndConstants/Utils';
import {  FUNDING_CAMPAIGN_ASSET_TYPES, INPUT_BOX_FORMATS } from '../../functionsAndConstants/Constants';
import ButtonField from '../../components/Button';
import DoneIcon from '@mui/icons-material/Done';
import InfoToolTip from '../../components/InfoToolTip';
import { getUncollateralizedStake } from '../../functionsAndConstants/treasuryDataFunctions';
import DataField from '../../components/DataField';
import { CONTRAST_COLOR, DIVIDER_SX, BACKGROUND_COLOR } from '../../Theme';
import { Divider } from '@mui/material';

 

const NewFundingCampaign = (props) => {

    const { onSubmitProposal, action, payload, disabled } = props;
    const fundingCampaignInput = payload?.fundingCampaignInput;
    const terms = fundingCampaignInput?.terms[0] || false;

    const { treasuryState } = useContext(AppContext);

    const [description, setDescription] = useState(fundingCampaignInput?.description);
    const [amountToFund, setAmountToFund] = useState(fundingCampaignInput?.amountToFund ? getFundingCampaignAssetTypeAndValue(fundingCampaignInput?.amountToFund) : {});
    const [isALoan, setIsALoan] = useState(fundingCampaignInput ? !!terms : undefined);
    
    const [paymentIntervalsInDays, setPaymentIntervalsInDays] = useState(terms ? nanoSecondsToDays(parseInt(terms?.paymentIntervals)) : null);
    const [paymentAmounts, setPaymentAmounts] = useState(terms ? getFundingCampaignAssetTypeAndValue(terms?.paymentAmounts) : null);
    const [initialLoanInterestAmount, setInitialLoanInterestAmount] = useState(terms ? getFundingCampaignAssetTypeAndValue(terms?.initialLoanInterestAmount) : null);
    const [initialCollateralLocked, setInitialCollateralLocked] = useState(terms ? getFundingCampaignAssetTypeAndValue(terms?.initialCollateralLocked) : null);

    const [hasError_1, setHasError_1] = useState(false);
    const [hasError_2, setHasError_2] = useState(false);
    const [hasError_3, setHasError_3] = useState(false);
    const [hasError_4, setHasError_4] = useState(false);
    const [hasError_5, setHasError_5] = useState(false);
    const [hasError_6, setHasError_6] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const amountToFundOptions = (exlude = []) => {
        return Object.keys(FUNDING_CAMPAIGN_ASSET_TYPES).map(key => {
            return {
                text: FUNDING_CAMPAIGN_ASSET_TYPES[key].toUpperCase(),
                onClick: () => {
                    setAmountToFund({...amountToFund, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
                    setPaymentAmounts({...paymentAmounts, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
                    setInitialLoanInterestAmount({...initialLoanInterestAmount, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
                },
                disabled: exlude.includes(FUNDING_CAMPAIGN_ASSET_TYPES[key])
            }
        });
    };

    const currencyToCollateralizeOptions = (exclude = []) => {
        return Object.keys(FUNDING_CAMPAIGN_ASSET_TYPES).map(key => {
        return {
            text: FUNDING_CAMPAIGN_ASSET_TYPES[key],
            onClick: () => {
                setInitialCollateralLocked({...initialCollateralLocked, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
            },
            disabled: exclude.includes(FUNDING_CAMPAIGN_ASSET_TYPES[key])
        }
    })};

    const neuronstoCollateralizeOptions = treasuryState?.userNeurons?.icp?.map(([neuronId,_]) => {
        return {
            text: neuronId,
            onClick: () => {
                setInitialCollateralLocked({...initialCollateralLocked, fromNeuron: neuronId});
            }
        }
    });

    const isALoanMenuItemProps = [
        { text: "Yes", onClick: () => setIsALoan(true)},
        { text: "No", onClick: () => setIsALoan(false)}
    ];

    useEffect(() => {
        const requiredFields = [ description, isALoan, amountToFund.value, amountToFund.type ];
        if(isALoan) requiredFields.push(
            paymentIntervalsInDays, 
            initialLoanInterestAmount?.type, 
            initialLoanInterestAmount?.value,
            paymentAmounts?.type,
            paymentAmounts?.value,
            initialCollateralLocked?.type,
            initialCollateralLocked?.value
        );
        if(initialCollateralLocked?.type === FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked) requiredFields.push(initialCollateralLocked?.fromNeuron);
        if(requiredFields.includes(null)) setIsReadyToSubmit(false);
        else if(requiredFields.includes(undefined)) setIsReadyToSubmit(false);
        else if(hasError_1 || hasError_2 || hasError_3 || hasError_4 || hasError_5 || hasError_6) setIsReadyToSubmit(false);
        else setIsReadyToSubmit(true);
    },[
        description,
        isALoan, 
        paymentIntervalsInDays, 
        initialLoanInterestAmount?.type, 
        initialLoanInterestAmount?.value, 
        paymentAmounts?.type, 
        paymentAmounts?.value,
        amountToFund?.value,
        amountToFund?.type,
        initialCollateralLocked?.type,
        initialCollateralLocked?.value,
        initialCollateralLocked?.fromNeuron,
    ]);

    const submitProposal = async () => {
        const terms = isALoan ? [{
            paymentIntervals: daysToNanoSeconds(paymentIntervalsInDays),
            initialLoanInterestAmount: {[initialLoanInterestAmount.type]: { e8s: toE8s(initialLoanInterestAmount.value), fromNeuron: initialLoanInterestAmount.fromNeuron }},
            paymentAmounts: {[paymentAmounts.type]: { e8s: toE8s(paymentAmounts.value), fromNeuron: paymentAmounts.fromNeuron }},
            initialCollateralLocked: {[initialCollateralLocked.type]: { e8s: toE8s(initialCollateralLocked.value), fromNeuron: initialCollateralLocked.fromNeuron }}
            }] : [];
        const payload = {
            amountToFund: { [amountToFund.type]: { e8s: toE8s(amountToFund.value) } },
            description: description,
            terms
        };
        await onSubmitProposal({[action]: {fundingCampaignInput :payload}});
    };

    const avaiableStake = useMemo(() => {
        if(initialCollateralLocked?.fromNeuron) {
            return fromE8s(getUncollateralizedStake(treasuryState?.userPrincipal, initialCollateralLocked?.fromNeuron, treasuryState?.neurons?.icp))
        } else return 0;
    },[initialCollateralLocked?.fromNeuron]);

    return(
        <Grid xs={12} width={"100%"} display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}> 
            <Grid minWidth={"275px"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                <MenuField
                    disabled={disabled}
                    xs={8}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    color={CONTRAST_COLOR}
                    label={"Currency To Receive"}
                    MenuIcon={KeyboardArrowDownIcon}
                    menuItemProps={amountToFundOptions([
                        FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked,
                        FUNDING_CAMPAIGN_ASSET_TYPES.ck_btc,
                        FUNDING_CAMPAIGN_ASSET_TYPES.ck_eth,
                        FUNDING_CAMPAIGN_ASSET_TYPES.ck_usdc,
                        FUNDING_CAMPAIGN_ASSET_TYPES.ck_usdt
                    ])}
                />
                <InfoToolTip 
                    text={"The Currency that the proposer wishes to raise in this funding campaign. Currently Only ICP is available. ckBTC, ckETH, ckUSDC and ckUSDT coming soon."} 
                    placement={"top-start"}
                    color={"white"}
                />
            </Grid>
            { amountToFund.type && 
            <>
                <Typography>{amountToFund.type.toUpperCase()}</Typography>
                <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                    <InputBox
                        disabled={disabled}
                        hasError={hasError_1}
                        width={"100%"}
                        label={"Amount to Receive"}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        allowNegative={false}
                        suffix={` ${amountToFund.type.toUpperCase()}`}
                        value={amountToFund.value}
                        parseNumber={parseFloat}
                        onChange={(value) => {
                            setHasError_1(value === "NaN" || value === NaN || value === "" || value === 0);
                            setAmountToFund({...amountToFund, value});
                        }}
                    /> 
                    <InfoToolTip 
                        text={`The amount of ${amountToFund.type.toUpperCase()} that the proposer wishes to raise.`} 
                        placement={"top-start"}
                        color={"white"}
                    />
                </Grid>
            </>
            }         
            { !!amountToFund.value && !hasError_1 && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <InputBox
                            disabled={disabled}
                        hasError={hasError_2}
                        width={"100%"}
                        label={"Description"}
                        format={INPUT_BOX_FORMATS.noFormat}
                        value={description}
                        rows={5}
                        onChange={(value) => {
                            setHasError_2(!value.length);
                            setDescription(value);
                        }}
                    />
                    <InfoToolTip 
                        text={`A brief description or link to external references regarding this funding campaign.`} 
                        placement={"top-start"}
                        color={"white"}
                        />
                    </Grid>
                </>
            }
            { !!description && !hasError_2 &&
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                    <MenuField
                        disabled={disabled}
                        xs={8}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        color={CONTRAST_COLOR}
                        label={"Is this a loan?"}
                        MenuIcon={KeyboardArrowDownIcon}
                        menuItemProps={isALoanMenuItemProps}
                    />
                    <InfoToolTip 
                        text={`Specifies whether this funding campaign is a loan or a donation.
                            Loans require repayment and some form of collateral. 
                            Donations are not required to be repaid nor collateralized.`} 
                        placement={"top-start"}
                        color={"white"}
                        />
                    </Grid>
                </>
            }
            { isALoan !== undefined && <Typography>This funding campaign {isALoan? "is a loan": "is NOT a loan"}</Typography> }
            {
                isALoan &&
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <InputBox
                            disabled={disabled}
                            width={"100%"}
                            hasError={hasError_3}
                            label={"Repayment Intervals"}
                            format={INPUT_BOX_FORMATS.numberFormat}
                        allowNegative={false}
                        maxDecimalPlaces={0}
                        parseNumber={parseInt}
                        maxValue={30}
                        omitMaxValueButton={true}
                        suffix={" days"}
                        value={paymentIntervalsInDays}
                        onChange={(value) => {
                            setHasError_3(value > 30 || value === "NaN" || value === NaN || value === "" || value === 0);
                            setPaymentIntervalsInDays(value);
                        }}
                    />
                    <InfoToolTip 
                        text={`The frequency at which the proposer is promising to make at least 1 payment on the loan. 
                            (e.g. if 7 days is selected, the proposer is promising to make at least 1 payment every 7 days)
                            The maximum repayment interval is 30 days.`
                        } 
                        placement={"top-start"}
                        color={"white"}
                    />
                    </Grid>
                    { !!paymentIntervalsInDays && !hasError_3 &&
                        <>
                            <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                            <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                            <InputBox
                                disabled={disabled}
                                hasError={hasError_4}
                                width={"100%"}
                                label={"Minimum Payment Amounts"}
                                format={INPUT_BOX_FORMATS.numberFormat}
                                allowNegative={false}
                                value={paymentAmounts.value}
                                parseNumber={parseFloat}
                                suffix={` ${paymentAmounts.type.toUpperCase()}`}
                                onChange={(value) => {
                                    setHasError_4(value === "NaN" || value === NaN || value === "" || value === 0);
                                    setPaymentAmounts({...paymentAmounts, value});
                                }}
                            />
                            <InfoToolTip
                                text={`The minimum amount of ${paymentAmounts.type.toUpperCase()} that the proposer is promising to repay during each repayment interval.
                                    (e.g. if 10 ${paymentAmounts.type.toUpperCase()} is selected, the proposer is promising to repay at least 10 ${paymentAmounts.type.toUpperCase()} during each repayment interval)`
                                }
                                placement={"top-start"}
                                color={"white"}
                            />
                            </Grid>
                        </>
                    }
                { !!paymentAmounts.value && !hasError_4 && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <InputBox
                            disabled={disabled}
                            hasError={hasError_5}
                            width={"100%"}
                            label={"Interest to be paid"}
                            format={INPUT_BOX_FORMATS.numberFormat}
                            allowNegative={false}
                            value={initialLoanInterestAmount.value}
                            parseNumber={parseFloat}
                            suffix={` ${initialLoanInterestAmount.type.toUpperCase()}`}
                            onChange={(value) => {
                                setHasError_5(value === "NaN" || value === NaN || value === "" || value === 0);
                                setInitialLoanInterestAmount({...initialLoanInterestAmount, value});
                            }}
                        />
                        <InfoToolTip
                            text={`The amount of ${paymentAmounts.type.toUpperCase()} that the proposer is promising to repay as interest for this loan.`}
                            placement={"top-start"}
                            color={"white"}
                        />
                    </Grid>
                </>}
                { !!initialLoanInterestAmount.value && !hasError_5 &&
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <MenuField
                            disabled={disabled}
                            xs={8}
                            display={"flex"}
                            alignItems={"center"}
                            justifyContent={"center"}
                            color={CONTRAST_COLOR}
                            label={"Collateral Type"}
                            MenuIcon={KeyboardArrowDownIcon}
                            menuItemProps={currencyToCollateralizeOptions([
                                amountToFund.type,
                                FUNDING_CAMPAIGN_ASSET_TYPES.ck_btc,
                                FUNDING_CAMPAIGN_ASSET_TYPES.ck_eth,
                                FUNDING_CAMPAIGN_ASSET_TYPES.ck_usdc,
                                FUNDING_CAMPAIGN_ASSET_TYPES.ck_usdt
                            ])}
                        />
                        <InfoToolTip
                            text={` The currency that the proposer wishes to use as collateral for this loan.`}
                            placement={"top-start"}
                            color={"white"}
                        />
                    </Grid>
                </>}
                { initialCollateralLocked?.type === FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked &&
                    <>
                        <Typography>{initialCollateralLocked.type.toUpperCase()}</Typography>
                        <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                            <MenuField
                                disabled={disabled}
                                xs={8}
                                display={"flex"}
                                alignItems={"center"}
                                justifyContent={"center"}
                                color={CONTRAST_COLOR}
                                label={"From Neuron"}
                                MenuIcon={KeyboardArrowDownIcon}
                                menuItemProps={neuronstoCollateralizeOptions}
                            />
                            <InfoToolTip
                                text={`The neuron that holds the staked ICP that the proposer wishes to collateralize.`}
                                placement={"top-start"}
                                color={"white"}
                            />
                        </Grid>
                    </>
                }
                { (initialCollateralLocked?.type && initialCollateralLocked?.type !== FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked) 
                    || initialCollateralLocked?.fromNeuron &&
                    <>
                        <Typography>{initialCollateralLocked.fromNeuron}</Typography>
                        <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                        {!disabled && 
                            <DataField 
                                label={"Available Stake: "} 
                                text={`${avaiableStake} ICP`} 
                                isLoading={!treasuryState.dataHasBeenLoaded} 
                                disabled={true}
                                transparentBackground={true}
                            />
                        }
                        <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <InputBox
                            disabled={disabled}
                            hasError={hasError_6}
                            width={"100%"}
                            label={"Amount to be collateralized"}
                            format={INPUT_BOX_FORMATS.numberFormat}
                            allowNegative={false}
                            value={initialCollateralLocked.value}
                            parseNumber={parseFloat}
                            suffix={` ${initialCollateralLocked.type.toUpperCase()}`}
                            onChange={(value) => {
                                setHasError_6(`${value}` === "NaN" || value === NaN || value === "" || value === 0 || value > avaiableStake);
                                setInitialCollateralLocked({...initialCollateralLocked, value});
                            }}
                        />
                        <InfoToolTip
                            text={`The amount of the ${initialCollateralLocked.type.toUpperCase()} that the proposer wishes to lock within the treasury as collateral for this loan.`}
                            placement={"top-start"}
                            color={"white"}
                        />
                        </Grid>
                    </>
                }
                </>
            } 
            { isReadyToSubmit && !disabled &&
            <>
                <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} bottom={"10px"} width={"100%"} >
                    <ButtonField
                    Icon={DoneIcon}
                    color={BACKGROUND_COLOR}
                    gridSx={{ width: "230px", backgroundColor: CONTRAST_COLOR }}
                    text={'Submit proposal'}
                    onClick={submitProposal}
                    /> 
                </Grid>
                </>
            }
        </Grid>
    )
};

export default NewFundingCampaign;