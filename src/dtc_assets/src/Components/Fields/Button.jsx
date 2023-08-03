import React from "react";
import { IconButton, Button, Paper } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';import "./Button.scss";
import "./Button.scss";

const ButtonField = (props) => {
    const {
        transparentBackground,
        isLoading,
        text,
        Icon,
        iconSize,
        onClick,
        disabled,
        elevation,
        active,
        id,
        ariaControls,
        ariaHaspopup,
        ariaExpanded,
        color,
        className
    } = props;
    
    let doNothing = () => {};

    let ButtonType;
    if(isLoading !== undefined ) ButtonType = LoadingButton;
    else if(text) ButtonType = Button;
    else ButtonType = IconButton;
    let color_ = active ? 'custom' : 'white'
    let handleClick = disabled ? doNothing : onClick;
    return (
            <Paper 
            elevation={elevation ? elevation : 24} 
            className={`${transparentBackground ? "transparentBackground" : ""} ${className} buttonField`} >
                <ButtonType 
                    aria-controls={ariaControls}
                    aria-haspopup={ariaHaspopup}
                    aria-expanded={ariaExpanded}
                    id={id}
                    size={iconSize} 
                    color={color || color_} 
                    endIcon={(text && Icon) ?<Icon/> : null} 
                    onClick={handleClick}
                    disabled={disabled}
                    loading={isLoading}
                    loadingIndicatorCenter
                >
                    {text && !isLoading && <span style={{color:"white"}}>{text}</span>}
                    {!text && Icon && <Icon/>}
                </ButtonType>
            </Paper> 
    );

};

export default ButtonField;