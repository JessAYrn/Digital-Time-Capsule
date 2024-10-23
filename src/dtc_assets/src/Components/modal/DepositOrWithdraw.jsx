import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { AppContext } from "../../Context";
import InputBox from "../Fields/InputBox";
import DoneIcon from '@mui/icons-material/Done';
import ButtonField from "../Fields/Button";
import { fromE8s, isANumber, toE8s } from "../../functionsAndConstants/Utils";
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";
import DataField from "../Fields/DataField";

export const actions = {
    deposit: "deposit",
    withdraw: "withdraw"
};

const DepositOrWithdrawModal = (props) => {

    const { setModalIsOpen, setModalProps,  setIsLoadingModal, action} = props;
    const {actorState, treasuryState, walletState} = useContext(AppContext);
    const [amount, setAmount] = useState(null);
    const [hasError, setHasError] = useState(true);

    const submit = async () => {
        setIsLoadingModal(true);
        if(action === actions.deposit) await actorState.backendActor.depositIcpToTreasury(toE8s(amount)); 
        else if(action === actions.withdraw )await actorState.backendActor.withdrawIcpFromTreasury(toE8s(amount));
        else throw new Error("Invalid Action");
        setIsLoadingModal(false);
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
            <Grid xs={12} display="flex" justifyContent="center" alignItems="center">
                <DataField
                    label={'Available Balance: '}
                    text={`${action === actions.withdraw ? fromE8s(treasuryState.userTreasuryData?.balances.icp || 0): fromE8s(walletState?.walletData?.balance) } ICP`}
                    isLoading={!treasuryState.dataHasBeenLoaded}
                    disabled={true}
                />
            </Grid>
            <InputBox
                width={"100%"}
                label={`Amount to ${action}: `}
                rows={"1"}
                hasError={hasError}
                onChange={onAmountChange}
                allowNegative={false}
                allowLeadingZeros={false}
                suffix={"ICP"}
                parseNumber={parseFloat}
                value={amount}
                format={INPUT_BOX_FORMATS.numberFormat}
            />
            {action === actions.withdraw &&
                <Grid xs={12} display="flex" justifyContent="center" alignItems="center">
                    <Typography >{"Note: A withdrawel fee of ~0.5% is deducted to sustain this DAO's Operations"}</Typography>
                </Grid>
            }
            {amount && !hasError &&
                <ButtonField
                Icon={DoneIcon}
                active={true}
                text={'Submit'}
                onClick={submit}
                />
            }

        </Grid>
    )
};

export default DepositOrWithdrawModal;