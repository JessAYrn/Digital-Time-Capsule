import React from 'react'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './Accordion.scss';

const AccordionField = (props) => {
    const {content} = props;
    
  return (
    <div className='accordianField_containter'>
        {content.map((content_) => {
            const {title, Component, text, image} = content_;
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
                        {text && <Typography>{text}</Typography>}
                        {Component && <Component/>}
                        {image && <img src={image}/>}
                    </AccordionDetails>
                </Accordion>
            )}
        )}
    </div>
  );
}

export default AccordionField;