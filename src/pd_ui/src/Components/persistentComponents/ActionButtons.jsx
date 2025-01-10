import React, { useContext} from "react";
import { AppContext } from "../../Context";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import TransactWithTreasuryModal from "../../modals/financesPageModals/TransactWithTreasury";
import CreateProposalForm from "../../modals/proposals/CreateProposalForm";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Grid from "@mui/material/Unstable_Grid2";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TransactWithWalletModal from "../../modals/financesPageModals/WalletModal";
import Typography from "@mui/material/Typography";
import { animated } from "@react-spring/web";
import ButtonField from "../Button";

const ActionButton = (props) => {

    const {style, onClick} = props;

    const { setModalProps, setModalIsOpen } = useContext(AppContext);

    const openTransactWithTreasuryForm = () => {
        setModalIsOpen(true);
        setModalProps({
            flexDirection: "column",
            components: [ 
                <Typography padding={"10px"} variant='h6' children={"TRANSACT WITH TREASURY"} />,
                <TransactWithTreasuryModal/>
            ],
        });
    };

    const openTransactWithWallerForm = () => {
      setModalIsOpen(true);
      setModalProps({
            flexDirection: "column",
            components: [ 
                <Typography padding={"10px"} variant='h6' children={"TRANSACT WITH WALLET"} />,
                <TransactWithWalletModal/>
            ],
      });
  };

    const openProposalForm = () => {
        setModalIsOpen(true);
        setModalProps({ 
            fullScreen: true,
            components: [ 
                <CreateProposalForm/>
            ] 
        });
    };

    const speedDialActions = [
        {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
        {name: "Treasury Transaction", icon: AccountBalanceIcon, onClick: () => openTransactWithTreasuryForm()},
        {name: "Wallet Transaction", icon: AccountBalanceWalletIcon , onClick: () => openTransactWithWallerForm()},
    ]

    return (
        <Grid
        onClick={onClick}
        style={style}
        position={"absolute"} 
        width={"100%"} 
        xs={12} 
        display={"flex"} 
        justifyContent={"center"} 
        alignItems={"center"} 
        bgcolor={"transparent"} 
        padding={0}
        zIndex={10}
        >
            <Grid xs={4} width={"100%"} padding={0} display={"flex"} justifyContent={"center"} alignItems={"center"}>
            <ButtonField
                bgColor={"#F7931A"}
                color={"primary"}
                gridSx={{ borderRadius: "20px", width: "135px"}}
                elevation={0}
                text={"Propose"}
                onClick={openProposalForm}
                iconSize={'small'}
                sx={{color: "black"}}
            />
            </Grid>
            <Grid xs={4} width={"100%"} padding={0} display={"flex"} justifyContent={"center"} alignItems={"center"}>
            <ButtonField
                color={"secondary"}
                gridSx={{ borderRadius: "20px", width: "135px"}}
                elevation={0}
                text={"Transact"}
                onClick={() => {}}
                iconSize={'small'}
            />
            </Grid>
        </Grid>
)
};
export default animated(ActionButton);