import React, {useContext, useState, useEffect} from "react";
import { initialState, types } from "../reducers/journalReducer";
import { AppContext } from "../Routes/App";
import "./LoadScreen.scss";
import { getIntObserverFunc, visibilityFunctionDefault } from "./animations/IntersectionObserverFunctions";


const LoadScreen = () => {

    const { dispatch, journalState } = useContext(AppContext);
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

    useEffect(() => {
        const containers = document.querySelectorAll(".contentContainer.animatedLeft");
        containers.forEach( (container, index) => {
            let props_ = {
                className: "animatedLeft",
                containerIndex: index,
                visibilityFunction: visibilityFunctionDefault
            };
            const observer = new IntersectionObserver(getIntObserverFunc(props_), {threshold: .1});
            observer.observe(container);
        });
    }, [journalState])

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