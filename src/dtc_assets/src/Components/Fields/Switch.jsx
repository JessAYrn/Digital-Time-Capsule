import React from 'react';
import './Switch.scss';
const Switch = (props) => {
    const {
        active,
        onClick,
        disabled
    } = props
    return (
        <label className="switch">
            <input type="checkbox" disabled={disabled} onClick={onClick} checked={active}/>
            <span className="slider round"></span>
        </label>
    );
};

export default Switch;