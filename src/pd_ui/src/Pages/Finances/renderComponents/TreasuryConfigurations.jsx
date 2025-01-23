import React, {useContext, useState} from 'react'
import { AppContext } from '../../../Context'
import Grid from '@mui/material/Unstable_Grid2'
import SwitchField from '../../../components/Switch';
import { treasuryTypes } from '../../../reducers/treasuryReducer';

const TreasuryConfingurationsComponent = (props) => {

    const { setModalIsLoading, treasuryState, treasuryDispatch, navigationAndApiState} = useContext(AppContext);

    const onSwitchToggle = async (newAutoRepayLoansSetting, newAutoLoanContributionSetting) => {
        setModalIsLoading(true);
        const {automaticallyContributeToLoans, automaticallyRepayLoans} = await navigationAndApiState.backendActor.updateAutomatedSettings({
            automaticallyContributeToLoans: [newAutoLoanContributionSetting],
            automaticallyRepayLoans: [newAutoRepayLoansSetting]
        });
        treasuryDispatch({
            actionType: treasuryTypes.SET_USER_TREASURY_DATA, 
            payload: {
                ...treasuryState.userTreasuryData,
                automaticallyContributeToLoans: automaticallyContributeToLoans[0], 
                automaticallyRepayLoans: automaticallyRepayLoans[0],
            }
        });
        setModalIsLoading(false);
    };

    
    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} marginTop={"60px"}>
            <Grid columns={12} xs={12} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} width={"100%"}>
                <SwitchField
                sx={{ paddingTop: "20px", paddingBottom: "20px" }}
                checked={treasuryState?.userTreasuryData?.automaticallyRepayLoans}
                onClick={() => onSwitchToggle(!treasuryState?.userTreasuryData?.automaticallyRepayLoans, treasuryState?.userTreasuryData?.automaticallyContributeToLoans)}
                labelLeft={"Auto pay on loans received from funding campaigns: "}
                />
                <SwitchField
                sx={{ paddingTop: "20px", paddingBottom: "20px" }}
                checked={treasuryState?.userTreasuryData?.automaticallyContributeToLoans}
                onClick={() => onSwitchToggle(treasuryState?.userTreasuryData?.automaticallyRepayLoans, !treasuryState?.userTreasuryData?.automaticallyContributeToLoans)}
                labelLeft={"Auto lend to approved funding campaigns: "}
                />
            </Grid>
        </Grid>
    )
};

export default TreasuryConfingurationsComponent;