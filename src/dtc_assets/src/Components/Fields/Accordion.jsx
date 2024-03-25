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
            const {title, subtitle, texts, image, CustomComponent } = props;
            return (
                <Accordion className='accordianField'>
                    <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} columns={12} width={"100%"} padding={0}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                            sx={{width: '100%'}}
                        >
                            {title && <Grid display={"flex"} justifyContent={"left"} alignItems={"center"} paddingBottom={0} xs={subtitle? 8 : 12} width={"100%"} padding={0}>
                                <Typography color={'white'}>{title}</Typography>
                            </Grid>}
                            {subtitle && <Grid display={"flex"} justifyContent={"right"} alignItems={"center"} paddingBottom={0} xs={4} width={"100%"} padding={0}>
                                <Typography color={"#bdbdbd"}>{subtitle}</Typography>
                            </Grid>}
                        </AccordionSummary>
                    </Grid>
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