import React ,{useState, useContext, useEffect} from 'react';
import MenuField from '../../components/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { AppContext } from '../../Context';
import ButtonField from '../../components/Button';
import { Typography } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { CONTRAST_COLOR, BACKGROUND_COLOR } from '../../Theme';

const AddOrRemoveAdmin = (props) => {
    const { onSubmitProposal, action, payload, disabled } = props;
    const { homePageState } = useContext(AppContext);
    const [principal, setPrincipal] = useState(payload?.principal);


    const principalsMenuItemProps = homePageState?.canisterData?.profilesMetaData?.map(({userPrincipal}) => {
        return { text: homePageState?.canisterData?.userNames[userPrincipal], onClick: () => { setPrincipal(userPrincipal); } };
    });

    const submitProposal = async () => { await onSubmitProposal({[action]: {principal}}); };
    
    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <MenuField
                disabled={disabled}
                xs={8}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={CONTRAST_COLOR}
                label={"Principal"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={principalsMenuItemProps}
            />
            {!!principal && 
                <>
                    <Typography varient={"h6"} color={"#bdbdbd"}> {homePageState?.canisterData?.userNames[principal]} </Typography>
                    { !disabled && 
                        <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} position={"fixed"} bottom={"10px"} width={"100%"} >
                            <ButtonField
                                disabled={disabled}
                                Icon={DoneIcon}
                                color={BACKGROUND_COLOR}
                                gridSx={{ width: "230px", backgroundColor: CONTRAST_COLOR }}
                                text={'Submit Proposal'}
                                onClick={submitProposal}
                            />
                        </Grid>
                    }
                </>
            }
        </Grid>
    );
};

export default AddOrRemoveAdmin;