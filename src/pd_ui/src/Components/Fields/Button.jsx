import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { IconButton, Button, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

const ButtonField = (props) => {
    const {
        transparentBackground,
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
        bgColor,
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
            bgcolor={transparentBackground ? "transparent": bgColor || "black"}
            borderRadius={"5px"}
            border={transparentBackground? null: "solid grey"}
            padding={0}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            sx={gridSx}
            >
                { hyperLink ?
                    <a href={hyperLink} target="_blank" rel="noreferrer noopener" style={{color: "#F7931A"}}>{text}</a> :
                    <ButtonType 
                        varient={upload ? 'contained' : null}
                        component={upload ? "label" : null}
                        aria-controls={ariaControls}
                        aria-haspopup={ariaHaspopup}
                        aria-expanded={ariaExpanded}
                        id={id}
                        onBlur={onBlur}
                        size={iconSize} 
                        color={color || "primary"} 
                        endIcon={(text && Icon) ?<Icon/> : null} 
                        onClick={handleClick}
                        disabled={disabled}
                        loading={isLoading}
                    >
                        {text && !isLoading && <Typography sx={sx} color={color}>{text}</Typography>}
                        {!text && Icon && <Icon sx={sx}/>}
                        {upload && <input type="file" hidden onChange={onChange} ref={ref}/>}
                    </ButtonType>
                }
            </Grid> 
    );

};

export default ButtonField;