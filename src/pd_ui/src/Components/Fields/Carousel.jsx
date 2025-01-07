import React from 'react';
import { Typography, Paper } from '@mui/material';
import Carousel from 'react-material-ui-carousel'

const CarouselComponent = (props) => {
    const { children, defaultComponent, title, sx } = props;
    return (
        <Paper 
        sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            ...sx
        }}
        >
            <Typography variant="h6" marginTop={"10px"}>{title}</Typography>
                <Carousel sx={{width: "100%", height:"auto"}} autoPlay={false}>
                    { !!children.length ? children : defaultComponent }
                </Carousel>
                <Typography variant="h6" marginTop={"10px"}></Typography>            
        </Paper>
    )
};

export default CarouselComponent;

