import React , {useState} from "react";
import { Tooltip } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { deviceType } from "../functionsAndConstants/Utils";

const InfoToolTip = (props) => {
    const {text, placement, color} = props;
    let isDesktop = deviceType() === "desktop";
    const [open, setOpen] = useState(isDesktop? undefined : false);

    const Open = () => {
        if(isDesktop) return;
        setOpen(!open);
        setTimeout(() => {setOpen(false);}, 5000);
    };

    let style = isDesktop ? undefined : {maxWidth: "75px", cursor: "pointer"}; 

    return (
        <Tooltip title={text} placement={placement} open={open} sx={style} arrow disableFocusListener onClick={Open}>
            <InfoOutlinedIcon fontSize="small" style={{fontSize: "17px", paddingLeft: "5px", color: color}}/>
        </Tooltip>   
    )
};

export default InfoToolTip;