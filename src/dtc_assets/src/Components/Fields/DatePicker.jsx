import React, {useState, useRef} from 'react';
import { MODALS_TYPES } from '../../functionsAndConstants/Constants';
import { types } from '../../reducers/journalReducer';
import { dateAisLaterThanOrSameAsDateB } from '../../functionsAndConstants/Utils';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import  ButtonField  from "./Button"
import "./DatePicker.scss";
import Grid from '@mui/material/Unstable_Grid2/Grid2';


const DatePickerField = (props) => {
    const [editing, setEditing] = useState(false);
    const {
        label,
        id,
        disablePast,
        disabled,
        onChange,
        value,
        editable,
        minDate,
        maxDate
        // dispatchAction //the action that is to take place in order to dispatch the field change to the redux store
    } = props;

    const onChange_editButton = () => {
        setEditing(!editing);
    }

    let EditIcon_;
    if(editing) EditIcon_ = PublishIcon;
    else if(!editing) EditIcon_ = EditIcon;

    // const onChnage = () => {
    //     if(setChangesWereMade){
    //         setChangesWereMade(true);
    //     }
    //     let dateSelected = inputRef.current.value;
    //     if(min){
    //         let selectedDateIsAfterMin = dateAisLaterThanOrSameAsDateB(dateSelected, min);
    //         if(!selectedDateIsAfterMin){
    //             let dateElement = document.getElementById(id);
    //             dateElement.value = min;
    //             dateSelected = min;
    //             dispatch({
    //                 payload: { show: true, which: MODALS_TYPES.dateSelectedOutOfRange, beyondMax: false},
    //                 actionType: types.SET_MODAL_STATUS
    //             });
    //         }

    //     } else if(max){
    //         let selectedDateIsBeforeMax = dateAisLaterThanOrSameAsDateB(max, dateSelected);
    //         if(!selectedDateIsBeforeMax){
    //             let dateElement = document.getElementById(id);
    //             dateElement.value = max;
    //             dateSelected = max;
    //             dispatch({
    //                 payload: { show: true, which: MODALS_TYPES.dateSelectedOutOfRange, beyondMax: true},
    //                 actionType: types.SET_MODAL_STATUS
    //             });
    //         }
    //     }
    //     dispatch({
    //         payload: dateSelected,
    //         actionType: dispatchAction,
    //         index: index
    //     });

    // }

    return(
        <Grid xs={12} md={4} display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker className='datePicker'
                    value={dayjs(value)}
                    label={label}
                    onChange={(e) => onChange(e.$d)}
                    disablePast={disablePast}
                    minDate={minDate}
                    maxDate={maxDate}
                    disabled={(editable && !editing) || disabled}
                        sx={{
                            "& .css-3cta2m-MuiInputBase-root-MuiOutlinedInput-root": {
                                color: "white"
                            }
                        }}
                    />
                </LocalizationProvider>
                {
                        editable && 
                        <ButtonField
                            className={"datePickerEditButton"}
                            transparentBackground={true}
                            elevation={0}
                            onClick={onChange_editButton}
                            Icon={EditIcon_}
                            iconSize={'small'}
                        />
                    }
        </Grid>
    )
}; 

export default DatePickerField;