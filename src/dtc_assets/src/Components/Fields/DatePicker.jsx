import React, {useState, useRef} from 'react';
import { MODALS_TYPES } from '../../functionsAndConstants/Constants';
import { types } from '../../reducers/journalReducer';
import { dateAisLaterThanOrSameAsDateB } from '../../functionsAndConstants/Utils';
import "./DatePicker.scss";


const DatePicker = (props) => {
    const inputRef = useRef();
    const [disabledOrEnabled,setDisabledOrEnabled] = useState("disabled");
    const {
        label,
        id,
        disabled,
        divClassName,
        dispatchAction,
        setChangesWereMade,
        dispatch,
        index,
        value,
        min,
        max
        // dispatchAction //the action that is to take place in order to dispatch the field change to the redux store
    } = props;

    const onBlur = () => {
        setDisabledOrEnabled("disabled");
    };
    const onFocus = () => {
        setDisabledOrEnabled("enabled");
    };

    const onChnage = () => {
        if(setChangesWereMade){
            setChangesWereMade(true);
        }
        let dateSelected = inputRef.current.value;
        if(min){
            let selectedDateIsAfterMin = dateAisLaterThanOrSameAsDateB(dateSelected, min);
            if(!selectedDateIsAfterMin){
                let dateElement = document.getElementById(id);
                dateElement.value = min;
                dateSelected = min;
                dispatch({
                    payload: { show: true, which: MODALS_TYPES.dateSelectedOutOfRange, beyondMax: false},
                    actionType: types.SET_MODAL_STATUS
                });
            }

        } else if(max){
            let selectedDateIsBeforeMax = dateAisLaterThanOrSameAsDateB(max, dateSelected);
            if(!selectedDateIsBeforeMax){
                let dateElement = document.getElementById(id);
                dateElement.value = max;
                dateSelected = max;
                dispatch({
                    payload: { show: true, which: MODALS_TYPES.dateSelectedOutOfRange, beyondMax: true},
                    actionType: types.SET_MODAL_STATUS
                });
            }
        }
        dispatch({
            payload: dateSelected,
            actionType: dispatchAction,
            index: index
        });

    }

    return(
        <div className={'inputBox__datePicker'}>
            <div className={'label-element-div_datepicker '}>
                <label className={"label "+disabledOrEnabled} htmlFor='Label'> {label}  &nbsp; </label>
            </div>
            <div className={`input-element-div ${(divClassName) ? divClassName : " "}`}>
            <input
                id={id}
                className={disabledOrEnabled}
                value={value || max || min}
                data-date-format="yyyy-mm-dd"
                type="date" 
                alt={label} 
                ref={inputRef} 
                disabled={disabled} 
                onFocus={onFocus}
                onBlur={onBlur}
                onChange={onChnage}
                min={min}
                max={max}
            />
            </div>
        </div>

        
    )
}; 

export default DatePicker;