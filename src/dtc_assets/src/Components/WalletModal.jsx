import React from 'react';
import "./WalletModal.scss";
import ModalContentOnSend from './ModalContentOnSend';

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
                            <ModalContentOnSend
                                showModal={showModal}
                                setShowModal={setShowModal}
                            />
                        </div>
                    </div>
                </div>
            </div> :
                null
            }
        </>
    )

}