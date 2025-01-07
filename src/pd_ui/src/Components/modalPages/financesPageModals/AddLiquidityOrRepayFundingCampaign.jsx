import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import ButtonField from "../../Fields/Button";
import { AppContext } from "../../../Context";
import DoneIcon from "@mui/icons-material/Done";
import InputBox from "../../Fields/InputBox";
import { Typography } from "@mui/material";
import { INPUT_BOX_FORMATS } from "../../../functionsAndConstants/Constants";
import { toE8s, fromE8s } from "../../../functionsAndConstants/Utils";
import { treasuryTypes } from "../../../reducers/treasuryReducer";
import { sortFundingCampaigns } from "../../../functionsAndConstants/treasuryDataFunctions";
import DataField from "../../Fields/DataField";

export const ACTION_TYPES = {
    addLiquidity: "addLiquidity",
    repayFundingCampaign: "repayFundingCampaign",
};

const AddLiquidityOrRepayFundingCampaign = (props) => {
    const {actionType, campaignId} = props;
    
    const [amount, setAmount] = useState(0);
    const [hasError, setHasError] = useState(false);
    const {navigationAndApiState, treasuryState, treasuryDispatch, walletState, setModalIsOpen, setModalIsLoading} = useContext(AppContext);

    const availableBalance = (treasuryState?.userTreasuryData?.balances?.icp || 0) + (walletState?.walletData?.balance || 0);

    const onSubmit = async () => {
        setModalIsLoading(true);
        const backendFunctionToCall = (actionType === ACTION_TYPES.addLiquidity) ? navigationAndApiState.backendActor.contributeToFundingCampaign : navigationAndApiState.backendActor.repayFundingCampaign;
        const updatedFundingCampaignsArray = sortFundingCampaigns(await backendFunctionToCall(campaignId, toE8s(amount)));
        treasuryDispatch({
            actionType: treasuryTypes.SET_TREASURY_DATA, 
            payload: {fundingCampaigns: updatedFundingCampaignsArray }
        });
        setModalIsLoading(false);
        setModalIsOpen(false);
    };

    return(
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" flexDirection="column">
            <Typography variant={"h6"} color={"#bdbdbd"}> {actionType === ACTION_TYPES.addLiquidity ? "Add Liquidity" : "Repay Funding Campaign"} </Typography>
            <DataField label={"Available Balance: "} text={`${fromE8s(availableBalance) } ICP`} isLoading={!treasuryState.dataHasBeenLoaded} disabled={true} transparentBackground={true}/>
            <InputBox
                label={actionType === ACTION_TYPES.addLiquidity ? "Amount of ICP to Add" : "Amount of ICP to Repay"}
                placeHolder={"0 ICP"}
                format={INPUT_BOX_FORMATS.numberFormat}
                onChange={(value) => { setHasError(!value); setAmount(value); }}
                hasError={hasError}
                allowNegative={false}
                maxDecimalPlaces={8}
                parseNumber={parseFloat}
                width={"100%"}
                value={amount}
                suffix={" ICP"}
            />
            {
            (amount && !hasError) ? 
                <ButtonField
                    Icon={DoneIcon}
                    color={"secondary"}
                    text={"Submit"}
                    onClick={onSubmit}
                />: null
            }
        </Grid>
    )

};
export default AddLiquidityOrRepayFundingCampaign;