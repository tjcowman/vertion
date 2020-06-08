import React from 'react';

import {Card, ListGroup, } from 'react-bootstrap'

import './rolloverPanel.css'

class RolloverPanel extends React.Component{

    constructor(props){
        super(props);
        this.state={
            collapsed: true,
        };
    }
    
    handleEnter=()=>{
        this.setState({collapsed : false}); 
        console.log("g");
    }
    
    handleLeave=()=>{
         this.setState({collapsed : true}); 
    }

    render(){
        return(
            <>
                <div className={this.state.collapsed ? "" : "displayBlur"}></div>
                <div className="expander" onMouseEnter={this.handleEnter}></div>
                <div className={this.state.collapsed ? "collapsed" : "expanded " } onMouseLeave={this.handleLeave} >
                    <Card style={{ borderRadius : 0}}>
                    <Card.Body>
                    {this.props.component}
                    </Card.Body>
                    </Card>
                </div>

            </>
        )
    };
}

export{RolloverPanel};
