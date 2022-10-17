import React from 'react';
import './Switch.scss';
const Switch = (props) => {
    const {
        active,
        onClick,
        disabled
    } = props
    return (
        <label class="switch">
            <input type="checkbox" disabled={disabled} onClick={onClick} checked={active}/>
            <span class="slider round"></span>
        </label>
    );
};

export default Switch;