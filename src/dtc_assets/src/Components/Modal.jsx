import React from 'react';
import "./Modal.scss";

export const Modal = (props) => {

    const {
        showModal,
        setShowModal,
        ChildComponent,
        success,
        setSuccess,
        tableContent,
        handleSubmit,
        closePage
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
                                closePage={closePage}
                                setShowModal={setShowModal}
                                tableContent={tableContent}
                                handleSubmit={handleSubmit}
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