import React from 'react';
import "./Modal.scss";

export const Modal = (props) => {

    const {
        showModal,
        setShowModal,
        ChildComponent,
        success,
        setSuccess,
        tableContent
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
                                tableContent={tableContent}
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