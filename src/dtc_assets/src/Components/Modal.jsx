import React from 'react';
import "./Modal.scss";

export const Modal = (props) => {

    const {
        showModal,
        setShowModal,
        ChildComponent,
        success,
        setSuccess
    } = props;


    return(
        <> 
            { showModal ? 
            <div className="modalDiv" >
                <div className={'modalBackground'}>
                    <div className='modalTransparentDiv'>
                        <div className={'modalWrapper'}>
                            <ChildComponent
                                success={success}
                                setSuccess={setSuccess}
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