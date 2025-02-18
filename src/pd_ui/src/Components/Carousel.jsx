import React from 'react';
import { Typography } from '@mui/material';
import Carousel from 'react-material-ui-carousel'
import { PAPER_COLOR } from '../Theme';
import Grid from '@mui/material/Unstable_Grid2';
const CarouselComponent = (props) => {
    const { children, defaultComponent, title, sx } = props;
    return (
        <Grid 
            xs={12}
            width={"100%"}
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"center"}
            alignItems={"center"}
            padding={"0px"}
            sx={{backgroundColor: PAPER_COLOR, ...sx}}
        >
            <Typography variant="h6" marginTop={"10px"}>{title}</Typography>
                <Carousel sx={{width: "100%", height:"auto"}} autoPlay={false}>
                    { !!children.length ? children : defaultComponent }
                </Carousel>
                <Typography variant="h6" marginTop={"10px"}></Typography>            
        </Grid>
    )
};

export default CarouselComponent;

