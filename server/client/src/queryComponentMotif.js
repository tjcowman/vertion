import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form,Col,Row,Tabs,Tab, Card, TabPane} from 'react-bootstrap';


// import ReactDOM from 'react-dom'; 
import Axios from 'axios';
 
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
    
import {SettingsRWR} from './queryComponentRWR.js';

class MotifList{
    constructor(motifs, labelNames){
         console.log(labelNames)
        
        this.motifs = [{"row":0, "pattern":[undefined], "count":undefined }];
        this.labelNames = labelNames;
        if(motifs == null || labelNames == null){
            return;
        }
        
//         console.log(this.motifs)
        this.motifs = motifs.map( (e,i) => ( {"row":i, ...e}) ); 
        
        for(let i in this.motifs){
            this.motifs[i].pattern = this.motifs[i].pattern.map((e) =>
                this.labelNames.bitsToNames(e)
            ).join(" : ");
        }
        

    }
    
    getColumns(){
        return [
            {
                dataField: "pattern",
                text: "Pattern"
            },
            {
                dataField: "count",
                text:"Count"
            }
        ]
    }
}

class QueryComponentMotif extends React.Component{
    constructor(props){
        super(props)
        this.state={
            alpha: .15,
            epsilon: 5,
            topk: 10,
            data: new MotifList() 
        }
        
    };
    


  handleChange=(event)=>{
    let name = event.target.name;
    let value= event.target.value;
      
    this.setState({
        [name]: value,
    })
 
  }
    
    handleSubmit=(event)=>{
//         console.log("wut")
        try{
            let versions = this.props.getSelectedVersions();
            if(versions.length === 0)
            {
                this.setState({data: new MotifList()}); //{"pattern":[], "count":null }
                return;
            }
                
            let epsilon = (1/(Math.pow(10,this.state.epsilon)));
            let selectedNodes = [];

            this.props.getSelectedNodes(0).forEach((v1,v2) => (selectedNodes.push({i:v1, v:1})));
//             let command = {cmd:"mft", versions:versions}; 
            let command = {cmd:"mft", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), topk:Number(this.state.topk), source:selectedNodes, mode:"el"}; 
        
            Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
                console.log("Response", response)
                this.setState({
                    data: new MotifList(response.data.motifs, this.props.getLabels()[1])
                });
                
                
            })//.
//             then(()=>{console.log("data",this.state.data)});
        
        }
        catch(err){
            
        }
    
        event.preventDefault();
    }
    
    renderSettings(){
      return (
        <>
        </>


      );

    }
    
    render(){
        return(
            <>
            <Card.Body>
             <SettingsRWR handleChange={this.handleChange} alpha={this.state.alpha} epsilon={this.state.epsilon} topk={this.state.topk}/>
            </Card.Body>
           
            <Card>
            <Card.Body>
            <Button className="form-control" variant="primary" onClick={(e)=>this.handleSubmit(e)} >Enumerate</Button>
            <BootstrapTable striped condensed keyField='row' data={ this.state.data.motifs} columns={ this.state.data.getColumns()}     /> </Card.Body>

            </Card>
           </>
        )
    }
}


export default QueryComponentMotif;
