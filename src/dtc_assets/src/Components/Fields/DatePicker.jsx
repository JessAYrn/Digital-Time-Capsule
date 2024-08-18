import React, {useState} from 'react';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import  ButtonField  from "./Button"
import Grid from '@mui/material/Unstable_Grid2/Grid2';


const DatePickerField = (props) => {
    const [editing, setEditing] = useState(false);
    const {
        label,
        id,
        width,
        disablePast,
        disabled,
        onChange,
        value,
        showEditButton,
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
        <Grid 
            width={width}
            xs={xs ? xs : 12} 
            md={md ? md : 12} 
            display={"flex"} 
            justifyContent={"center"} 
            alignItems={"center"}
        >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        value={dayjs(value)}
                        label={label}
                        onChange={(e) => onChange(e.$d)}
                        disablePast={disablePast}
                        minDate={minDate}
                        maxDate={maxDate}
                        disabled={disabled || (showEditButton && !editing)}
                    />
                </LocalizationProvider>
                {
                        showEditButton && 
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