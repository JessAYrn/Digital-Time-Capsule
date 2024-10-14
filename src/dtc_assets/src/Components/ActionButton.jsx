import React, {useState, useContext} from "react";
import { AppContext } from "../Context";
import SendIcon from '@mui/icons-material/Send';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import withdrawModal from "./modal/withdraw";
import CreateProposalForm from "./modal/proposals/CreateProposalForm";
import { loadAllDataIntoReduxStores } from "../functionsAndConstants/loadingFunctions";
import { types as journalTypes } from "../reducers/journalReducer";
import { walletTypes } from "../reducers/walletReducer";
import { homePageTypes } from "../reducers/homePageReducer";
import { notificationsTypes } from "../reducers/notificationsReducer";
import { treasuryTypes } from "../reducers/treasuryReducer";
import SpeedDialField from "./Fields/SpeedDialField";
import ModalComponent from "./modal/Modal";
import SendCrypto from "./modal/SendCryptoModal";


const ActionButton = (props) => {

    const { 
        actorState,
        treasuryDispatch,
        walletDispatch, 
        homePageDispatch,
        journalDispatch,
        notificationsDispatch,
    } = useContext(AppContext);
    
    const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, journalDispatch};
    const types = { journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    const openWithdrawForm = () => {
        setModalIsOpen(true);
        setModalProps({
            bigText: "WITHDRAW ICP FROM TREASURY",
            components: [
              {
                Component: withdrawModal,
                props: {
                  setModalIsOpen, 
                  setModalProps, 
                  setIsLoadingModal,
                }
              }
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

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

    const reloadData = async () => {
        setIsLoadingModal(true);
        setModalIsOpen(true);
        await loadAllDataIntoReduxStores(actorState, dispatches, types);
        setModalIsOpen(false);
        setIsLoadingModal(false);
      };

      const onSend = () => {
        setModalProps({
            bigText: "SEND ICP TO ANOTHER ADDRESS",
            components: [{
                Component: SendCrypto,
                props: {
                    onClickCancel: () => {setModalIsOpen(false); () => setModalProps({})},
                    setModalProps,
                    setModalIsOpen,
                    setIsLoadingModal
                }
            }]
        });
        setModalIsOpen(true);
    };

    const speedDialActions = [
        {name: "Refresh", icon: RefreshIcon, onClick: reloadData},
        {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
        {name: "Withdraw To Wallet", icon: AccountBalanceWalletOutlinedIcon , onClick: () => openWithdrawForm()},
        {name: "New Transaction", icon: SendIcon , onClick: onSend}
    ]

    
    return (
    <>
        <SpeedDialField actions={speedDialActions} position={"right"}/>
        <ModalComponent 
            {...modalProps}
            open={modalIsOpen} 
            isLoading={isLoadingModal} 
        /> 
    </>
)
};
export default ActionButton;