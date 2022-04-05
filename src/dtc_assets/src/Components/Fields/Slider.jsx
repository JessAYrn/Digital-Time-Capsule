import React, {useRef, useState} from 'react';
import "./Slider.scss";

const Slider = (props) => {
    const {
        min,
        max,
        dispatch,
        dispatchAction,
        disabled,
        index,
        setChangesWereMade,
        value
    } = props;

    const inputRef = useRef();

    const [sliderValue, setSliderValue] = useState(value);
    const [disabledOrEnabled, setDisabledOrEnabled] = useState('disabled');

    const onBlur = () => {
        setDisabledOrEnabled("disabled");


    };

    const onChange = () =>{
        if(setChangesWereMade){
            setChangesWereMade(true);
        };
        setSliderValue(inputRef.current.value);
        dispatch({
            payload: inputRef.current.value,
            actionType: dispatchAction,
            index: index
        })
    };

    const onFocus = () => {
        setDisabledOrEnabled("enabled");
        
    };
    


    return(
        <div className={"sliderDiv"} >
            <div className={"sliderLabelDiv__"+disabledOrEnabled}>
                <label className={"sliderLabel"}> 
                    {` Lock Journal For ${(sliderValue || sliderValue === 0) ? sliderValue : "3"} Months`}
                </label>
            </div>
            <div className={"sliderInputDiv"}>
                <input 
                    disabled={disabled}
                    type="range" 
                    min={min} 
                    max={max} 
                    className="slider" 
                    value={(sliderValue || sliderValue === 0) ? sliderValue : "3"} 
                    id="myRange" ref={inputRef}  
                    onBlur={onBlur} 
                    onFocus={onFocus}
                    onChange={onChange}/>
            </div>
        </div>
    )
};

export default Slider;