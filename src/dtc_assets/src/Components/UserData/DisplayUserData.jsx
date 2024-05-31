import React, {useContext} from 'react';
import { AppContext } from "../../Context";
const DisplayUserData = (props) => {
    const {
        journalState,
        journalDispatch
    } = useContext(AppContext);

    return (
        <div>
            <h1>Work in Progress</h1>
        </div>
    )

};

export default DisplayUserData;