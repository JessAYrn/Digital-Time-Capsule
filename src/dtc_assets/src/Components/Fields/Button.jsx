import React from "react";
import { IconContext } from 'react-icons/lib';
import "./Button.scss";

const ButtonField = (props) => {
    const {
        text,
        Icon,
        iconSize,
        iconColor, 
        onClick,
        withBox,
        disabled,
        className
    } = props;

    let value = {size: iconSize}
    if(iconColor) value.color = iconColor

    let doNothing = () => {};

    let handleClick = disabled ? doNothing : onClick;

    return (
        <div 
            className={`${ withBox ? 'buttonFieldDiv' : ''} ${ className ? className : ''}`}
            onClick={handleClick}
        >
            {text && <p>{text}</p>}
            {Icon && <IconContext.Provider value={value}>
                <Icon/>
            </IconContext.Provider>}
        </div> 
    );

};

export default ButtonField;