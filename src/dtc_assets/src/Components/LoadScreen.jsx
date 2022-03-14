import React from "react";
import "./LoadScreen.scss";


const LoadScreen = () => {

    return(
        <div className="container">
            <div className="background">
                <div className="loadContentContainer">
                    <div className="loadContentDiv">
                    <img src="Loading.gif" alt="Loading Screen" />
                    </div>
                </div>
            </div>
        </div>
    );

};

export default LoadScreen;