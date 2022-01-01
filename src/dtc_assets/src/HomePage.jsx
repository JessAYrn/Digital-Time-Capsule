import React from 'react';
import { Link } from "react-router-dom";
import YouTube from 'react-youtube';
import "./HomePage.scss";

const getYoutubeId = require('get-youtube-id');

const HomePage = () => {
    const opts= {
        height: 515,
        width:925,
        playerVars: {
            autoplay: 1
        }
    };

    const onready = () => {

    };


    return (
        <div className="container">
            <div className={'linkDiv'}>
                <nav className={'navBar'}>
                    <Link className={"navLink"} to="app">Time Capsule</Link> |{" "}
                    <Link className={"navLink"} to='account'>Account</Link>
                </nav>
            </div>
            <div className="background center">
                <div class={'scrollable'}>
                    <div className={'transparentDiv'}>
                        <div className={'carouselDiv'}>
                            <YouTube videoId={'hiB8OCPxF40'} opts={opts} onReady={onready}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;