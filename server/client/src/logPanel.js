import React from 'react';

import {Card, ListGroup, } from 'react-bootstrap'

import './logPanel.css'

class LogPanel extends React.Component{

    constructor(props){
        super(props);

    }

    render(){
        return(
            <ListGroup className="messageList">
                {
                  //  console.log(this.props.logStruct),
                    this.props.logStruct.messages.map((e,i)=> (


                        <ListGroup.Item  key={i} className="message" > {e.text + (e.count > 1 ? " x"+e.count : "")} </ListGroup.Item>
                ))}
            </ListGroup>

        )
    };
}

export{LogPanel};
