import React from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { Box, Dialog, Slide, AppBar, Toolbar, IconButton, LinearProgress, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ModalComponent = (props) => {
  const { open, handleClose, components, flexDirection, fullScreen } = props
  return (
      <Dialog 
      fullScreen={fullScreen}
      open={open} 
      onClose={handleClose} 
      TransitionComponent={Transition}
      > 
        {fullScreen && 
        <AppBar sx={{ position: 'fixed'}}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>}
        {components &&
          <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} flexDirection={flexDirection} padding={"10px"}>
              {components.map(component => { return component })}
          </Grid>}
      </Dialog>
  );
};

const style = {
  position: 'absolute',
  backgroundColor:"transparent",
  width: "275px",
  maxHeight: "500px",
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

export const LoadingModal = (props) => {
  const {open} = props;
  return(
    <Modal open={open}>
      <Box sx={style}>
        <LinearProgress color='secondary'/>
      </Box>
    </Modal>
  )
};

export default ModalComponent;