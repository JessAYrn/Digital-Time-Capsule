import React, {useState, useRef} from 'react';
import "./DatePicker.scss";


const DatePicker = (props) => {
    const inputRef = useRef();
    const [disabledOrEnabled,setDisabledOrEnabled] = useState("disabled");
    const {
        label,
        disabled,
        divClassName,
        dispatchAction,
        dispatch,
        index,
        value
        // dispatchAction //the action that is to take place in order to dispatch the field change to the redux store
    } = props;

    const onBlur = () => {
        setDisabledOrEnabled("disabled");
    };
    const onFocus = () => {
        setDisabledOrEnabled("enabled");
    };

    const onChnage = () => {
        dispatch({
            payload: inputRef.current.value,
            actionType: dispatchAction,
            index: index
        });
    }

    return(
        <div className={'inputBox'}>
            <div className={'label-element-div '}>
                <label className={"label__"+disabledOrEnabled} htmlFor='Label'> {label}  &nbsp; </label>
            </div>
            <div className={`input-element-div__${(divClassName) ? divClassName : " "}`}>
            <input
                className={disabledOrEnabled}
                value={value}
                data-date-format="yyyy-mm-dd"
                type="date" 
                alt={label} 
                ref={inputRef} 
                disabled={disabled} 
                onFocus={onFocus}
                onBlur={onBlur}
                onChange={onChnage}
            />
            </div>
        </div>

        
    )
}; 

export default DatePicker;