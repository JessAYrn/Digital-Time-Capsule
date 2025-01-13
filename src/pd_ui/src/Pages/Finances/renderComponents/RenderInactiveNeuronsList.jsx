import React, { useContext } from "react";
import DataField from "../../../components/DataField";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { AppContext } from "../../../Context";
import RenderNeuron from "./RenderNeuron";
import ButtonField from "../../../components/Button";
import { copyText } from "../../../functionsAndConstants/Utils";
import { CONTRAST_COLOR } from "../../../Theme";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const RenderInactiveNeuronsList = (props) => {

    const {inactiveNeurons} = props;

    const { setModalProps, setModalIsOpen } = useContext(AppContext);

    const onViewInactiveNeuron = (neuronId, neuronData) => {
        setModalProps({
            fullScreen: true,
            headerComponent: <ButtonField transparentBorder={true} transparentBackground={true} Icon={ContentCopyIcon} text={neuronId} onClick={() => copyText(neuronId)} />,
            components:[
                <RenderNeuron neuronData={neuronData} neuronId={neuronId}/>
            ],
            handleReturn: () => {
                setModalProps({
                    fullScreen: true,
                    headerComponent: <Typography variant="h6">Inactive Neurons</Typography>,
                    components: [<RenderInactiveNeuronsList inactiveNeurons={inactiveNeurons}/>],
                });
            }
        });
        setModalIsOpen(true)
    }

    return (
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"} padding={0}>
            {inactiveNeurons.map(([neuronId, neuronData]) => {
                return <DataField buttonColor={CONTRAST_COLOR} label={neuronId} text={"details"} onClick={() => onViewInactiveNeuron(neuronId, neuronData)}/>
            })}
        </Grid>
    )
}

export default RenderInactiveNeuronsList;