import React ,{useState, useContext, useEffect} from 'react';
import MenuField from '../../../Components/MenuField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { AppContext } from '../../../Context';
import ButtonField from '../../../Components/Button';
import { Typography } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import Grid from '@mui/material/Unstable_Grid2/Grid2';

const AddOrRemoveAdmin = (props) => {
    const { onSubmitProposal, action, payload, disabled } = props;
    const { homePageState } = useContext(AppContext);
    const [principal, setPrincipal] = useState(payload?.principal);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
    useEffect(() => { setIsReadyToSubmit(!!principal); }, [principal]);

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
                color={"secondary"}
                label={"Principal"}
                MenuIcon={KeyboardArrowDownIcon}
                menuItemProps={principalsMenuItemProps}
            />
            {principal && <Typography varient={"h6"} color={"#bdbdbd"}> {homePageState?.canisterData?.userNames[principal]} </Typography>}
            {isReadyToSubmit && !disabled &&
            <>
                <ButtonField
                        disabled={disabled}
                        Icon={DoneIcon}
                        color={"secondary"}
                        text={'Submit Proposal'}
                        onClick={submitProposal}
                    />
            </>}
        </Grid>
    );
};

export default AddOrRemoveAdmin;