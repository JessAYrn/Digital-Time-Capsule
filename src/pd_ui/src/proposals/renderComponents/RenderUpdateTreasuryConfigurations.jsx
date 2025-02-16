import React, {useState} from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import MenuField from '../../components/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Divider, Typography } from '@mui/material';
import { DIVIDER_SX, BACKGROUND_COLOR, CONTRAST_COLOR } from '../../Theme';
import DoneIcon from '@mui/icons-material/Done';
import ButtonField from '../../components/Button';

const RenderUpdateTreasuryConfigurations = (props) => {
    const { onSubmitProposal, payload, action, disabled } = props;

    const [automaticallyContributeToLoans, setAutomaticallyContributeToLoans] = useState(payload?.automaticallyContributeToLoans);
    const [automaticallyRepayLoans, setAutomaticallyRepayLoans] = useState(payload?.automaticallyRepayLoans);

    const menuItemPropsForContributeToLoans = [
        {text: "True", onClick: () => setAutomaticallyContributeToLoans(true)},
        {text: "False", onClick: () => setAutomaticallyContributeToLoans(false)},
    ];

    const menuItemPropsForRepayLoans = [
        {text: "True", onClick: () => setAutomaticallyRepayLoans(true)},
        {text: "False", onClick: () => setAutomaticallyRepayLoans(false)},
    ];

    const submitProposal = async () => {
        await onSubmitProposal({ [action]: { automaticallyContributeToLoans, automaticallyRepayLoans } });
    };

    return (
        <Grid xs={12} width="100%" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Grid xs={12} width="100%" display="flex" justifyContent="center" alignItems="center">
                <MenuField 
                    sx={{width: "100%"}} 
                    label={"Set all users treasury configurations to automatically lend to approved funding campaigns"} 
                    xs={6} display={"flex"} 
                    alignItems={"center"} 
                    justifyContent={"center"} 
                    color={CONTRAST_COLOR} 
                    menuItemProps={menuItemPropsForContributeToLoans} 
                    MenuIcon={KeyboardArrowDownIcon}
                />
            </Grid>
            {automaticallyContributeToLoans !== undefined &&
                <>
                    <Typography >  {automaticallyContributeToLoans ? "True" : "False"} </Typography>
                    <Divider sx={DIVIDER_SX}/>
                    <Grid xs={12} width="100%" display="flex" justifyContent="center" alignItems="center">
                        <MenuField 
                            sx={{width: "100%"}} 
                            label={"Set all users treasury configurations to automatically repay their debts"} 
                            xs={6} display={"flex"} 
                            alignItems={"center"} 
                            justifyContent={"center"} 
                            color={CONTRAST_COLOR} 
                            menuItemProps={menuItemPropsForRepayLoans} 
                            MenuIcon={KeyboardArrowDownIcon}
                        />
                    </Grid>
                    {automaticallyRepayLoans !== undefined &&
                        <>
                            <Typography >  {automaticallyRepayLoans ? "True" : "False"} </Typography>

                            { !disabled && 
                                <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} maxWidth={"700px"} bottom={0} width={"100%"} >
                                    <ButtonField
                                        disabled={disabled}
                                        Icon={DoneIcon}
                                        color={BACKGROUND_COLOR}
                                        gridSx={{ margin: "2.5%", width: "95%", backgroundColor: CONTRAST_COLOR }}
                                        text={'Submit Proposal'}
                                        onClick={submitProposal}
                                    />
                                </Grid>
                            }
                        </>
                    }
                </>
            }
        </Grid>
    );
};

export default RenderUpdateTreasuryConfigurations;