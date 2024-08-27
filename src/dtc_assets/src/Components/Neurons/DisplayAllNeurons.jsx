import React, {useContext} from "react";
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";
import DisplayNeuron from "./DisplayNeuron";
import AccordionField from "../Fields/Accordion";
import { fromE8s, round2Decimals } from "../../functionsAndConstants/Utils";


const DisplayAllNeurons = (props) => {

    const { treasuryState } = useContext(AppContext);
    const { neurons, userPrincipal } = treasuryState;

    return (
            neurons?.icp && neurons?.icp?.length > 0 ?
            <Grid width={"100%"} xs={12} display={'flex'} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
              <Typography variant="h6" >Neurons:</Typography>
              <AccordionField>
                {
                  neurons?.icp.map(neuron => {
                    let subtitle = neuron[1]?.neuronInfo?.stake_e8s ? `${round2Decimals(fromE8s(parseInt(neuron[1].neuronInfo.stake_e8s)))} ICP` : "Retrieving...";
                    return (
                      <div 
                      title={`${neuron[0]}`}
                      subtitle={subtitle}
                      CustomComponent={DisplayNeuron} 
                      neuronData={neuron}
                      userPrincipal={userPrincipal}
                      ></div> 
                    )
                  })
                }
              </AccordionField>
            </Grid> : <></>
    )

};
export default DisplayAllNeurons;