import React from 'react'

const Dropdown = (props) => {
  const { 
    options, 
    changeHandler
  } = props; 

  const DropdownItem = (option) => {
    const {text, icon} = option;

    return (
      <>
        <a className={'dropdownItem'} onClick={() => changeHandler(option)}>
          {/* <span className={'dropdownItemIcon'}>{icon}</span> */}
          {text}
        </a>
      <br/>
      </>
    );
  };

  return (
    <div className={"dropdown"}>
      {options.map(option => {
        return DropdownItem(option)
      })}
    </div>
  );
}

export default Dropdown