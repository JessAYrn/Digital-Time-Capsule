import React, { useState } from 'react'
import './Accordion.scss';


const Accordion = ({title,content,icon}) => {

    const[selected,setSelected]=useState(false);


  return (
    <div className='accordion__Container'>
        <div className='accordion__Inner'>
            <div className='accordion__Title'
             onClick={()=>setSelected(!selected)}
            >
                <p>{title}</p>
                {/* <img 
                className='dropdown_img__accordion'
                onClick={()=>setSelected(!selected)}
                src='https://t3.ftcdn.net/jpg/04/83/39/12/360_F_483391217_rDo0Gdjp71zXabPRjeaE1O3I85R6nIgB.jpg' alt='dropdown'/> */}
                <div
                className='plusSign'
                onClick={()=>setSelected(!selected)}
                >{selected? '-' :'+' }</div>
            </div>
            <div className={`accordion__Content ${selected ?' show':''}`}>
                <div className={`accordion_content_container`}>
                {content.map((content,index)=>(
                    (
                        <div
                        className='accordion_content_inner'
                        key={index}
                        >
                            {content.text && <p>{content.text}</p>}

                            {content.image && <img src={content.image}/>}
                        </div>
                        
                    )
                ))}
                </div>
                
            </div>
        </div>
    </div>
  )
}

export default Accordion;