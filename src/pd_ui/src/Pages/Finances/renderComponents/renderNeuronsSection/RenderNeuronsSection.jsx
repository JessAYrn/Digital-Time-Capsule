import React, { useContext, useMemo } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import CarouselComponent from "../../../../components/Carousel";
import DataField from "../../../../components/DataField";
import { CONTRAST_COLOR } from "../../../../Theme";
import Typography from "@mui/material/Typography";
import RenderPreviewNeuron from "./RenderPreviewNeuron";
import { AppContext } from "../../../../Context";
import RenderInactiveNeuronsList from "./RenderInactiveNeuronsList";
import CreateProposalForm from "../../../../proposals/CreateProposalForm";
import { PROPOSAL_ACTIONS } from "../../../../proposals/utils";
import ButtonField from "../../../../components/Button";
import { BACKGROUND_COLOR } from "../../../../Theme";

const RenderNeuronsSection = (props) => {

    const { treasuryState, setModalIsOpen, setModalProps } = useContext(AppContext);
        
    const { activeNeurons, inactiveNeurons} = useMemo(() => {
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

    const onCreateNeuron = () => {
        setModalIsOpen(true);
        setModalProps({ 
            headerComponent: <Typography variant="h6">Create Proposal</Typography>,
            fullScreen: true,
            components: [ 
                <CreateProposalForm proposalAction={PROPOSAL_ACTIONS.CreateNeuron} proposalPayload={{}}/>
            ] 
        });
    };

    const RenderEmptyNeurons = () => {
        return (
            <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} padding={0} flexDirection={"column"} paddingTop={"20px"}>
                <Typography textAlign={"center"} >
                    {"There are currently no neurons staked in this treasury. Neurons are used to stake ICP which allows this DAO to earn rewards and participate in the governance of the ICP blockchain."}
                    </Typography>
                <ButtonField gridSx={{backgroundColor: CONTRAST_COLOR, marginTop: "20px"}} color={BACKGROUND_COLOR} text={"Create Neuron"} onClick={onCreateNeuron}/>
            </Grid>
        )
    }

    return (
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} padding={0} flexDirection={"column"}>
            <CarouselComponent 
                title={"Neurons"} 
                defaultComponent={<RenderEmptyNeurons/>}
            >
                { activeNeurons.map(([neuronId, neuronData]) => { return (<RenderPreviewNeuron neuronData={neuronData} neuronId={neuronId}/>); }) }
            </CarouselComponent>

            <DataField buttonColor={CONTRAST_COLOR} label={"Inactive Neurons"} text={"view"} onClick={onViewInactiveNeurons}/>
        </Grid>
    )
}

export default RenderNeuronsSection;