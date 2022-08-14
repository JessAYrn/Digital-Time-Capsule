import React, {useContext} from "react";
import { initialState, types } from "../reducers/journalReducer";
import { AppContext } from "../App";
import "./LoadScreen.scss";


const LoadScreen = () => {

    const { authClient, setIsLoaded, dispatch } = useContext(AppContext);


    return(
        <div className="container">
            <div className="background">
                <div className="loadContentContainer">
                    <div className="loadContentDiv">
                        <img src="Loading.gif" alt="Loading Screen" />
                    </div>
                    <div className="loadContentDiv">
                        <img src="Loading.gif" alt="Loading Screen" />
                    </div>
                    <button className={'loginButton'} onClick={async () => {
                        dispatch({
                            actionType: types.SET_ENTIRE_REDUX_STATE,
                            payload: initialState
                        });
                        await authClient.logout();
                        setIsLoaded(false);
                    }}> Log Out </button>  
                </div> 
            </div>
        </div>
    );

};

export default LoadScreen;