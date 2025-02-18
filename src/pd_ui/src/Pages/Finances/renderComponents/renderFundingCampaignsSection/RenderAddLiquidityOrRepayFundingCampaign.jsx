import React, {useState, useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import ButtonField from "../../../../components/Button";
import { AppContext } from "../../../../Context";
import DoneIcon from "@mui/icons-material/Done";
import InputBox from "../../../../components/InputBox";
import { Typography } from "@mui/material";
import { INPUT_BOX_FORMATS } from "../../../../functionsAndConstants/Constants";
import { toE8s, fromE8s } from "../../../../functionsAndConstants/Utils";
import { treasuryTypes } from "../../../../reducers/treasuryReducer";
import { sortFundingCampaigns } from "../../../../functionsAndConstants/treasuryDataFunctions";
import DataField from "../../../../components/DataField";
import { BACKGROUND_COLOR, CONTRAST_COLOR } from "../../../../Theme";

export const ACTION_TYPES = {
    addLiquidity: "addLiquidity",
    repayFundingCampaign: "repayFundingCampaign",
};

const AddLiquidityOrRepayFundingCampaign = (props) => {
    const {actionType, campaignId} = props;
    
    const [amount, setAmount] = useState(0);
    const [hasError, setHasError] = useState(true);
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
        <Grid xs={12} width={"100%"} display="flex" justifyContent="center" alignItems="center" flexDirection="column">
            <DataField label={"Available Balance: "} text={`${fromE8s(availableBalance) } ICP`} isLoading={!treasuryState.dataHasBeenLoaded} disabled={true} transparentBackground={true}/>
            <InputBox
                label={actionType === ACTION_TYPES.addLiquidity ? "Amount to Add" : "Amount to Repay"}
                placeHolder={"0 ICP"}
                format={INPUT_BOX_FORMATS.numberFormat}
                onChange={(e) => { 
                    const parsedValue = parseFloat(e.target.value);
                    setHasError(Object.is(parsedValue, NaN) || parsedValue === 0); 
                    setAmount(parsedValue); 
                }
                }
                hasError={hasError}
                allowNegative={false}
                maxDecimalPlaces={8}
                width={"100%"}
                value={amount}
                suffix={" ICP"}
            />
            { !hasError &&
                <Grid xs={12} display={"flex"} maxWidth={"700px"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} bottom={0}  width={"100%"} >
                    <ButtonField
                        Icon={DoneIcon}
                        gridSx={{margin: "2.5%", width: "95%", backgroundColor: CONTRAST_COLOR}}
                        color={BACKGROUND_COLOR}
                        text={"Submit"}
                        onClick={onSubmit}
                    />
                </Grid>
            }
        </Grid>
    )

};
export default AddLiquidityOrRepayFundingCampaign;