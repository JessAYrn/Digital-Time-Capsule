import React, {useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import RenderNeuronValues from "./RenderNeuronValues";
import RenderNeuronContributions from "./RenderNeuronContributions";
import ButtonField from "../../../../components/Button";
import { BACKGROUND_COLOR, CONTRAST_COLOR, DIVIDER_SX, WHITE_COLOR } from "../../../../Theme";
import CreateProposalForm from "../../../../proposals/CreateProposalForm";
import { Typography, Divider } from "@mui/material";
import { AppContext } from "../../../../Context";
import { PROPOSAL_ACTIONS } from "../../../../proposals/utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const RenderNeuron = (props) => {

    const { neuronId, neuronData } = props;

    const { contributions, neuronInfo } = neuronData;

    const { setModalIsOpen, setModalProps } = useContext(AppContext);

    const openProposalForm = ({proposalAction, proposalPayload }) => {
        setModalIsOpen(true);
        setModalProps({
            headerComponent: <Typography variant="h6" color={WHITE_COLOR}>Create Proposal</Typography>,
            fullScreen: true,
            components: [
                <CreateProposalForm proposalAction={proposalAction} proposalPayload={proposalPayload}/>
            ],
            handleReturn: () => {
                setModalProps({
                    headerComponent: <ButtonField transparentBorder={true} Icon={ContentCopyIcon} transparentBackground={true} text={neuronId} onClick={() => copyText(neuronId)} />,
                    fullScreen: true,
                    components: [<RenderNeuron neuronId={neuronId} neuronData={neuronData}/>]
                })
            }
        });
    };

    return (
        <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} xs={12} flexDirection={"column"} padding={0} marginBottom={"50px"}>

            <RenderNeuronValues neuronId={neuronId} neuronData={neuronData} openProposalForm={openProposalForm}/>
            <Divider sx={{...DIVIDER_SX, marginTop: "60px", marginBottom: "60px"}}/>
            <RenderNeuronContributions contributions={contributions}/>

            { !!neuronInfo && <Grid xs={12} width={"100%"} padding={0} display={"flex"} justifyContent={"center"} alignItems={"center"} position={"fixed"} bottom={0} maxWidth={"700px"}>
                    <ButtonField
                        gridSx={{ backgroundColor: CONTRAST_COLOR, margin: "2.5%", width: "40%"}}
                        color={BACKGROUND_COLOR}
                        text={"Stake"} 
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.IncreaseNeuron,
                            proposalPayload: {neuronId}
                        })}
                    />
                    <ButtonField
                    gridSx={{ margin: "2.5%", width: "40%", backgroundColor: CONTRAST_COLOR}}
                    text={"Spawn Rewards"} 
                    sx={{fontSize: "8px"}}
                    color={BACKGROUND_COLOR}
                    onClick={() => openProposalForm({
                        proposalAction: PROPOSAL_ACTIONS.SpawnNeuron,
                        proposalPayload: {neuronId}
                    })}
                    />
            </Grid>}
        </Grid>
    );

};

export default RenderNeuron;