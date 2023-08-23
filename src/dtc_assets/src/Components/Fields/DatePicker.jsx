import React, {useState} from 'react';
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
        maxDate,
        md,
        xs
    } = props;

    const onChange_editButton = () => {
        setEditing(!editing);
    }

    let EditIcon_;
    if(editing) EditIcon_ = PublishIcon;
    else if(!editing) EditIcon_ = EditIcon;

    return(
        <Grid xs={xs ? xs : 12} md={md ? md :4} display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
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