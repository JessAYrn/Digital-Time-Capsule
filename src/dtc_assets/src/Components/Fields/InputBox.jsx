import React, {useState} from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import PropTypes from 'prop-types';
import { NumericFormat } from 'react-number-format';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTheme, ThemeProvider } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import ButtonField from './Button';
import { INPUT_BOX_FORMATS } from '../../functionsAndConstants/Constants';
  
  const NumericFormatCustom = React.forwardRef(function NumericFormatCustom(
    props,
    ref,
  ) {
    const { onChange, prefix, ...other } = props;
  
    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value,
            },
          });
        }}
        thousandSeparator
        valueIsNumericString
        prefix={""}
      />
    );
  });
  
  NumericFormatCustom.propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  };



const InputBox = (props) => {

    const [values, setValues] = useState({});
    
    const handleChange = (event) => {
    setValues({
        ...values,
        [event.target.name]: event.target.value,
    });
    if(dispatch) dispatch({
        actionType: dispatchAction,
        payload: event.target.value,
        index: index
    });
    if(onChange) onChange(event.target.value);
    };
    

    const [editing, setEditing] = useState(false);

    const {
        label,
        maxLength,
        placeHolder,
        rows,
        disabled,
        editable,
        dispatchAction,
        dispatch,
        index,
        onBlur,
        onChange,
        value,
        hasError,
        format
    } = props;

    let inputComponent;
    if(format === INPUT_BOX_FORMATS.numberFormat) inputComponent = NumericFormatCustom;

    const onChange_editButton = () => {
        setEditing(!editing);
    };

    const theme = useTheme();

    let EditIcon_;
    if(editing) EditIcon_ = UploadIcon;
    else if(!editing) EditIcon_ = EditIcon;

    return(

      <Grid 
        columns={12} 
        xs={12} 
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
          <Stack direction="row" spacing={2}>
            <TextField
            columns={12} 
            xs={12} 
            width={"100%"}
            color='white'
            label={label}       
            value={values[format]}
            onChange={handleChange}
            placeholder={placeHolder}
            name={format}
            id={`formatted-${format}-input`}
            InputProps={{inputComponent}}
            disabled={(editable && !editing) || disabled}
            variant="standard"
            multiline
            maxRows={rows ? rows : 100}
            fullWidth
            />
          </Stack>
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
            disabled={(editable && !editing) || disabled}
            onChange={handleChange}
            id="filled-multiline-flexible"
            label={label}
            multiline
            maxRows={rows ? rows : 100}
            variant="filled"
            fullWidth
          />
        }
        {editable && 
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