import React from "react";
import ActionButtons from "./ActionButtons";
import NavBar from "./NavBar";
import ToolBar from "./ToolBar";
import { useScroll, useSpring } from "@react-spring/web";
import Grid from "@mui/material/Unstable_Grid2";

const PersistedComponents = (props) => {

    const coordinates = { x:0, y:0 };

    const show = () => { 
        style1Api.start({opacity: 1});
        style2Api.start({top: 0});
    };
    
    const hide = () => { 
        style1Api.start({opacity: 0.25}) 
        style2Api.start({top: 100});
    };

    const [style1, style1Api] = useSpring(() => ({ from: { opacity: 1 } }), []);
    const [style2, style2Api] = useSpring(() => ({ from: { top: 0 } }), []);

    useScroll({
        onChange: ({value: {scrollY}}) => {
            if(coordinates.y > scrollY) show();
            if(coordinates.y < scrollY) hide();
            coordinates.y = scrollY
        }
    });

    return (
        <>
            <ToolBar style={style1}/>
            <Grid zIndex={10} position={"fixed"} bottom={0} xs={12} width={"100%"} height={"81px"} padding={0} >
                <ActionButtons style={style2}/> 
                <NavBar style={style1}/>
            </Grid>
        </>
    )
};

export default PersistedComponents;