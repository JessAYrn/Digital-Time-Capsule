import React, {useContext, useState} from 'react'
import { AppContext } from '../../Context'
import Grid from '@mui/material/Unstable_Grid2'
import SwitchField from '../../Components/Fields/Switch'

const TreasuryConfingurationsComponent = (props) => {

    const {setModalIsOpen, setModalIsLoading, treasuryState, navigationAndApiState} = useContext(AppContext);
    const [autoContributeToLoans, setAutoContributeToLoans] = useState(treasuryState?.userTreasuryData?.automaticallyContributeToLoans);
    const [autoRepayLoans, setAutoRepayLoans] = useState(treasuryState?.userTreasuryData?.automaticallyRepayLoans);

    const onSwitchToggle = async (newAutoRepayLoansSetting, newAutoLoanContributionSetting) => {
        setModalIsOpen(true);
        setModalIsLoading(true);
        setAutoRepayLoans(newAutoRepayLoansSetting);
        setAutoContributeToLoans(newAutoLoanContributionSetting);
        await navigationAndApiState.backendActor.updateAutomatedSettings({
            automaticallyContributeToLoans: [newAutoLoanContributionSetting],
            automaticallyRepayLoans: [newAutoRepayLoansSetting]
        });
        setModalIsOpen(false);
        setModalIsLoading(false);
    };
    
    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} marginTop={"60px"}>
            <Grid columns={12} xs={12} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} width={"100%"}>
                <SwitchField
                sx={{ paddingTop: "20px", paddingBottom: "20px" }}
                checked={autoRepayLoans}
                onClick={() => onSwitchToggle(!autoRepayLoans, autoContributeToLoans)}
                labelLeft={"Auto pay on loans received from funding campaigns: "}
                />
                <SwitchField
                sx={{ paddingTop: "20px", paddingBottom: "20px" }}
                checked={autoContributeToLoans}
                onClick={() => onSwitchToggle(autoRepayLoans, !autoContributeToLoans)}
                labelLeft={"Auto lend to approved funding campaigns: "}
                />
            </Grid>
        </Grid>
    )
};

export default TreasuryConfingurationsComponent;