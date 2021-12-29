import React from 'react';
import { Link } from "react-router-dom";
import "./HomePage.scss";

const HomePage = () => {

    return (
        <div className="container">
            <div className={'linkDiv'}>
                <nav className={'navBar'}>
                    <Link className={"navLink"} to="/">Home</Link> |{" "}
                    <Link className={"navLink"} to="app">App</Link> |{" "}
                    <Link className={"navLink"} to='account'>My Account</Link>
                </nav>
            </div>
            <div className="background center">
                {/* <img style={}className={'homePageLogoImg'} src={"dtc-logo-black.png"} alt="Logo"/> */}
            </div>
        </div>
    );
};

export default HomePage;