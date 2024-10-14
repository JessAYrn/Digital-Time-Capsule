import React, {useContext, useState, useEffect} from 'react';
import InputBox from '../../../Fields/InputBox';
import { Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { AppContext } from "../../../../Context";
import MenuField from '../../../Fields/MenuField';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { daysToNanoSeconds, toE8s, nanoSecondsToDays, getFundingCampaignAssetTypeAndValue } from '../../../../functionsAndConstants/Utils';
import {  FUNDING_CAMPAIGN_ASSET_TYPES, INPUT_BOX_FORMATS } from '../../../../functionsAndConstants/Constants';
import ButtonField from '../../../Fields/Button';
import DoneIcon from '@mui/icons-material/Done';
 

const NewFundingCampaign = (props) => {

    const { onSubmitProposal, action, payload, disabled } = props;
    const fundingCampaignInput = payload?.fundingCampaignInput;
    const terms = fundingCampaignInput?.terms[0] || false;

    const { treasuryState } = useContext(AppContext);

    const [percentageOfDaoRewardsAllocated, setPercentageOfDaoRewardsAllocated] = useState(fundingCampaignInput?.percentageOfDaoRewardsAllocated ? parseInt(fundingCampaignInput?.percentageOfDaoRewardsAllocated) : null);
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
    const [hasError_7, setHasError_7] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const amountToFundOptions = (exlude = []) => {
        return Object.keys(FUNDING_CAMPAIGN_ASSET_TYPES).map(key => {
            return {
                text: FUNDING_CAMPAIGN_ASSET_TYPES[key],
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

    const neuronstoCollateralizeOptions = treasuryState?.neurons?.icp?.map(([neuronId,_]) => {
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
        const requiredFields = [ percentageOfDaoRewardsAllocated, description, isALoan, amountToFund.value, amountToFund.type ];
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
        else if(hasError_1 || hasError_2 || hasError_3 || hasError_4 || hasError_5 || hasError_6 || hasError_7) setIsReadyToSubmit(false);
        else setIsReadyToSubmit(true);
    },[
        percentageOfDaoRewardsAllocated, 
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
            percentageOfDaoRewardsAllocated: percentageOfDaoRewardsAllocated,
            description: description,
            terms
        };
        await onSubmitProposal({[action]: {fundingCampaignInput :payload}});
    };

    return(
        <Grid xs={12} display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}> 
            <MenuField
                disabled={disabled}
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                active={true}
                color={"custom"}
                label={"Currency To Receive"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={amountToFundOptions([FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked])}
            />
            { amountToFund.type && 
                <InputBox
                    disabled={disabled}
                    hasError={hasError_1}
                    width={"100%"}
                    label={"Amount to Receive"}
                    format={INPUT_BOX_FORMATS.numberFormat}
                    allowNegative={false}
                    suffix={` ${amountToFund.type}`}
                    value={amountToFund.value}
                    parseNumber={parseFloat}
                    onChange={(value) => {
                        setHasError_1(value === "NaN" || value === NaN || value === "" || value === 0);
                        setAmountToFund({...amountToFund, value});
                    }}
                /> 
            }
            { amountToFund.value && !hasError_1 &&
                <InputBox
                    disabled={disabled}
                    width={"100%"}
                    hasError={hasError_2}
                    label={"DAO Rewards to Allocate"}
                    format={INPUT_BOX_FORMATS.numberFormat}
                    allowNegative={false}
                    maxDecimalPlaces={0}
                    maxValue={100}
                    omitMaxValueButton={true}
                    parseNumber={parseInt}
                    suffix={" %"}
                    value={percentageOfDaoRewardsAllocated}
                    onChange={(value) => {
                        setHasError_2(value > 100 || value === "NaN" || value === NaN || value === "" || value === 0);
                        setPercentageOfDaoRewardsAllocated(value);
                    }}
                />
            }               
            { percentageOfDaoRewardsAllocated && !hasError_2 && 
                <InputBox
                    disabled={disabled}
                    hasError={hasError_3}
                    width={"100%"}
                    label={"Description"}
                    format={INPUT_BOX_FORMATS.noFormat}
                    value={description}
                    rows={5}
                    onChange={(value) => {
                        setHasError_3(value.length < 20);
                        setDescription(value);
                    }}
                />
            }
            { description && !hasError_3 &&
                <MenuField
                    disabled={disabled}
                    xs={8}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    active={true}
                    color={"custom"}
                    label={"Is this a loan?"}
                    MenuIcon={KeyboardArrowDownIcon}
                    menuItemProps={isALoanMenuItemProps}
                />
            }
            { isALoan !== undefined && <Typography>This funding campaign {isALoan? "is a loan": "is NOT a loan"}</Typography> }
            {
                isALoan &&
                <>
                <InputBox
                    disabled={disabled}
                    width={"100%"}
                    hasError={hasError_4}
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
                        setHasError_4(value > 30 || value === "NaN" || value === NaN || value === "" || value === 0);
                        setPaymentIntervalsInDays(value);
                    }}
                />
                { paymentIntervalsInDays && 
                    <InputBox
                        disabled={disabled}
                        hasError={hasError_5}
                        width={"100%"}
                        label={"Interest to be paid"}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        allowNegative={false}
                        value={initialLoanInterestAmount.value}
                        parseNumber={parseFloat}
                        suffix={` ${initialLoanInterestAmount.type}`}
                        onChange={(value) => {
                            setHasError_5(value === "NaN" || value === NaN || value === "" || value === 0);
                            setInitialLoanInterestAmount({...initialLoanInterestAmount, value});
                        }}
                    />
                }
                { initialLoanInterestAmount.value && !hasError_5 &&
                    <InputBox
                        disabled={disabled}
                        hasError={hasError_6}
                        width={"100%"}
                        label={"Minimum Payment Amounts"}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        allowNegative={false}
                        value={paymentAmounts.value}
                        parseNumber={parseFloat}
                        suffix={` ${paymentAmounts.type}`}
                        onChange={(value) => {
                            setHasError_6(value === "NaN" || value === NaN || value === "" || value === 0);
                            setPaymentAmounts({...paymentAmounts, value});
                        }}
                    />
                }
                { paymentAmounts.value && !hasError_6 &&
                    <MenuField
                        disabled={disabled}
                        xs={8}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        active={true}
                        color={"custom"}
                        label={"Currency To Be Collateralized"}
                        MenuIcon={KeyboardArrowDownIcon}
                        menuItemProps={currencyToCollateralizeOptions([amountToFund.type])}
                    />
                }
                { initialCollateralLocked?.type === FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked &&
                    <>
                        <Typography>{initialCollateralLocked.type}</Typography>
                        <MenuField
                            disabled={disabled}
                            xs={8}
                            display={"flex"}
                            alignItems={"center"}
                            justifyContent={"center"}
                            active={true}
                            color={"custom"}
                            label={"From Neuron"}
                            MenuIcon={KeyboardArrowDownIcon}
                            menuItemProps={neuronstoCollateralizeOptions}
                        />
                    </>
                }
                { (initialCollateralLocked?.type && initialCollateralLocked?.type !== FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked) 
                    || initialCollateralLocked?.fromNeuron &&
                    <>
                        <Typography>{initialCollateralLocked.fromNeuron}</Typography>
                        <InputBox
                            disabled={disabled}
                            hasError={hasError_7}
                            width={"100%"}
                            label={"Amount to be collateralized"}
                            format={INPUT_BOX_FORMATS.numberFormat}
                            allowNegative={false}
                            value={initialCollateralLocked.value}
                            parseNumber={parseFloat}
                            suffix={` ${initialCollateralLocked.type}`}
                            onChange={(value) => {
                                setHasError_7(value === "NaN" || value === NaN || value === "" || value === 0);
                                setInitialCollateralLocked({...initialCollateralLocked, value});
                            }}
                        />
                    </>
                }
                </>
            } 
            { isReadyToSubmit && !disabled &&
                <ButtonField
                    Icon={DoneIcon}
                    active={true}
                    text={'Submit proposal'}
                    onClick={submitProposal}
                /> 
            }
        </Grid>
    )
};

export default NewFundingCampaign;