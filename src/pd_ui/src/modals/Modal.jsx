import React from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { Box, Dialog, Slide, IconButton, LinearProgress, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Typography from '@mui/material/Typography';
import { BACKGROUND_COLOR, DIVIDER_SX } from '../Theme';
import ButtonField from '../components/Button';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ModalComponent = (props) => {
  const { open, handleClose, handleReturn, components, flexDirection, fullScreen, headerComponent } = props
  return (
      <Dialog 
      fullScreen={fullScreen}
      open={open} 
      onClose={handleClose} 
      TransitionComponent={Transition}
      > 
        {fullScreen && 
        <Grid 
        position={"fixed"}
        top={"auto"}
        backgroundColor={BACKGROUND_COLOR}
        height={"50px"}
        display={"flex"}
        justifyContent={"left"}
        alignItems={"center"}
        width={"100%"}
        paddingLeft={"10px"}
        paddingRight={"10px"}
        zIndex={"1"}
        borderBottom={`solid ${DIVIDER_SX.borderColor}`}
        >
            <IconButton
              edge="start"
              color="primary"
              onClick={handleReturn ? handleReturn : handleClose}
              aria-label="close"
            >
                {handleReturn ? <ArrowBackIosNewIcon /> : <CloseIcon />}
            </IconButton>

            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"}>
              {headerComponent}
            </Grid>

            <IconButton
              edge="start"
              color={BACKGROUND_COLOR}
              onClick={handleReturn ? handleReturn : handleClose}
              aria-label="close"
            >
                {handleReturn ? <ArrowBackIosNewIcon /> : <CloseIcon />}
            </IconButton>
        </Grid>}
        {components &&
          <Grid marginTop={fullScreen ? "60px": ""} border={fullScreen? "" : "solid grey "} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} flexDirection={flexDirection} padding={"10px"}>
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