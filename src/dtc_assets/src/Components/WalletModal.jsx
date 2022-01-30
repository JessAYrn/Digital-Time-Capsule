import React from 'react';
import "./WalletModal.scss";

export const Modal = (props) => {

    const {
        showModal,
        setShowModal
    } = props;


    return(
        <> 
            { showModal ? 
            <div className="modalDiv" >
                <div className={'modalBackground'}>
                    <div className='modalTransparentDiv'>
                        <div className={'modalWrapper'}>
                            <h1>
                                Hello!
                            </h1> 
                        </div>
                    </div>
                </div>
            </div> :
                null
            }
        </>
    )

}