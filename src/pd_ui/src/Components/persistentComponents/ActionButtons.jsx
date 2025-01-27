import React, { useContext} from "react";
import { AppContext } from "../../Context";
import CreateProposalForm from "../../proposals/CreateProposalForm";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import ButtonField from "../Button";
import { BACKGROUND_COLOR, CONTRAST_COLOR } from "../../Theme";
import { useScroll, useSpring, animated } from "@react-spring/web";
import TransactOptions from "../../transact/RenderTransactOptions";

const ActionButton = (props) => {

    const { CustomActionButtonComponents} = props;

    const coordinates = { x:0, y:0 };

    const show = () => {  styleApi.start({top: 0}); };
    const hide = () => { styleApi.start({top: 100}) };

    const [style, styleApi] = useSpring(() => ({ from: { top: 0 } }), []);

    useScroll({
        onChange: ({value: {scrollYProgress}}) => {
            if(coordinates.y > scrollYProgress || scrollYProgress >= 0.99) show();
            if(coordinates.y < scrollYProgress && scrollYProgress < 0.99) hide();
            coordinates.y = scrollYProgress
        }
    });

const { setModalProps, setModalIsOpen } = useContext(AppContext);

  const openTransactOptions = () => {
    setModalIsOpen(true);
    setModalProps({
      flexDirection: "column",
      fullScreen: true,
      headerComponent: <Typography padding={"10px"} variant='h6' children={"TRANSACT OPTIONS"} />,
      components: [ 
        <TransactOptions/>
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
                    <ButtonField
                        color={BACKGROUND_COLOR}
                        gridSx={{ margin: "2.5%", width: "40%", backgroundColor: CONTRAST_COLOR }}
                        elevation={0}
                        text={"Propose"}
                        onClick={openProposalForm}
                        iconSize={'small'}
                    />
                    <ButtonField
                        color={CONTRAST_COLOR}
                        gridSx={{ margin: "2.5%", width: "40%"}}
                        elevation={0}
                        text={"Transact"}
                        onClick={openTransactOptions}
                        iconSize={'small'}
                    />
                </>
            }
        </Grid>
)
};
export default ActionButton;