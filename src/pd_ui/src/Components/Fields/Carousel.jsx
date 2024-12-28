import React from 'react';
import Carousel from 'react-material-ui-carousel'

const CarouselComponent = (props) => {
    const { components } = props;
    return (
        <Carousel sx={{width: "100%", height:"auto"}}>
            {components?.map(component_ => {return component_})}
        </Carousel>
    )
};

export default CarouselComponent;

