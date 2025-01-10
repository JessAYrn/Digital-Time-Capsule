import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { AppContext } from "../../Context";
import InputBox from "../../Components/Fields/InputBox";
import DoneIcon from '@mui/icons-material/Done';
import ButtonField from "../../Components/Fields/Button";
import { fromE8s, isANumber, toE8s } from "../../functionsAndConstants/Utils";
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";
import DataField from "../../Components/Fields/DataField";
import {FormControlLabel} from "@mui/material";
import {FormGroup} from "@mui/material";
import {Checkbox} from "@mui/material";
import MenuField from "../../Components/Fields/MenuField";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export const actions = {
    deposit: "deposit",
    withdraw: "withdraw",
    send: "send",
};

const TransactWithTreasuryModal = (props) => {

    const {navigationAndApiState, treasuryState, walletState, setModalIsOpen, setModalProps, setModalIsLoading} = useContext(AppContext);
    const [action, setAction] = useState(actions.deposit);
    const [amount, setAmount] = useState(null);
    const [recipientPrincipal, setRecipientPrincipal] = useState(null);
    const [hasError, setHasError] = useState(true);

    const principalsMenuItemProps = treasuryState.usersTreasuryDataArray?.map( ([principal, _]) => { 
        return {
            onClick: () => setRecipientPrincipal(principal),
            text: principal
        };
    });

    const submit = async () => {
        setModalIsLoading(true);
        if(action === actions.deposit) await navigationAndApiState.backendActor.depositIcpToTreasury(toE8s(amount)); 
        else if(action === actions.withdraw )await navigationAndApiState.backendActor.withdrawIcpFromTreasury(toE8s(amount));
        else if(action === actions.send) await navigationAndApiState.backendActor.trasnferICPFromTreasuryAccountToTreasuryAccount(toE8s(amount), recipientPrincipal);
        else throw new Error("Invalid Action");
        setModalIsLoading(false);
        setModalProps({});
        setModalIsOpen(false);
    };

    const onAmountChange = (value) => {
        setHasError(!isANumber(value));
        setAmount(value);
    };

    return (
        <Grid
            columns={12} 
            xs={12} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
        >
            <Grid
                columns={12} 
                xs={12} 
                rowSpacing={8} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
            >
                <FormGroup>
                    <FormControlLabel 
                        label = {"Deposit"}
                        labelPlacement="end"
                        color="white"
                        control={ <Checkbox style={{color: "white"}} checked={action === actions.deposit} onChange={ (e) => {setRecipientPrincipal(null); setAction(e.target.checked ? actions.deposit : null) } }/> }
                    />
                </FormGroup>
                <FormGroup>
                    <FormControlLabel 
                        label = {"Send"}
                        labelPlacement="end"
                        color="white"
                        control={ <Checkbox style={{color: "white"}} checked={action === actions.send} onChange={ (e) => {setRecipientPrincipal(null); setAction(e.target.checked ? actions.send : null)} }/>}
                    />
                </FormGroup>
                <FormGroup>
                    <FormControlLabel 
                        label = {"Withdraw"}
                        labelPlacement="end"
                        color="white"
                        control={ <Checkbox style={{color: "white"}} checked={action === actions.withdraw} onChange={ (e) => {setRecipientPrincipal(null); setAction(e.target.checked ? actions.withdraw : null) } }/> }
                    />
                    </FormGroup>
            </Grid>

             <Grid xs={12} display="flex" justifyContent="center" alignItems="center">
                <DataField
                    label={'Available Balance: '}
                    text={`${(action === actions.withdraw || action === actions.send) ? fromE8s(treasuryState.userTreasuryData?.balances.icp || 0): fromE8s(walletState?.walletData?.balance) } ICP`}
                    isLoading={!treasuryState.dataHasBeenLoaded}
                    disabled={true}
                    transparentBackground={true}
                />
            </Grid>
            {action && <InputBox
                width={"100%"}
                label={`Amount to ${action}: `}
                rows={"1"}
                hasError={hasError}
                onChange={onAmountChange}
                allowNegative={false}
                allowLeadingZeros={false}
                suffix={" ICP"}
                parseNumber={parseFloat}
                value={amount}
                format={INPUT_BOX_FORMATS.numberFormat}
            />}
            
            {action === actions.withdraw &&
                <Grid xs={12} display="flex" justifyContent="center" alignItems="center">
                    <Typography >{"Note: A withdrawel fee of ~0.5% is deducted to sustain this DAO's Operations"}</Typography>
                </Grid>
            }
            {action === actions.send &&
                <MenuField
                    xs={8}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    color={"secondary"}
                    label={"Recipient's Principal: "}
                    MenuIcon={KeyboardArrowDownIcon}
                    menuItemProps={principalsMenuItemProps}
                />
            }
            {recipientPrincipal &&
                <Grid xs={12} display="flex" justifyContent="center" alignItems="center" marginTop={"10px"} marginBottom={"10px"}>
                    <Typography >{recipientPrincipal}</Typography>
                </Grid>
            }
            {!!amount && !hasError && (action !== actions.send || recipientPrincipal) &&
                <ButtonField
                Icon={DoneIcon}
                color={"secondary"}
                text={'Submit'}
                onClick={submit}
                />
            } 

        </Grid>
    )
};

export default TransactWithTreasuryModal;