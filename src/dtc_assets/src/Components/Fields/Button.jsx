import React from "react";
import { IconButton, Button, Paper } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';import "./Button.scss";
import "./Button.scss";

const ButtonField = (props) => {
    const {
        calledByDataFieldComponent,
        isLoading,
        text,
        Icon,
        iconSize,
        onClick,
        disabled,
        elevation,
        active
    } = props;
    
    let doNothing = () => {};

    let ButtonType;
    if(isLoading !== undefined ) ButtonType = LoadingButton;
    else if(text) ButtonType = Button;
    else ButtonType = IconButton;
    let color = active ? 'custom' : 'white'
    let handleClick = disabled ? doNothing : onClick;
    return (
            <Paper elevation={elevation ? elevation : 24} className={`${calledByDataFieldComponent ? "dataField" : ""} buttonField`} >
                <ButtonType 
                    size={iconSize} 
                    color={color} 
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