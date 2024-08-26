import { NavBar } from "../../Components/navigation/NavBar";
import React, { useContext, useState } from 'react';
import { AppContext } from "../../Context";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from "@mui/material";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { fromE8s, shortenHexString, round2Decimals } from "../../functionsAndConstants/Utils";
import { treasuryTypes } from "../../reducers/treasuryReducer";
import { walletTypes } from "../../reducers/walletReducer";
import { homePageTypes } from "../../reducers/homePageReducer";
import { types as journalTypes } from "../../reducers/journalReducer";
import { notificationsTypes } from "../../reducers/notificationsReducer";
import { loadAllDataIntoReduxStores } from "../../functionsAndConstants/loadingFunctions";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SpeedDialField from "../../Components/Fields/SpeedDialField";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ModalComponent from "../../Components/modal/Modal";
import ButtonField from "../../Components/Fields/Button";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreateProposalForm from "../../Components/proposals/CreateProposalForm";
import DepositOrWithdrawModal from "../../Components/modal/DepositOrWithdraw";
import Graph from "../../Components/Fields/Chart";
import { CHART_TYPES, GRAPH_DATA_SETS, GRAPH_DISPLAY_LABELS } from "../../functionsAndConstants/Constants";
import { TREASURY_ACTIONS } from "../../Components/proposals/utils";
import InfoToolTip from "../../Components/Fields/InfoToolTip";
import DisplayAllFundingCampaigns from "../../Components/fundingCampaign/DisplayAllFundingCampaigns";
import DisplayAllNeurons from "../../Components/Neurons/DisplayAllNeurons";

const TreasuryPage = (props) => {
  const { 
    treasuryState, 
    treasuryDispatch,
    walletState, 
    walletDispatch, 
    homePageState,
    homePageDispatch,
    journalState,
    journalDispatch,
    notificationsState,
    notificationsDispatch,
    actorState, 
  } = useContext(AppContext);

  const states = {homePageState, actorState, treasuryState, walletState, notificationsState, journalState,};
  const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, journalDispatch};
  const types = { journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const openProposalForm = () => {
    setModalIsOpen(true);
    setModalProps({
        components: [
          {
            Component: CreateProposalForm,
            props: { setModalIsOpen, setModalProps, setIsLoadingModal}
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
  };

  const openDepositOrWithdrawForm = (action) => {
    setModalIsOpen(true);
    setModalProps({
        components: [
          {
            Component: DepositOrWithdrawModal,
            props: {
              action,
              setModalIsOpen, 
              setModalProps, 
              setIsLoadingModal,
            }
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
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
        smallText: "Sending ICP directly to this account ID without using the 'Deposit To Treasury' button will result in no treasury contribution being recorded from your account. In other words, you're essentially donating to the treasury without receiving any credit. If you're not sure what you're doing, do NOT proceed. If you mean to receive credit for your deposit to the treasury, use the 'Deposit To Treasury' button.",
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

  const reloadData = async () => {
    setIsLoadingModal(true);
    setModalIsOpen(true);
    await loadAllDataIntoReduxStores(states, dispatches, types);
    setModalIsOpen(false);
    setIsLoadingModal(false);
  };

  const speedDialActions = [
    {name: "Refresh", icon: RefreshIcon , onClick: reloadData},
    {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
    {name: "Withdraw To Wallet", icon: AccountBalanceWalletOutlinedIcon , onClick: () => openDepositOrWithdrawForm(TREASURY_ACTIONS.WithdrawIcpFromTreasury)},
    {name: "Deposit To Treasury", icon: AccountBalanceIcon , onClick: () => openDepositOrWithdrawForm(TREASURY_ACTIONS.DepositIcpToTreasury)}
  ];

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
      className={"container_treasury"}
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
        <DisplayAllNeurons />
        <DisplayAllFundingCampaigns />
        <ButtonField
          paperSx={{marginTop: "20px"}}
          text={"View Treasury Account ID"}
          onClick={openTreasuryAccountIdModal}
          iconSize={'large'}
        />
      </Grid>
      <SpeedDialField actions={speedDialActions} position={"right"}/>
      <ModalComponent 
          {...modalProps}
          open={modalIsOpen} 
          isLoading={isLoadingModal} 
      /> 
    </Grid>
    
  );
};

export default TreasuryPage;