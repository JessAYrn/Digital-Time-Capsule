import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import ButtonField from "../Fields/Button";
import { AppContext } from "../../Context";
import DoneIcon from "@mui/icons-material/Done";
import InputBox from "../Fields/InputBox";
import { Typography } from "@mui/material";
import { INPUT_BOX_FORMATS } from "../../functionsAndConstants/Constants";
import { toE8s } from "../../functionsAndConstants/Utils";

export const ACTION_TYPES = {
    addLiquidity: "addLiquidity",
    repayFundingCampaign: "repayFundingCampaign",
};

const AddLiquidityOrRepayFundingCampaign = (props) => {
    const [amount, setAmount] = useState(0);
    const [hasError, setHasError] = useState(false);
    const {actorState} = useContext(AppContext);
    const {actionType, campaignId, setModalIsLoading, setModalIsOpen} = props;

    const onSubmit = async () => {
        setModalIsLoading(true);
        const backendFunctionToCall = (actionType === ACTION_TYPES.addLiquidity) ? actorState.backendActor.contributeToFundingCampaign : actorState.backendActor.repayFundingCampaign;
        await backendFunctionToCall(campaignId, toE8s(amount));
        setModalIsLoading(false);
        setModalIsOpen(false);
    };

    return(
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" flexDirection="column">
            <Typography variant={"h6"} color={"#bdbdbd"}> {actionType === ACTION_TYPES.addLiquidity ? "Add Liquidity" : "Repay Funding Campaign"} </Typography>
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
                    active={true}
                    text={"Submit"}
                    onClick={onSubmit}
                />: null
            }
        </Grid>
    )

};
export default AddLiquidityOrRepayFundingCampaign;