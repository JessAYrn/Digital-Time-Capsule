import { NavBar } from "../Components/navigation/NavBar";
import React, { useContext, useState } from 'react';
import { AppContext } from "../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { copyText } from "../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { fromE8s, shortenHexString, round2Decimals } from "../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ButtonField from "../Components/Fields/Button";
import Graph from "../Components/Fields/Chart";
import { CHART_TYPES, GRAPH_DATA_SETS, GRAPH_DISPLAY_LABELS } from "../functionsAndConstants/Constants";
import InfoToolTip from "../Components/Fields/InfoToolTip";
import DisplayAllFundingCampaigns from "../Components/fundingCampaign/DisplayAllFundingCampaigns";
import DisplayAllNeurons from "../Components/Neurons/DisplayAllNeurons";
import ActionButton from "../Components/ActionButton";
import AccordionField from "../Components/Fields/Accordion";
import Switch from "../Components/Fields/Switch";

const TreasuryPage = (props) => {
  
  const { treasuryState, actorState, setModalIsOpen, setModalIsLoading, setModalProps } = useContext(AppContext);
  const [autoContributeToLoans, setAutoContributeToLoans] = useState(treasuryState?.userTreasuryData?.automaticallyContributeToLoans);
  const [autoRepayLoans, setAutoRepayLoans] = useState(treasuryState?.userTreasuryData?.automaticallyRepayLoans);
  
  const activeFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === false} );
  const inactiveFundingCampaigns = treasuryState.fundingCampaigns.filter(([campaignId, {settled}]) => {return settled === true} );

  const onSwitchToggle = async (newAutoRepayLoansSetting, newAutoLoanContributionSetting) => {
    setModalIsOpen(true);
    setModalIsLoading(true);
    setAutoRepayLoans(newAutoRepayLoansSetting);
    setAutoContributeToLoans(newAutoLoanContributionSetting);
    await actorState.backendActor.updateAutomatedSettings({
      automaticallyContributeToLoans: [newAutoLoanContributionSetting],
      automaticallyRepayLoans: [newAutoRepayLoansSetting]
    });
    setModalIsOpen(false);
    setModalIsLoading(false);
  }; 

  const displayTreasuryAccountId = () => {
    setModalProps({
        flexDirection: "column",
        bigText: "Treasury ICP Account ID:",
        smallText: `${shortenHexString(treasuryState.daoIcpAccountId)}`,
        components: [
          {
            Component: ButtonField,
            props: {
              text: "Copy To Clipboard",
              onClick: () => copyText(treasuryState.daoIcpAccountId),
              iconSize: 'small',
              Icon: ContentCopyIcon,
            }
          },
          {
            Component: ButtonField,
            props: {
              text: "Close",
              onClick: () => setModalIsOpen(false),
              iconSize: 'small'
            }
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
  };

  const openTreasuryAccountIdModal = () => {  
    setModalIsOpen(true);
    setModalProps({
        flexDirection: "column",
        bigText: "Be Careful!",
        smallText: "Sending ICP directly to this account ID will result in no treasury contribution being recorded from your account. In other words, you're essentially donating to the treasury without receiving any credit. If you're not sure what you're doing, do NOT proceed.",
        Icon: WarningAmberIcon,
        components: [
          {
            Component: ButtonField,
            props: {
              text: "I understand, proceed",
              onClick: displayTreasuryAccountId,
              iconSize: 'small'
            }
          },
          {
            Component: ButtonField,
            props: {
              text: "Cancel",
              onClick: () => setModalIsOpen(false),
              iconSize: 'small'
            }
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
  };

  return (
    <Grid 
      container 
      columns={12} 
      xs={12} 
      rowSpacing={8} 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      flexDirection={"column"}
    > 
      <NavBar />
      <Grid 
        columns={12}
        xs={11}  
        md={9}
        rowSpacing={0} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        flexDirection={"column"}
        marginTop={"60px"}
      >
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"flex-start"} alignItems={"flex-start"}>
          <Grid xs={4}  width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"} flexDirection={"column"}>
            <Typography width={"100%"}>Liquid:</Typography>
              <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                <Typography variant="h6" color={"custom"}>
                  {`${round2Decimals(fromE8s(treasuryState.totalDeposits))}`} ICP
                </Typography>
                <InfoToolTip text="The sum of all ICP deposited into the treasury by all users." placement="top-end" color="white"/>
              </Grid>
              <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                <Typography style={{color: '#bdbdbd'}}>
                  {`${round2Decimals(fromE8s(treasuryState.userTreasuryData?.balances.icp || 0))}`} ICP
                </Typography>
                <InfoToolTip text="YOUR ICP deposited within the treasury. Available for you to use or withdraw." placement="bottom-end" color="white"/>
              </Grid>
              <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                <Typography variant="h6" color={'#bdbdbd'}>
                  {`${round2Decimals(fromE8s(treasuryState.daoWalletBalance))}`} ICP
                </Typography>
                <InfoToolTip text="The amount of ICP within the treasury's multi-sig wallet." placement="bottom-end" color="white"/>
              </Grid>
          </Grid>
          <Grid xs={4} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
            <Typography width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>Staked:</Typography>
            <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
              <Typography variant="h6" display={"flex"} justifyContent={"center"} alignItems={"center"}>
                {`${round2Decimals(fromE8s(treasuryState.daoTotalIcpStaked))}`} ICP
              </Typography>
              <InfoToolTip text="The sum of all ICP staked across all of the DAO's neurons" placement="top" color="white"/>
            </Grid>
            <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
              <Typography display={"flex"} justifyContent={"center"} alignItems={"center"} style={{color: '#bdbdbd'}}>
                {`${round2Decimals(fromE8s(treasuryState.userTreasuryData?.balances.icp_staked || 0))}`} ICP
              </Typography>
              <InfoToolTip text="The sum of all YOUR ICP staked across all of the DAO's neurons" placement="bottom" color="white"/>
            </Grid>
          </Grid>
          <Grid xs={4} width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"} flexDirection={"column"}>
            <Typography width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"} >Voting Power:</Typography>
            <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>
              <Typography width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"} variant="h6">
                {`${round2Decimals(fromE8s(treasuryState.votingPower))}`}
              </Typography>
              <InfoToolTip text="The sum of all voting power yielded by all of the DAO's neurons" placement="top-start" color="white"/>
            </Grid>
            <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"}>
              <Typography width={"100%"} display={"flex"} justifyContent={"right"} alignItems={"center"} style={{color: '#bdbdbd'}}>
                {`${round2Decimals(fromE8s(treasuryState.userVotingPower))}`} 
              </Typography>
              <InfoToolTip text="The sum of all YOUR voting power yielded by all of your contributions to the DAO's neurons" placement="bottom-start" color="white"/>
            </Grid>
          </Grid>
        </Grid>
        <Graph 
          type={CHART_TYPES.line} 
          inputData={treasuryState.balancesData} 
          defaultLabel={GRAPH_DISPLAY_LABELS.icp} 
          defaultDataSetName={GRAPH_DATA_SETS.balancesHistory.week}
          maintainAspectRatio={false}
          height={"500px"}
          width={"100%"}
        />
        <Grid columns={12} xs={12} rowSpacing={0} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"} width={"100%"}>
            <Switch
              checked={autoRepayLoans}
              onClick={() => onSwitchToggle(!autoRepayLoans, autoContributeToLoans)}
              labelLeft={"Auto pay on loans received from funding campaigns: "}
              sx={{ paddingTop: "0px", paddingBottom: "0px" }}
            />
            <Switch
              checked={autoContributeToLoans}
              onClick={() => onSwitchToggle(autoRepayLoans, !autoContributeToLoans)}
              labelLeft={"Auto lend to approved funding campaigns: "}
              sx={{ paddingTop: "0px", paddingBottom: "0px" }}
            />
        </Grid>
        <DisplayAllNeurons />
        <Grid xs={12} display="flex" justifyContent="center" alignItems="center" width={"100%"}>
            <AccordionField>
              <div 
                  title={"Active Funding Campaigns"} 
                  fundingCampaigns={activeFundingCampaigns}
                  CustomComponent={DisplayAllFundingCampaigns}
              ></div>
              <div 
                  title={"Inactive Funding Campaigns"} 
                  fundingCampaigns={inactiveFundingCampaigns}
                  CustomComponent={DisplayAllFundingCampaigns}
              ></div>
            </AccordionField>
        </Grid>
        <ButtonField
          paperSx={{marginTop: "20px"}}
          text={"View Treasury Account ID"}
          onClick={openTreasuryAccountIdModal}
          iconSize={'large'}
        />
      </Grid>
      <ActionButton/>
    </Grid>
    
  );
};

export default TreasuryPage;