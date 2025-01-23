import React, {useContext, useState, useMemo} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Divider, Typography } from "@mui/material";
import DataField from "../../components/DataField";
import { AppContext } from "../../Context";
import InputBox from "../../components/InputBox";
import ButtonField from "../../components/Button";
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";
import { WHITE_COLOR, CONTRAST_COLOR, DIVIDER_SX, BACKGROUND_COLOR } from "../../Theme";
import { isANumber, fromE8s, toE8s, isANumber,   } from "../../functionsAndConstants/Utils";
import DoneIcon from '@mui/icons-material/Done';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuField from "../../components/MenuField";

export const ACTIONS = {
    DEPOSIT: "deposit",
    WITHDRAW: "withdraw",
    TRANSFER: "transfer",
}

const RenderTransactWithTreasury = (props) => {
    const {action} = props;
    const {walletState, navigationAndApiState, treasuryState, homePageState, setModalIsLoading, setModalIsOpen, setModalProps} = useContext(AppContext);
    const [amount, setAmount] = useState(null);
    const [recipientPrincipal, setRecipientPrincipal] = useState(null);
    const [hasError, setHasError] = useState(true);

    const availableBalance = useMemo(() => {
        if(action === ACTIONS.DEPOSIT) return fromE8s( parseInt(walletState.walletData.balance) )
        if(action === ACTIONS.WITHDRAW || action === ACTIONS.TRANSFER) return fromE8s( parseInt(treasuryState?.userTreasuryData?.balances?.icp || 0) );
    }, [walletState.walletData.balance, treasuryState?.userTreasuryData?.balances?.icp]);

    const recipientPrincipalMenuItemProps = useMemo(() => {
        return Object.keys(homePageState?.canisterData?.userNames).map((userPrincipal) => {
            return {
                text: homePageState?.canisterData?.userNames[userPrincipal],
                onClick: () => { setRecipientPrincipal(userPrincipal); },
                selected: (!!recipientPrincipal && userPrincipal === recipientPrincipal)
            }
        });
    }, []);

    const onChangeAmount = (e) => {
        const parsedAmount = parseFloat(e.target.value);
        setHasError(Object.is(parsedAmount, NaN) || parsedAmount === 0 || parsedAmount > availableBalance);
        setAmount(parsedAmount);
    }

    const onClickMax = () => {
        setAmount(availableBalance);
        setHasError(false);
    }

    const onSubmit = async () => {
        setModalIsLoading(true);
        if(action === ACTIONS.DEPOSIT) await navigationAndApiState.backendActor.depositIcpToTreasury(toE8s(amount)); 
        if(action === ACTIONS.WITHDRAW) await navigationAndApiState.backendActor.withdrawIcpFromTreasury(toE8s(amount));
        if(action === ACTIONS.TRANSFER) {
            const [_, {subaccountId: recipientTreasurySubaccountId}] = await treasuryState?.usersTreasuryDataArray.find(([principal, treasuryData]) => principal === recipientPrincipal);
            await navigationAndApiState.backendActor.transferICPFromTreasuryAccountToTreasuryAccount(toE8s(amount), recipientTreasurySubaccountId);
        }
        setModalIsLoading(false);
        setModalProps({});
        setModalIsOpen(false);
    };

    return (
        <Grid display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'} width={"100%"}>

            { action === ACTIONS.DEPOSIT && <Typography textAlign={'center'}>Deposit funds from your wallet to your treasury account where they can be used to participate in the DeFi activities of this DAO</Typography> }
            { action === ACTIONS.WITHDRAW && <Typography textAlign={'center'}>Withdraw funds from your treasury account to your wallet. DAO fees may apply.</Typography> }
            { action === ACTIONS.TRANSFER && <Typography textAlign={'center'}>Transfer funds from your treasury account to another user's treasury account.</Typography> }
            <Divider sx={{...DIVIDER_SX, marginTop: "30px"}}/>
            <DataField
                label={`Available Balance: `}
                text={`${availableBalance} ICP`}
                disabled={true}
                transparentBackground={true}
            />
            { action === ACTIONS.TRANSFER &&
            <>
                <Divider sx={{...DIVIDER_SX}}/>
                <MenuField
                    sx={{marginBottom: "20px"}}
                    xs={12}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    color={CONTRAST_COLOR}
                    label={"Who to transfer funds to?"}
                    MenuIcon={KeyboardArrowDownIcon}
                    menuItemProps={recipientPrincipalMenuItemProps}
                /> 
                {!!recipientPrincipal && <Typography marginBottom={"20px"} color={"#bdbdbd"}> {homePageState?.canisterData?.userNames[recipientPrincipal]} </Typography>}
            </> }
            <Divider sx={DIVIDER_SX}/>
            { (action === ACTIONS.DEPOSIT || action === ACTIONS.WITHDRAW || !!recipientPrincipal) &&
                <>
                    <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} width={"100%"}>
                        <InputBox
                        hasError={hasError}
                        label={"Amount: "}
                        rows={"1"}
                        value={amount}
                        onChange={onChangeAmount}
                        allowNegative={false}
                        suffix={" ICP"}
                        maxDecimalPlaces={8}
                        format={INPUT_BOX_FORMATS.numberFormat}
                        width={"100%"}
                        ButtonComponent={ <ButtonField text={"Max"} onClick={onClickMax} color={CONTRAST_COLOR} transparentBorder={true} transparentBackground={true}/> }
                        />
                    </Grid>
                    {!hasError &&
                        <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} width={"100%"} position={"fixed"} bottom={"10px"}>
                            <ButtonField
                            Icon={DoneIcon}
                            gridSx={{width: "50%", backgroundColor: CONTRAST_COLOR}}
                            color={BACKGROUND_COLOR}
                                text={'Submit'}
                                onClick={onSubmit}
                            />
                        </Grid>
                    } 
                
                </>
            }
        </Grid>
    );
}

export default RenderTransactWithTreasury;