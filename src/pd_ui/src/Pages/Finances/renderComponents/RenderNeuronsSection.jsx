import React, { useContext, useMemo } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import CarouselComponent from "../../../components/Carousel";
import DataField from "../../../components/DataField";
import { CONTRAST_COLOR } from "../../../Theme";
import Typography from "@mui/material/Typography";
import RenderPreviewNeuron from "./RenderPreviewNeuron";
import { AppContext } from "../../../Context";
import RenderInactiveNeuronsList from "./RenderInactiveNeuronsList";
const RenderNeuronsSection = (props) => {

    const { treasuryState, setModalIsOpen, setModalProps } = useContext(AppContext);
        
    const {activeNeurons, inactiveNeurons} = useMemo(() => {
        const activeNeurons = [];
        const inactiveNeurons = [];
        for (const [neuronId, neuronData] of treasuryState?.neurons?.icp) {
            if(!!neuronData?.neuronInfo) activeNeurons.push([neuronId, neuronData]); else inactiveNeurons.push([neuronId, neuronData]);
        }
        return { activeNeurons, inactiveNeurons };
    }, [treasuryState?.neurons]);

    const onViewInactiveNeurons = () => {
        setModalIsOpen(true);
        setModalProps({
            fullScreen: true,
            headerComponent: <Typography variant="h6">Inactive Neurons</Typography>,
            components: [<RenderInactiveNeuronsList inactiveNeurons={inactiveNeurons}/>],
        });
    }

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={0} flexDirection={"column"}>
            <CarouselComponent 
                title={"Neurons"} 
                defaultComponent={<Typography textAlign={"center"} component={"There are currently no neurons staked in this treasury"} />}
            >
                { activeNeurons.map(([neuronId, neuronData]) => { return (<RenderPreviewNeuron neuronData={neuronData} neuronId={neuronId}/>); }) }
            </CarouselComponent>

            <DataField buttonColor={CONTRAST_COLOR} label={"Inactive Neurons"} text={"view"} onClick={onViewInactiveNeurons}/>
        </Grid>
    )
}

export default RenderNeuronsSection;