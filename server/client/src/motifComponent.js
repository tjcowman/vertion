import React from 'react';
import ReactDOM from 'react-dom'; 
import CytoscapeComponent from 'react-cytoscapejs'
import Axios from 'axios';

import { Button, Form} from 'react-bootstrap';

class MotifComponent extends React.Component{
    constructor(props){
        super(props)
        this.state={
            data : [ {"pattern":[], "count":null }]
        }
        
    };
    
    handleSubmit=(event)=>{
        console.log("wut")
        try{
            let versions = this.props.getSelectedVersions();
            if(versions.length === 0)
            {
                this.setState({result:   [ {"pattern":[], "count":null }]});
                return;
            }
                
            let command = {cmd:"mft", versions:versions}; 

        
            Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
                console.log(response)
                this.setState({result: response.data})
            });
        
        }
        catch(err){
            
        }
    
        event.preventDefault();
    }
    
    render(){
        return(
            
           
            <div>
            <Button className="form-control" variant="primary" onClick={(e)=>this.handleSubmit(e)} >Enumerate</Button>
            </div>
           
        )
    }
}

export default MotifComponent;
