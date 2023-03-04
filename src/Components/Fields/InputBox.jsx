import React, {useState, useRef} from 'react';
import "./InputBox.scss";


const InputBox = (props) => {
    const inputRef = useRef();
    const [disabledOrEnabled,setDisabledOrEnabled] = useState("disabled");
    const {
        label,
        maxLength,
        rows,
        columns,
        disabled,
        divClassName,
        dispatchAction,
        dispatch,
        index,
        setChangesWereMade,
        value,
        onBlur_,
        setParentState
        // dispatchAction //the action that is to take place in order to dispatch the field change to the redux store
    } = props;

    const [textValue, setTextValue] = useState(value);

    const onBlur = () => {
        if(dispatch){
            dispatch({
                payload: inputRef.current.value,
                actionType: dispatchAction,
                index: index
            });
        } else {
            setParentState(inputRef.current.value);
        }
        setDisabledOrEnabled("disabled");
        if(onBlur_) onBlur_();
    };
    const onFocus = () => {
        setDisabledOrEnabled("enabled");
    };

    const onChnage = () => {
        if(setChangesWereMade){
            setChangesWereMade(true);
        }
        setTextValue(inputRef.current.value);
        
    }

    return(
        <div className={'inputBox'}>
            <div className={'label-element-div_input '}>
                <label className={"label "+disabledOrEnabled} htmlFor='Label'> {label}  &nbsp; </label>
            </div>
            <div className={`input-element-div ${(divClassName) ? divClassName : " "}`}>
            <textarea
                rows={rows}
                cols={columns}
                maxLength={maxLength}
                className={disabledOrEnabled}
                value={textValue}
                type="text" 
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

export default InputBox;