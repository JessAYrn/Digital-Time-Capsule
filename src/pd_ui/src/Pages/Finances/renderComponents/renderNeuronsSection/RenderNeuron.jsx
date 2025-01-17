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

    const { contributions } = neuronData;

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

            <Grid xs={12} width={"100%"} padding={0} display={"flex"} justifyContent={"center"} alignItems={"center"} position={"fixed"} bottom={"10px"}>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={6} padding={0} >
                    <ButtonField
                        gridSx={{padding: "0px", backgroundColor: CONTRAST_COLOR, width: "170px", height: "44px"}}
                        buttonGridSx={{width: "135px"}}
                        color={BACKGROUND_COLOR}
                        text={"Stake"} 
                        onClick={() => openProposalForm({
                            proposalAction: PROPOSAL_ACTIONS.IncreaseNeuron,
                            proposalPayload: {neuronId}
                        })}
                    />
                </Grid>
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} xs={6} padding={0}>
                    <ButtonField
                    gridSx={{padding: "0px", backgroundColor: CONTRAST_COLOR, width: "170px", height: "44px"}}
                    buttonGridSx={{width: "135px"}}
                    text={"Spawn Rewards"} 
                    color={BACKGROUND_COLOR}
                    onClick={() => openProposalForm({
                        proposalAction: PROPOSAL_ACTIONS.SpawnNeuron,
                        proposalPayload: {neuronId}
                    })}
                    />
                </Grid>
            </Grid>
        </Grid>
    );

};

export default RenderNeuron;