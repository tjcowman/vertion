import React from 'react';

import {Card, ListGroup, Button} from 'react-bootstrap'

import './rolloverPanel.css'


class QuerySettingsBar extends React.Component{
    constructor(props){
        super(props);
        this.state={
            collapsed: true,
        };
    }
    
    handleOnShowClick=()=>{
//         console.log(this.state, prevState)
         this.setState((prevState)=>({collapsed : !prevState.collapsed})); 
    }
    
    handleLeave=()=>{
//          this.setState({collapsed : true}); 
    }
    
    render(){
        return(
            <>
            <div style={{position:'relative'}}>
                <div style={{margin:'5px 0px', padding:'5px'}} className="border">
                
                    <Button onClick={this.handleOnShowClick} className="btn-secondary">Settings</Button>
                    <Button onClick={this.props.handleRun}>Run</Button>
 
                </div>
                
                
            
                <div style={{/*width:1*/}} className={this.state.collapsed ? "" : "displayBlur"}></div>
                 
            </div>
            <div className={this.state.collapsed ? "collapsed" : "expanded " } onMouseLeave={this.handleLeave} >
                    <Card style={{ borderRadius : 0}}>
                        <Card.Body>
                            {this.props.component}
                        </Card.Body>
                    </Card>
                </div>
            </>
        );
    }
}

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
                <div className={this.state.collapsed ? "collapsed" : "expanded " } onMouseLeave={this.handleLeave} >
                    <Card style={{ borderRadius : 0}}>
                    <Card.Body>
                    {this.props.component}
                    </Card.Body>
                    </Card>
                </div>
                 <div className={this.state.collapsed ? "" : "displayBlur"}></div>

            </>
        )
    };
}

export{RolloverPanel, QuerySettingsBar};
