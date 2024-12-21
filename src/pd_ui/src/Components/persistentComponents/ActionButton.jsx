import React, { useContext} from "react";
import { AppContext } from "../../Context";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import TransactWithTreasuryModal from "../modal/TransactWithTreasury";
import CreateProposalForm from "../modal/proposals/CreateProposalForm";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SpeedDialField from "../Fields/SpeedDialField";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TransactWithWalletModal from "../modal/WalletModal";

const ActionButton = (props) => {

    const { setModalProps, setModalIsOpen } = useContext(AppContext);


    const openTransactWithTreasuryForm = () => {
        setModalIsOpen(true);
        setModalProps({
            bigText: "TRANSACT WITH TREASURY",
            components: [ { Component: TransactWithTreasuryModal } ],
        });
    };

    const openTransactWithWallerForm = () => {
      setModalIsOpen(true);
      setModalProps({
          bigText: "TRANSACT WITH WALLET",
          components: [ {Component: TransactWithWalletModal}],
      });
  };

    const openProposalForm = () => {
        setModalIsOpen(true);
        setModalProps({ 
          components: [ { Component: CreateProposalForm }] 
        });
    };


    const speedDialActions = [
        {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
        {name: "Treasury Transaction", icon: AccountBalanceIcon, onClick: () => openTransactWithTreasuryForm()},
        {name: "Wallet Transaction", icon: AccountBalanceWalletIcon , onClick: () => openTransactWithWallerForm()},
    ]

    
    return (
    <SpeedDialField actions={speedDialActions} position={"right"}/>
)
};
export default ActionButton;