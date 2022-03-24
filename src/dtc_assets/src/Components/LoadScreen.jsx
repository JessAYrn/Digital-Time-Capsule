import React, {useContext} from "react";
import { AppContext } from "../App";
import "./LoadScreen.scss";


const LoadScreen = () => {

    const { authClient, setIsLoaded } = useContext(AppContext);


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
                    {/* <button className={'loginButtonDiv'} onClick={async () => {
                        await authClient.logout();
                        setIsLoaded(false);
                    }} > Log Out </button>  */}
                </div> 
            </div>
        </div>
    );

};

export default LoadScreen;