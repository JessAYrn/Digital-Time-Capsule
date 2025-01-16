import React, { useContext} from "react";
import { AppContext } from "../../Context";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import TransactWithTreasuryModal from "../../wallet/renderComponents/TransactWithTreasury";
import CreateProposalForm from "../../proposals/CreateProposalForm";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Grid from "@mui/material/Unstable_Grid2";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TransactWithWalletModal from "../../wallet/WalletModal";
import Typography from "@mui/material/Typography";
import ButtonField from "../Button";
import { BACKGROUND_COLOR, CONTRAST_COLOR } from "../../Theme";
import { useScroll, useSpring, animated } from "@react-spring/web";

const ActionButton = (props) => {

    const { CustomActionButtonComponents} = props;

    const coordinates = { x:0, y:0 };

    const show = () => {  console.log("show"); styleApi.start({top: 0}); };
    const hide = () => { console.log("hide"); styleApi.start({top: 100}) };

    const [style, styleApi] = useSpring(() => ({ from: { top: 0 } }), []);

    useScroll({
        onChange: ({value: {scrollYProgress}}) => {
            if(coordinates.y > scrollYProgress || scrollYProgress >= 0.99) show();
            if(coordinates.y < scrollYProgress && scrollYProgress < 0.99) hide();
            coordinates.y = scrollYProgress
        }
    });

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
            headerComponent: <Typography variant="h6">Create Proposal</Typography>,
            fullScreen: true,
            components: [ 
                <CreateProposalForm/>
            ] 
        });
    };

    return (
        <Grid
        component={animated.div}
        style={style}
        position={"relative"} 
        width={"100%"} 
        xs={12} 
        display={"flex"} 
        justifyContent={"center"} 
        alignItems={"center"} 
        bgcolor={"transparent"} 
        padding={0}
        zIndex={10}
        >
            {CustomActionButtonComponents ? CustomActionButtonComponents :
                <>
                    <Grid xs={4} width={"100%"} padding={0} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <ButtonField
                            color={BACKGROUND_COLOR}
                            gridSx={{ width: "135px", backgroundColor: CONTRAST_COLOR }}
                            elevation={0}
                            text={"Propose"}
                            onClick={openProposalForm}
                            iconSize={'small'}
                        />
                        </Grid>
                        <Grid xs={4} width={"100%"} padding={0} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <ButtonField
                            color={CONTRAST_COLOR}
                            gridSx={{ width: "135px"}}
                            elevation={0}
                            text={"Transact"}
                            onClick={() => {}}
                            iconSize={'small'}
                        />
                    </Grid>
                </>
            }
        </Grid>
)
};
export default ActionButton;