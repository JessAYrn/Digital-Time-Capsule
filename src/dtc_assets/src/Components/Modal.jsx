import React from 'react';
import "./Modal.scss";

export const Modal = (props) => {

    const {
        modalStatus,
        setModalStatus,
        ChildComponent,
        success,
        setSuccess,
        tableContent,
        handleSubmit,
        hasError,
        closePage
    } = props;


    return(
        <> 
            { modalStatus.show ? 
            <div className="modalDiv" >
                <div className={'modalBackground'}>
                    <div className='modalTransparentDiv'>
                        <div className={'modalWrapper'}>
                            <ChildComponent
                                hasError={hasError}
                                success={success}
                                setSuccess={setSuccess}
                                modalStatus={modalStatus}
                                closePage={closePage}
                                setModalStatus={setModalStatus}
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