import React from "react";
import "./DataField.scss";

const DataField = (props) => {
    const {
        text,
        label
    } = props;

    return(
        <div className={'canisterDataDiv'}>
            <div className={'section'}>
                <h3 className={'lebelH3'}>
                    {label} 
                </h3>
            </div>
            <div className={'section'}>
                <h3 className={'h3DataField'}>
                    {text}
                </h3>
            </div>
        </div>
    )
};

export default DataField;