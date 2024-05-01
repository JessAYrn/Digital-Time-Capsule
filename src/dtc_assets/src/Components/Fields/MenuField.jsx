import React, {useState} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ButtonField from '../Fields/Button';

const MenuField = (props) => {
    const {
        isLoading,
        menuItemProps,
        xs,
        md,
        display,
        justifyContent,
        alignItems,
        sx,
        disabled,
        MenuIcon,
        label,
        color,
        selected
    } = props;

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return(
        <Grid xs={xs} md={md} display={display} justifyContent={justifyContent} alignItems={alignItems} padding={0} sx={sx}>
            <ButtonField
                isLoading={isLoading}
                transparentBackground={true}
                id="basic-button"
                disabled={disabled}
                ariaControls={open ? 'basic-menu' : undefined}
                ariaHaspopup="true"
                ariaExpanded={open ? 'true' : undefined}
                onClick={handleClick}
                Icon={MenuIcon}
                text={label}
                color={color}
            />
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                autoFocus={true}
                onClose={handleClose}
                MenuListProps={{
                'aria-labelledby': 'basic-button',
                }}
            >
                { menuItemProps.map( 
                    ({onClick, text}) => { 
                    return( 
                    <MenuItem 
                    selected={text === selected ? true: false }
                    onClick={ (e) => { onClick(e); handleClose(e); }}
                    > {text} </MenuItem> )
                })}
            </Menu>
        </Grid>
    )
};

export default MenuField;