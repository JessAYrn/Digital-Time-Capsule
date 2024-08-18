import React, {useState, useMemo} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { NumericFormat } from 'react-number-format';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import ButtonField from './Button';
import { INPUT_BOX_FORMATS } from '../../functionsAndConstants/Constants';

const NumericFormatCustom = (suffix, prefix, allowNegative, maxDecimalPlaces = 8) => {
  return React.forwardRef(function NumericFormatCustom( props_, ref) {
  return (
    <NumericFormat
      {...props_}
      getInputRef={ref}
      onKeyDown={() => {}}
      decimalScale={maxDecimalPlaces}
      thousandSeparator = {false}
      valueIsNumericString = {true}
      allowedDecimalSeparators={["."]}
      allowNegative={allowNegative}
      allowLeadingZeros={false}
      suffix={suffix}
      prefix={prefix}
    />
  );
})};
  
const InputBox = (props) => {

    const {
      label,
      placeHolder,
      rows,
      disabled,
      showEditButton,
      dispatchAction,
      dispatch,
      index,
      onChange,
      onDisableEdit,
      value,
      hasError,
      format,
      width,
      maxValue,
      omitMaxValueButton,
      maxDecimalPlaces,
      prefix, 
      allowNegative,
      suffix,
    } = props;
    
    const handleChange = (eventValue) => { 
      if(dispatch) dispatch({
          actionType: dispatchAction,
          payload: eventValue,
          index: index
      });
      if(onChange) onChange(eventValue);
    };

    const focusTextBox = () => {
      let textbox = document.getElementById("formatted-numberFormat-input-label");
      textbox.focus();
    };
    

    const [editing, setEditing] = useState(false);
    const onChange_editButton = () => {
        setEditing(!editing);
        if(onDisableEdit) onDisableEdit(!editing);
    };

    let NumericFormatCustom_ = useMemo(() => {
      return format == INPUT_BOX_FORMATS.numberFormat ?
      NumericFormatCustom(suffix, prefix, allowNegative, maxDecimalPlaces) : undefined
    }, []);

    let EditIcon_;
    if(editing) EditIcon_ = UploadIcon;
    else if(!editing) EditIcon_ = EditIcon;

    return(

      <Grid 
        columns={12} 
        xs={12} 
        width={width}
        display="flex" 
        justifyContent="left" 
        alignItems="center" 
        className="textField"
        marginTop={"25px"}
        marginBottom={"25px"}
        paddingTop={0}
        paddingBottom={0}
      >
        {format == INPUT_BOX_FORMATS.numberFormat && 
          <>
              <TextField
              columns={12} 
              xs={12} 
              error={hasError}
              width={"100%"}
              color='white'
              label={label}    
              value={value}   
              onChange={(e) => { handleChange(maxDecimalPlaces > 0 ? parseFloat(e.target.value) : parseInt(e.target.value)); }}
              placeholder={placeHolder}
              name={format}
              id={`formatted-${format}-input`}
              InputProps={{inputComponent: NumericFormatCustom_ }}
              disabled={(showEditButton && !editing) || disabled}
              variant="standard"
              multiline
              
              maxRows={rows ? rows : 100}
              fullWidth
              />
            {maxValue && !omitMaxValueButton &&
              <ButtonField
                sx={{marginLeft: "-8px"}}
                transparentBackground={true}
                elevation={0}
                text={"max"}
                onClick={() => { handleChange(maxValue); focusTextBox(); }}
                iconSize={'small'}
              />
            }
          </>
        }
        {(!format || format === INPUT_BOX_FORMATS.noFormat) &&
          <TextField
            columns={12} 
            xs={12} 
            error={hasError}
            width={"100%"}
            color='white'
            placeholder={placeHolder}
            value={value}
            disabled={(showEditButton && !editing) || disabled}
            onChange={(e) => handleChange(e.target.value)}
            id="filled-multiline-flexible"
            label={label}
            multiline
            maxRows={rows ? rows : 100}
            variant="filled"
            fullWidth
          />
        }
        {showEditButton && 
          <ButtonField
            className={"inputBox"}
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

export default InputBox;