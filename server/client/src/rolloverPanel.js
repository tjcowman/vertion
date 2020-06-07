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
               
                <div className="expander" onMouseEnter={this.handleEnter}></div>
                <div className={this.state.collapsed ? "collapsed" : "expanded" } onMouseLeave={this.handleLeave} >{this.props.component}</div>

            </>
        )
    };
}

export{RolloverPanel};
