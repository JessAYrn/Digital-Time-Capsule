import React, {useState, useRef} from 'react';
import { MODALS_TYPES } from '../../Constants';
import { types } from '../../reducers/journalReducer';
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

    const dateAisLaterThanOrSameAsDateB = (a, b) => {
        if(a === b) return true;
        let dateAAsArray = a.split('-');
        let yearA = parseInt(dateAAsArray[0]);
        let monthA = parseInt(dateAAsArray[1]);
        let dayA = parseInt(dateAAsArray[2]);

        let dateBAsArray = b.split('-');
        let yearB = parseInt(dateBAsArray[0]);
        let monthB = parseInt(dateBAsArray[1]);
        let dayB = parseInt(dateBAsArray[2]);

        if(yearA < yearB) return false;
        else if(yearA === yearB && monthA < monthB) return false;
        else if(yearA === yearB && monthA === monthB && dayA < dayB) return false;
        else return true;
    }

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
        <div className={'inputBox'}>
            <div className={'label-element-div '}>
                <label className={"label__"+disabledOrEnabled} htmlFor='Label'> {label}  &nbsp; </label>
            </div>
            <div className={`input-element-div__${(divClassName) ? divClassName : " "}`}>
            <input
                id={id}
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
                min={min}
                max={max}
            />
            </div>
        </div>

        
    )
}; 

export default DatePicker;