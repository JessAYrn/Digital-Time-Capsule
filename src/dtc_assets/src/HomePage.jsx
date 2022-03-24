import React from 'react';
import { Link } from "react-router-dom";
import YouTube from 'react-youtube';
import "./HomePage.scss";

const getYoutubeId = require('get-youtube-id');

const HomePage = () => {

    const mql = window.matchMedia('(max-width: 480px)');

    const opts= {
        height: 508,
        width: mql.matches ? 400 : 925,
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
                    <Link className={"navLink"} to="app">Time Capsule | </Link>
                    <Link className={"navLink"} to='wallet'>Wallet | </Link>
                    <Link className={"navLink"} to='account'>Account</Link>
                </nav>
            </div>
            <div className="background center">
                <div class={'scrollable'}>
                    <div className={'transparentDiv__homePage'}>
                        <div className={'carouselDiv'}>
                            <div className={'videoContainerDiv'}>
                                <YouTube videoId={'hiB8OCPxF40'} opts={opts} onReady={onready}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;