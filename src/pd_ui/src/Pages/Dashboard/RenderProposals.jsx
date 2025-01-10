import React, {useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import CarouselComponent from '../../Components/Fields/Carousel';
import AccordionField from '../../Components/Fields/Accordion'
import DataField from '../../Components/Fields/DataField';
import Typography  from "@mui/material/Typography";
import PreviewProposal from '../../modalPages/proposals/PreviewProposal';
import DisplayProposal from '../../modalPages/proposals/DisplayProposal';
import { shortenString } from "../../functionsAndConstants/Utils";
import { AppContext } from "../../Context";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';



const RenderProposals = () => {

    const { setModalIsOpen, setModalProps, homePageState } = useContext(AppContext);

    let activeProposals = homePageState?.canisterData?.proposals?.filter(proposal => !proposal[1].finalized);
    let inactiveProposals = homePageState?.canisterData?.proposals?.filter(proposal => proposal[1].finalized);


    const viewProposal = (proposal) => {
        setModalProps({
            fullScreen: true,
            components:[
                <DisplayProposal proposal={proposal}/>
            ]
        });
        setModalIsOpen(true)
    }


    return (
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"} padding={0}>

            <CarouselComponent 
                title={"Active Proposals"} 
                defaultComponent={<Typography textAlign={"center"} component={"There are currently no active proposals"} />} 
            >
                {activeProposals.map((proposal) => { return <PreviewProposal proposal={proposal} onViewProposal={() => viewProposal(proposal)} /> })}
            </CarouselComponent>

            <AccordionField 
                sx={{padding: "0px", marginBottom:"5px", marginTop:"5px"}} 
                title={"Inactive Proposals"} 
                defaultComponent={<Typography textAlign={"center"} component={"There are currently no proposals"} />} 
            >
                {inactiveProposals.map(([proposalId, proposal]) => {
                    const actionType = Object.keys(proposal.action)[0];
                    return <DataField 
                        label={`#${proposalId} ${shortenString(actionType, 10)}`} 
                        text={'view'} 
                        buttonIcon={proposal.executed ? ThumbUpIcon : ThumbDownIcon} 
                        onClick={ () => viewProposal([proposalId, proposal]) }
                    />
                })}
            </AccordionField>

        </Grid>
    )

};

export default RenderProposals