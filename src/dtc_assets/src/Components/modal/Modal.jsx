import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import "./Modal.scss";
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { ConnectButton, ConnectDialog, useConnect} from "@connect2ic/react";
import ButtonField from '../Fields/Button';
import { Typography } from '@mui/material';
import PendingIcon from '@mui/icons-material/Pending';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

const ModalComponent = (props_) => {
    const {
      open, 
      handleClose, 
      bigText, 
      smallText, 
      Icon, 
      components, 
      isLoading, 
      imageSrc, 
      displayConnectButton
    } = props_

    let isOpen = useMemo(() => {return open}, [open]);
    
    useConnect({ onConnect: () => {}, onDisconnect: () => {
      isOpen = false;
        document.location.reload();
      }
  });
  
  return (
      <Modal
        open={isOpen}
        onClose={isLoading ? () => {} : handleClose}
        aria-labelledby="parent-modal-title"
        aria-describedby="parent-modal-description"
      >
        <Box sx={{ ...style, width: 400 }} className={`modalBox ${isLoading ? 'transparent' : ''}`}>
          {bigText && !isLoading && <Typography varient={"h2"} id="parent-modal-title">{bigText}</Typography>}
          {Icon && !isLoading &&  <Icon style={{height: "75px", width:"75px" }}/>}
          {smallText && !isLoading && <Typography varient={"body1"} id="parent-modal-description">{smallText}</Typography>}
          {imageSrc && !isLoading && <img className='modalImg' src={imageSrc} alt='Wrong src'/>}
          {isLoading && 
          <ButtonField 
            transparentBackground={true}
            isLoading={true}
            onClick={() => {}}
            Icon={PendingIcon}
            iconSize={'large'}
            disabled={true}
          />}
          {
            components && !isLoading &&
            <Grid display={"flex"} justifyContent={"center"} alignItems={"center"}>
                {components.map(component => {
                    const {Component, props} = component
                    return <Component {...props} className={"modalChildCompoent"}/>
                })}
                </Grid>
            }
            {
              displayConnectButton && 
              <>
                <ConnectButton/>
                <ConnectDialog />
              </>
            }
        </Box>
      </Modal>
  );
};

export default ModalComponent;