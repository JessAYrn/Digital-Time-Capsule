import React , {useContext}from "react";
import { retrieveContext } from "../../../functionsAndConstants/Contexts";
import { AppContext as AccountContext} from '../../Account';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as JournalContext} from '../../App';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as TreasuryContext} from '../../Treasury';
import { AppContext as GroupJournalContext} from '../../GroupJournal';
import { modalTypes } from "../../../reducers/modalReducer";
import { MODALS_TYPES } from "../../../functionsAndConstants/Constants";
import ButtonField from "../../../Components/Fields/Button";
import "./DateOutOfRange.scss"

const DateOutOfRange = (props) => {
    const {
        context
    } = props;

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    const {modalState, modalDispatch} = useContext(AppContext);

    const onClick = () => {
        modalDispatch({
            actionType: modalTypes.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
        });
    }

    return(
        <div className="contentDiv__dateOutOfRange">

            <h3 className='h3Texts'>
                { modalState.modalStatus.beyondMax ? 
                    'You may only select dates as late as the current date.' :
                    'The unlock date must be at least one month in the future.'
                }
            </h3>
            <ButtonField
                text={'OK'}
                className={'button'}
                onClick={onClick}
                withBox={true}
            />
        </div>
    )
};
export default DateOutOfRange;