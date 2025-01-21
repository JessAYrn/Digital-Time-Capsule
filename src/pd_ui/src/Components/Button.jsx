import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { IconButton, Button, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { CONTRAST_COLOR, DIVIDER_SX, PAPER_COLOR } from "../Theme";

const ButtonField = (props) => {
    const {
        transparentBackground,
        transparentBorder,
        isLoading,
        text,
        Icon,
        iconSize,
        onClick,
        onBlur,
        disabled,
        id,
        onChange,
        ref,
        ariaControls,
        ariaHaspopup,
        ariaExpanded,
        color,
        upload,
        sx,
        gridSx,
        hyperLink,
    } = props;
    
    let doNothing = () => {};

    let ButtonType;
    if(isLoading !== undefined ) ButtonType = LoadingButton;
    else if(text) ButtonType = Button;
    else ButtonType = IconButton;
    let handleClick = disabled ? doNothing : onClick;
    return (
            <Grid 
            borderRadius={"20px"}
            border={transparentBorder? null: "solid " + DIVIDER_SX.borderColor}
            padding={0}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            sx={{
                backgroundColor: transparentBackground? "transparent":  PAPER_COLOR,
                ...gridSx
            }}
            >
                { hyperLink ?
                    <a href={hyperLink} target="_blank" rel="noreferrer noopener" style={{color: CONTRAST_COLOR}}>{text}</a> :
                    <ButtonType 

                        varient={upload ? 'contained' : null}
                        component={upload ? "label" : null}
                        aria-controls={ariaControls}
                        aria-haspopup={ariaHaspopup}
                        aria-expanded={ariaExpanded}
                        id={id}
                        onBlur={onBlur}
                        size={iconSize} 
                        sx={{color: color, width: "100%"}}
                        endIcon={(text && Icon) ?<Icon/> : null} 
                        onClick={handleClick}
                        disabled={disabled}
                        loading={isLoading}
                    >
                        {text && !isLoading && <Typography sx={{color: color, ...sx}}>{text}</Typography>}
                        {!text && Icon && <Icon sx={sx}/>}
                        {upload && <input type="file" hidden onChange={onChange} ref={ref}/>}
                    </ButtonType>
                }
            </Grid> 
    );

};

export default ButtonField;