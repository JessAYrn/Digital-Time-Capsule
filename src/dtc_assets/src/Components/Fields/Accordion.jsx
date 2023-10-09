import React, {useMemo} from 'react'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './Accordion.scss';
import { useMemo } from 'react';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';

const AccordionField = (props_) => {
    const {children} = props_;
    const elements = useMemo(() => { return children.length ? children : [children]}, [props_.children]);
  return (
    <div className='accordianField_containter'>
        {elements.map((child) => {
            const {props} = child;
            const {title, texts, image, CustomComponent } = props;
            return (
                <Accordion className='accordianField'>
                    <div className='title '>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            {title && <Typography color={'white'}>{title}</Typography>}
                        </AccordionSummary>
                    </div>
                    <AccordionDetails>
                        {texts && 
                            <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
                                {texts.map((text) => {
                                    return (
                                        <Grid display={"flex"} justifyContent={"left"} alignItems={"center"} paddingBottom={0}>
                                            <Typography>{text}</Typography>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        }
                        {image && <img src={image} className='accordianImage'/>}
                        {CustomComponent && <CustomComponent {...props}/>}
                    </AccordionDetails>
                </Accordion>
            )}
        )}
    </div>
  );
}

export default AccordionField;