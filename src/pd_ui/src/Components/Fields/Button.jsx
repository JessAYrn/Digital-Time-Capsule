import React from "react";
import { IconButton, Button, Paper } from '@mui/material';
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
        elevation,
        id,
        onChange,
        ref,
        ariaControls,
        ariaHaspopup,
        ariaExpanded,
        color,
        upload,
        sx,
        paperSx,
        hyperLink,
    } = props;
    
    let doNothing = () => {};

    let ButtonType;
    if(isLoading !== undefined ) ButtonType = LoadingButton;
    else if(text) ButtonType = Button;
    else ButtonType = IconButton;
    let handleClick = disabled ? doNothing : onClick;
    return (
            <Paper 
            sx={{
                color: color || "primary",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: `${transparentBackground ? "transparent": null}`,
                ...paperSx
            }}
            elevation={elevation ? elevation : 24} 
            >
                { hyperLink ?
                    <a href={hyperLink} target="_blank" rel="noreferrer noopener" style={{color: "#F7931A"}}>{text}</a> :
                    <ButtonType 
                        sx={sx}
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
                        loadingIndicatorCenter
                    >
                        {text && !isLoading && <span style={{color: color ? color :"white"}}>{text}</span>}
                        {!text && Icon && <Icon/>}
                        {upload && <input type="file" hidden onChange={onChange} ref={ref}/>}
                    </ButtonType>
                }
            </Paper> 
    );

};

export default ButtonField;