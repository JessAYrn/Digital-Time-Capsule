import React, {useContext} from "react";
import {Paper} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import ButtonField from "../../Components/Fields/Button";
import DataField from "../../Components/Fields/DataField";
import { fromE8s, round2Decimals, milisecondsToNanoSeconds, shortenString } from "../../functionsAndConstants/Utils";
import { AppContext } from "../../Context";
import { getProposalType } from "./utils";

const PreviewProposal = (props) => {
    const {proposal, onViewProposal } = props;
    const {setModalProps, setModalIsOpen, homePageState} = useContext(AppContext)

    const [proposalIdAsBigInt, proposalData] = proposal;
    const proposalId = parseInt(proposalIdAsBigInt);
    const {proposer, action, timeVotingPeriodEnds, voteTally} = proposalData;

    const timeRemainingInHours = (parseInt(timeVotingPeriodEnds) - milisecondsToNanoSeconds(Date.now())) / 3600000000000;
    const actionType = getProposalType(action);
    let {totalParticipated} = voteTally;


    return (
        <Paper sx={{ width: "100%", height: "300px", display:"flex", justifyContent:"center", alignItems:"center", flexDirection:"column", paddingBottom: "10px"} }>
            <Grid width={"95%"} paddingBottom={"15px"} paddingTop={0}>
                <DataField
                    label={`ID: `}
                    text={proposalId}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    buttonSx={{fontSize: "13px"}}
                    transparentBackground={true}
                />
                <DataField
                    label={`Type: `}
                    text={shortenString(actionType, 10)}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    onClick={() => {}}
                    transparentBackground={true}
                />
                <DataField
                    label={`proposer: `}
                    text={shortenString(homePageState?.canisterData?.userNames[proposer], 10)}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    onClick={() => {}}
                    transparentBackground={true}
                />
                <DataField
                    label={`Participation: `}
                    text={round2Decimals(fromE8s(parseInt(totalParticipated)))}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    onClick={() => {}}
                    transparentBackground={true}
                />
                <DataField
                    label={`Concludes in: `}
                    text={`${round2Decimals(timeRemainingInHours)} hours`}
                    buttonColor="primary"
                    labelColor="primary"
                    disabled={true}
                    onClick={() => {}}
                    transparentBackground={true}
                />
            </Grid>
            <ButtonField
                color={"primary"}
                elevation={24}
                text={"View Proposal"}
                onClick={onViewProposal}
                iconSize={'small'}
            />
        </Paper>
    )
};

export default PreviewProposal;