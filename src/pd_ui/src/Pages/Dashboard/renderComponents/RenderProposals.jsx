import React, {useContext} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import CarouselComponent from '../../../components/Carousel';
import DataField from '../../../components/DataField';
import Typography  from "@mui/material/Typography";
import PreviewProposal from '../../../proposals/PreviewProposal';
import DisplayProposal from '../../../proposals/DisplayProposal';
import { shortenString } from "../../../functionsAndConstants/Utils";
import { AppContext } from "../../../Context";
import { Divider } from "@mui/material";
import { DIVIDER_SX, CONTRAST_COLOR } from "../../../Theme";



const RenderProposals = () => {

    const { setModalIsOpen, setModalProps, homePageState } = useContext(AppContext);

    let activeProposals = homePageState?.canisterData?.proposals?.filter(proposal => !proposal[1].finalized);
    let inactiveProposals = homePageState?.canisterData?.proposals?.filter(proposal => proposal[1].finalized);

    const viewProposal = (proposal, returnToInactiveProposals = false) => {
        setModalProps({
            headerComponent: <Typography variant="h6">Proposal: {parseInt(proposal[0])}</Typography>,
            fullScreen: true,
            components:[
                <DisplayProposal proposal={proposal}/>
            ],
            handleReturn: returnToInactiveProposals ? viewInactiveProposalsList : null
        });
        setModalIsOpen(true)
    }

    const RenderInactiveProposals = () => {
        
        return (
            <Grid xs={12} display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} flexDirection={"column"}>
                {inactiveProposals.map(([proposalId, proposal]) => {
                        const actionType = Object.keys(proposal.action)[0];
                        return (
                            <>
                            <DataField 
                                label={`#${proposalId} ${shortenString(actionType, 10)}`} 
                                text={'Details'} 
                                onClick={ () => viewProposal([proposalId, proposal], true) }
                                buttonColor={CONTRAST_COLOR}
                            />
                            <Divider sx={{...DIVIDER_SX}} />
                            </>
                        )
                    })}
            </Grid>
        )
    };

    const viewInactiveProposalsList = () => {
        setModalProps({
            headerComponent: <Typography variant="h6">Inactive Proposals</Typography>,
            fullScreen: true,
            components:[
                <RenderInactiveProposals/>
            ]
        });
        setModalIsOpen(true)
    }



    return (
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection={"column"} padding={0}>

            <CarouselComponent 
                title={"Proposals"} 
                defaultComponent={<Typography textAlign={"center"} component={"There are currently no active proposals"} />} 
                sx={{padding: "0px"}}
            >
                {activeProposals.map((proposal) => { return <PreviewProposal proposal={proposal} onViewProposal={() => viewProposal(proposal, false)} /> })}
            </CarouselComponent>

            <DataField 
                gridSx={{marginTop: "20px"}}
                label={"Inactive Proposals"} 
                text={"View"}
                onClick={ () => viewInactiveProposalsList() }
                color={CONTRAST_COLOR}
                buttonColor={CONTRAST_COLOR}
            />
        </Grid>
    )

};

export default RenderProposals