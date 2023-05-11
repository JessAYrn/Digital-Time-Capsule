import React, { useState } from 'react'
import './Dropdown.scss'


const Dropdown = (props) => {
  const { 
    options, 
    changeHandler
  } = props; 

  const[open,setOpen]=useState(false);

  const DropdownItem = (option) => {
    const {text, icon} = option;

    

    return (
      <>
        <div className={'dropdownItem'} onClick={() => changeHandler(option)}>
          {/* <span className={'dropdownItemIcon'}>{icon}</span> */}
          
          {/* <img src={icon} alt=''/> */}
          <p>{text}</p>
        </div>
      <br/>
      </>
    );
  };

  return (
    <div className={"dropdown"}>
      <img
      className={open?'open':''}
      onClick={()=>setOpen(!open)}
      src='https://t3.ftcdn.net/jpg/04/83/39/12/360_F_483391217_rDo0Gdjp71zXabPRjeaE1O3I85R6nIgB.jpg' alt='dropdown'/>
      {open && <div className={'dropdown_container'}>
      {options.map(option => {
        return DropdownItem(option)
      })}
      </div>}
    </div>
  );
}

export default Dropdown;

