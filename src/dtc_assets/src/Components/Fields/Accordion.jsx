import React, {useMemo} from 'react'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './Accordion.scss';
import { useMemo } from 'react';

const AccordionField = (props_) => {
    const {children} = props_;
    const elements = useMemo(() => { return children.length ? children : [children]}, [props_.children]);
    
  return (
    <div className='accordianField_containter'>
        {elements.map((child) => {
            const props = child.props;
            const {title, TitleComponent,  text, TextComponent, image, CustomComponent } = props;
            return (
                <Accordion className='accordianField'>
                    <div className='title '>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            {title && <TitleComponent color={'white'}>{title}</TitleComponent>}
                        </AccordionSummary>
                    </div>
                    <AccordionDetails>
                        {text && <TextComponent>{text}</TextComponent>}
                        {image && <img src={image}/>}
                        {CustomComponent && <CustomComponent {...props}/>}
                    </AccordionDetails>
                </Accordion>
            )}
        )}
    </div>
  );
}

export default AccordionField;