import React, {useContext, useState} from "react";
import { AppContext } from "../App";
import "./LoadScreen.scss";
import '../../SCSS/contentContainer.scss'


const LoadScreen = () => {

    const { journalDispatch, journalState } = useContext(AppContext);
    const [direction, setDirection] = useState('');
    const [seconds, setSeconds] = useState(0);
    const rotateAnimations = () => {
        setSeconds( seconds + 1);
        if(seconds % 4 === 0) setDirection('');
        else if(seconds % 4 === 1) setDirection('right');
        else if(seconds % 4 === 2) setDirection('down');
        else if(seconds % 4 === 3) setDirection('left');
    }
    setTimeout(rotateAnimations, 1000);

    return(
        <div className="container_loadScreen">
            <div className="loadContentContainer">
                <div className={`loadContentDiv contentContainer`}>
                    <div className={`imageDiv rotate ${direction}`}>
                        <img src="dtc-logo-black.png" alt="Loading Screen" />
                    </div>
                </div>
            </div> 
        </div>
    );

};

export default LoadScreen;