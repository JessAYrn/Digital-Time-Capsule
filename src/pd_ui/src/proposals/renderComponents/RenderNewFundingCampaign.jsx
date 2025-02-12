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
import CreateProposalForm from '../CreateProposalForm';
import { PROPOSAL_ACTIONS } from '../utils'; 

const NewFundingCampaign = (props) => {

    const { onSubmitProposal, action, payload, disabled } = props;
    const fundingCampaignInput = payload?.fundingCampaignInput;
    const loanAgreement = fundingCampaignInput?.loanAgreement[0];

    const { treasuryState, setModalProps, setModalIsLoading } = useContext(AppContext);

    const [description, setDescription] = useState(fundingCampaignInput?.description);
    const [amountToFund, setAmountToFund] = useState(fundingCampaignInput?.amountToFund ? getFundingCampaignAssetTypeAndValue(fundingCampaignInput?.amountToFund) : {});
    const [isALoan, setIsALoan] = useState(fundingCampaignInput ? !!loanAgreement : undefined);
    
    const [paymentTermPeriodInDays, setPaymentTermPeriodInDays] = useState(loanAgreement ? nanoSecondsToDays(parseInt(loanAgreement?.paymentTermPeriod)) : null);
    const [numberOfPayments, setNumberOfPayments] = useState(loanAgreement ? loanAgreement?.numberOfPayments : null);
    const [loanPrincipal, setLoanPrincipal] = useState(loanAgreement ? getFundingCampaignAssetTypeAndValue(loanAgreement?.loanPrincipal) : {});
    const [loanInterest, setLoanInterest] = useState(loanAgreement ? getFundingCampaignAssetTypeAndValue(loanAgreement?.loanInterest) : {});
    const [collateralProvided, setCollateralProvided] = useState(loanAgreement ? getFundingCampaignAssetTypeAndValue(loanAgreement?.collateralProvided) : {});

    const [hasError_1, setHasError_1] = useState(!disabled);
    const [hasError_2, setHasError_2] = useState(!disabled);
    const [hasError_3, setHasError_3] = useState(!disabled);
    const [hasError_4, setHasError_4] = useState(!disabled);
    const [hasError_5, setHasError_5] = useState(!disabled);
    const [hasError_6, setHasError_6] = useState(!disabled);

    const amountToFundOptions = (exlude = []) => {
        return Object.keys(FUNDING_CAMPAIGN_ASSET_TYPES).map(key => {
            return {
                text: FUNDING_CAMPAIGN_ASSET_TYPES[key].toUpperCase(),
                onClick: () => {
                    setAmountToFund({...amountToFund, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
                    setLoanPrincipal({...loanPrincipal, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
                    setLoanInterest({...loanInterest, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
                },
                disabled: exlude.includes(FUNDING_CAMPAIGN_ASSET_TYPES[key])
            }
        });
    };

    const currencyToCollateralizeOptions = (exclude = []) => {
        const menuItemProps = Object.keys(FUNDING_CAMPAIGN_ASSET_TYPES).map(key => {
            return {
                text: FUNDING_CAMPAIGN_ASSET_TYPES[key],
                onClick: () => {
                    setCollateralProvided({...collateralProvided, type: FUNDING_CAMPAIGN_ASSET_TYPES[key]});
                },
                disabled: exclude.includes(FUNDING_CAMPAIGN_ASSET_TYPES[key])
            }
        });
        return menuItemProps;
    };
        
    const neuronsToCollateralizeOptions = useMemo( () => {
        const menuItemProps = [];
        for(const [neuronId, {neuronInfo}] of treasuryState?.userNeurons?.icp) {
            if(!!neuronInfo){
                const availableStake = fromE8s(getUncollateralizedStake(treasuryState?.userPrincipal, neuronId, treasuryState?.userNeurons?.icp))
                if(availableStake > 0) {
                    menuItemProps.push({
                        text: neuronId,
                        onClick: () => {
                            setCollateralProvided({...collateralProvided, fromNeuron: neuronId, availableStake});
                        }
                    });
                }
            }
        }
        if(menuItemProps.length === 0) menuItemProps.push({
            text: "No stake found. Click here to stake ICP.",
            onClick: () => {
                setModalIsLoading(true);
                setModalProps({
                    fullScreen: true,
                    headerComponent: <Typography>Create Proposal</Typography>,
                    components: [
                        <>
                            <CreateProposalForm proposalAction={PROPOSAL_ACTIONS.IncreaseNeuron} proposalPayload={{}} />
                        </>
                    ]
                })
                setModalIsLoading(false);
            }
        });
        return menuItemProps;
    }, [collateralProvided]);


    const isALoanMenuItemProps = [
        { text: "Yes", onClick: () => setIsALoan(true)},
        { text: "No", onClick: () => setIsALoan(false)}
    ];

    const submitProposal = async () => {
        const loanAgreement = isALoan ? [{
            numberOfPayments,
            paymentTermPeriod: daysToNanoSeconds(paymentTermPeriodInDays),
            loanPrincipal: {[loanPrincipal.type]: { e8s: toE8s(loanPrincipal.value) }},
            loanInterest: {[loanInterest.type]: { e8s: toE8s(loanInterest.value) }},
            collateralProvided: {[collateralProvided.type]: { e8s: toE8s(collateralProvided.value), fromNeuron: collateralProvided.fromNeuron }}
        }] : [];
        const payload = {
            amountToFund: { [amountToFund.type]: { e8s: toE8s(amountToFund.value) } },
            description: description,
            loanAgreement
        };
        await onSubmitProposal({[action]: {fundingCampaignInput :payload}});
    };

    const canDisplayCurrencyToRaiseSection = useMemo(() => { return isALoan !== undefined; }, [isALoan]);

    const canDisplayLoanObligationsSection = useMemo(() => {
        return !!canDisplayCurrencyToRaiseSection && isALoan && !!amountToFund.type && !!amountToFund.value && !hasError_1;
    }, [canDisplayCurrencyToRaiseSection, isALoan, amountToFund, hasError_1]);

    const canDisplayCollateralSection = useMemo(() => {
        return !!canDisplayLoanObligationsSection && !!loanInterest.type && !!loanInterest.value && !hasError_2 && !!numberOfPayments && !hasError_3 && !!paymentTermPeriodInDays && !hasError_4;
    }, [canDisplayLoanObligationsSection, loanInterest, hasError_2, numberOfPayments, hasError_3, paymentTermPeriodInDays, hasError_4]);

    const canDisplayDescriptionSection = useMemo(() => {
        if(isALoan === true){
            return !!canDisplayCollateralSection && !!collateralProvided.type && !!collateralProvided.value && !hasError_5;
        } else if (isALoan === false){
            return !!canDisplayCurrencyToRaiseSection && !!amountToFund.type && !!amountToFund.value && !hasError_1;
        } else {
            return false;
        }
    }, [canDisplayCurrencyToRaiseSection, amountToFund, hasError_1, canDisplayCollateralSection, collateralProvided, hasError_5]);

    const canDisplaySubmitProposalButton = useMemo(() => {
        return !!canDisplayDescriptionSection && !!description && !hasError_6 && !disabled;
    }, [canDisplayDescriptionSection, description, hasError_6, disabled]);

    return(

        <>
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
            {isALoan !== undefined && <Typography>This funding campaign {isALoan? "is a loan": "is a donation"}</Typography> }
            {canDisplayCurrencyToRaiseSection && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid minWidth={"275px"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <MenuField
                            disabled={disabled}
                            xs={8}
                            display={"flex"}
                            alignItems={"center"}
                            justifyContent={"center"}
                            color={CONTRAST_COLOR}
                            label={"Currency To Raise"}
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
                            <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                                <InputBox
                                    disabled={disabled}
                                    hasError={hasError_1}
                                    width={"100%"}
                                    label={"Amount to Receive"}
                                    format={INPUT_BOX_FORMATS.numberFormat}
                                    allowNegative={false}
                                    maxDecimalPlaces={8}
                                    suffix={` ${amountToFund.type.toUpperCase()}`}
                                    value={amountToFund.value}
                                    onChange={(e) => {
                                        const parsedValue = parseFloat(e.target.value);
                                        setHasError_1(Object.is(parsedValue, NaN) || parsedValue === 0);
                                        setAmountToFund({...amountToFund, value: parsedValue});
                                        setLoanPrincipal({...loanPrincipal, value: parsedValue});
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
                </>
            }
            {canDisplayLoanObligationsSection && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <InputBox
                            disabled={disabled}
                            hasError={hasError_2}
                            width={"100%"}
                            label={"Interest to be paid"}
                            format={INPUT_BOX_FORMATS.numberFormat}
                            maxDecimalPlaces={8}
                            allowNegative={false}
                            value={loanInterest.value}
                            suffix={` ${loanInterest.type.toUpperCase()}`}
                            onChange={(e) => {
                                const parsedValue = parseFloat(e.target.value);
                                setHasError_2(Object.is(parsedValue, NaN));
                                setLoanInterest({...loanInterest, value: parsedValue});
                            }}
                        />
                        <InfoToolTip
                            text={`The amount of ${loanInterest.type.toUpperCase()} that the proposer is promising to repay as interest for this loan.`}
                            placement={"top-start"}
                            color={"white"}
                        />
                    </Grid>
                    {!!loanInterest.value && !hasError_2 &&
                        <>
                            <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                                <InputBox
                                disabled={disabled}
                                hasError={hasError_3}
                                width={"100%"}
                                label={"Number of Payments"}
                                format={INPUT_BOX_FORMATS.numberFormat}
                                allowNegative={false}
                                value={numberOfPayments}
                                onChange={(e) => {
                                    const parsedValue = parseInt(e.target.value);
                                    setHasError_3(Object.is(parsedValue, NaN) || parsedValue === 0);
                                    setNumberOfPayments(parsedValue);
                                }}
                            />
                                <InfoToolTip
                                    text={`The number of payments cycles that the proposer is offering to repay the loan.
                                        (e.g. if 10 payments are selected, the proposer is promising to repay the loan in 10 payments)`
                                    }
                                    placement={"top-start"}
                                    color={"white"}
                                />
                            </Grid>
                            {!!numberOfPayments && !hasError_3 &&
                                <>
                                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                                    <InputBox
                                        disabled={disabled}
                                        width={"100%"}
                                        hasError={hasError_4}
                                        label={"Payment Term Period"}
                                        format={INPUT_BOX_FORMATS.numberFormat}
                                        allowNegative={false}
                                        maxDecimalPlaces={0}
                                        suffix={" days"}
                                        value={paymentTermPeriodInDays}
                                        onChange={(e) => {
                                            const parsedValue = parseInt(e.target.value);
                                            setHasError_4(parsedValue > 30 || Object.is(parsedValue, NaN) || parsedValue === 0);
                                            setPaymentTermPeriodInDays(parsedValue);
                                        }}
                                    />
                                    <InfoToolTip 
                                        text={`The time span of each payment cycle.` } 
                                        placement={"top-start"}
                                            color={"white"}
                                        />
                                    </Grid>
                                </>
                            }
                        </>
                    }
                </>
            }
            {canDisplayCollateralSection && 
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
                    { collateralProvided.type && <Typography>{collateralProvided.type.toUpperCase()}</Typography> }
                    { collateralProvided.type === FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked &&
                        <>
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
                                    menuItemProps={neuronsToCollateralizeOptions}
                                />
                                <InfoToolTip
                                    text={`The neuron that holds the staked ICP that the proposer wishes to collateralize.`}
                                    placement={"top-start"}
                                    color={"white"}
                                />
                            </Grid>
                            {!disabled && !!collateralProvided.fromNeuron &&
                                <DataField 
                                    label={"Available Stake: "} 
                                    text={`${collateralProvided.availableStake} ICP`} 
                                    isLoading={!treasuryState.dataHasBeenLoaded} 
                                    disabled={true}
                                    transparentBackground={true}
                                />
                            }
                        </>
                    }
                    { !!collateralProvided.type && 
                        (
                            collateralProvided.type !== FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked || 
                            (collateralProvided.type === FUNDING_CAMPAIGN_ASSET_TYPES.icp_staked && !!collateralProvided.fromNeuron)
                        ) &&
                        <>
                        <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                                <InputBox
                                    disabled={disabled}
                                    hasError={hasError_5}
                                    width={"100%"}
                                    label={"Amount to be collateralized"}
                                    format={INPUT_BOX_FORMATS.numberFormat}
                                    allowNegative={false}
                                    value={collateralProvided.value}
                                    suffix={` ${collateralProvided.type.toUpperCase()}`}
                                    onChange={(e) => {
                                        const parsedValue = parseFloat(e.target.value);
                                        setHasError_5(Object.is(parsedValue, NaN) || parsedValue === 0 || parsedValue > collateralProvided.availableStake);
                                        setCollateralProvided({...collateralProvided, value: parsedValue});
                                    }}
                                />
                                <InfoToolTip
                                    text={`The amount of the ${collateralProvided.type.toUpperCase()} that the proposer wishes to lock within the treasury as collateral for this loan.`}
                                    placement={"top-start"}
                                    color={"white"}
                                />
                            </Grid>
                        </>
                    }
                </>
            }
            {canDisplayDescriptionSection && 
                <>
                    <Divider sx={{...DIVIDER_SX, marginTop: "20px", marginBottom: "20px"}} />
                    <Grid width={"100%"} xs={12} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <InputBox
                            disabled={disabled}
                            hasError={hasError_6}
                            width={"100%"}
                            label={"Description"}
                            format={INPUT_BOX_FORMATS.noFormat}
                            value={description}
                            rows={5}
                            onChange={(e) => {
                                setHasError_6(!e.target.value.length);
                                setDescription(e.target.value);
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
            {canDisplaySubmitProposalButton && 
                <>
                    <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} maxWidth={"700px"} position={"fixed"} bottom={0} width={"100%"} >
                        <ButtonField
                            Icon={DoneIcon}
                            color={BACKGROUND_COLOR}
                            gridSx={{ margin: "2.5%", width: "95%", backgroundColor: CONTRAST_COLOR }}
                            text={'Submit proposal'}
                            onClick={submitProposal}
                        /> 
                    </Grid>
                </>
            }
        </>
   
    )
};

export default NewFundingCampaign;