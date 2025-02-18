import React from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { NumericFormat } from 'react-number-format';
import TextField from '@mui/material/TextField';
import { INPUT_BOX_FORMATS } from '../functionsAndConstants/Constants';
  
const InputBox = (props) => {

    const {
      label,
      placeHolder,
      rows,
      disabled,
      onChange,
      value,
      hasError,
      format,
      width,
      maxDecimalPlaces,
      prefix, 
      allowNegative,
      suffix,
      ButtonComponent,
    } = props;

    const Field = format == INPUT_BOX_FORMATS.numberFormat ? NumericFormat : TextField;

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
        <Field
          columns={12} 
          xs={12} 
          error={hasError}
          width={"100%"}
          color='white'
          label={label}    
          value={value}   
          onChange={onChange}
          placeholder={placeHolder}
          disabled={disabled}
          variant="standard"
          multiline
          maxRows={rows ? rows : 100}
          fullWidth
          customInput={format == INPUT_BOX_FORMATS.numberFormat ? TextField : undefined}
          decimalScale={format == INPUT_BOX_FORMATS.numberFormat ? maxDecimalPlaces : undefined}
          thousandSeparator = {format == INPUT_BOX_FORMATS.numberFormat ? false : undefined}
          valueIsNumericString = {format == INPUT_BOX_FORMATS.numberFormat ? true : undefined}
          allowedDecimalSeparators={format == INPUT_BOX_FORMATS.numberFormat ? ["."] : undefined}
          allowNegative={format == INPUT_BOX_FORMATS.numberFormat ? allowNegative : undefined}
          allowLeadingZeros={format == INPUT_BOX_FORMATS.numberFormat ? false : undefined}
          suffix={format == INPUT_BOX_FORMATS.numberFormat ? suffix : undefined}
          prefix={format == INPUT_BOX_FORMATS.numberFormat ? prefix : undefined}
        /> 
        {!!ButtonComponent && ButtonComponent}
      </Grid>
    )
}; 

export default InputBox;