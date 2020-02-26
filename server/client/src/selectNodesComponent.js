import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';

import {Card, CardDeck, ListGroup, ListGroupItem, Button, Row, Col} from 'react-bootstrap'

import {Column, Table} from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once

import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';

const { SearchBar } = Search;

function getColumns(){
    let col = [
        {
            dataField: "name",
            text: "name",

//              filter: textFilter()
        },
        {
            dataField: "labelsNames",
            text: "labels",
//              filter: textFilter()
        },
//         {
//             dataField: "value",
//             text: "value"
//         }
//     
    ]   

    return col;
}

//{{mode: 'checkbox', onSelect: (row, isSelect, rowIndex,e) => {this.props.selectNodes(row.id)} }}

class SelectNodesComponent extends React.Component{ 

    constructor(props){
        super(props)
        this.state={
            activeCard :0,
            cardIds: [0,1],
            
            
            
            batchText: ""
        }
    }
    
    handleCardClick=(cardId)=>{
        this.setState({activeCard: cardId});
//         console.log(this.state.activeCard)
    }
    
    handleBatchInput=(event)=>{
        this.setState({
            batchText : event.target.value
        })
        console.log(this.state.batchText)
    }
    
    handleBatchInputClick=(event)=>{
         console.log(this.state.batchText)
         
        let ids = [];
         
        this.state.batchText.split('\n').forEach((e) => (
            ids.push( this.props.nodeLookup.get(e))
//             this.props.selectNodes2(this.state.activeCard,  this.props.nodeLookup.get(e))  
//              console.log(e, this.props.nodeLookup.get(e))
        ));
        
//          console.log("wut", ids)
        this.props.selectNodes2(this.state.activeCard,  ids.filter(e => typeof e !== 'undefined' )) 
        this.handleCardClick(this.state.activeCard)
    }
    
    renderTable1(){
        
        return(
                <Card>
                <Card.Header>Nodes Selected</Card.Header>
                <Card.Body>
                
                    <ToolkitProvider
                        keyField='id' 
                        data={ this.props.allNodes} 
                        columns={getColumns()}  
                        search
                    >
                    {
                            props=>(
                                <div>
                    <SearchBar {...props.searchProps}/>
                    
                        <BootstrapTable  
                         { ...props.baseProps }
                            rowClasses="nodeSelectItem" 
                            selectRow={{
                                mode: 'checkbox',  
                                selected: [...this.props.getSelectedNodes2(this.state.activeCard)],
                                clickToSelect: true, 
                                hideSelectAll: true,
                                onSelect: (row, isSelect, rowIndex,e) => {
                                    if(isSelect){
                                        this.props.selectNodes2(this.state.activeCard, [row.id])     
                                    }
                                    else{
                                        this.props.unSelectNodes2(this.state.activeCard, [row.id])
                                    }
                                    //Used to trigger a rerender of the set cards
                                    this.handleCardClick(this.state.activeCard)
                                },
                            
                            }}  
                            striped  
                        
                            pagination={ paginationFactory()}

                            
                        /> 
                        </div>
                        )
                    }
                    
                    </ToolkitProvider>
                        
                </Card.Body>
            </Card>
            
        );
    }
    
    renderTable2(){
        
        const list = [
  {name: 'Brian Vaughn', description: 'Software engineer'},
  // And so on...
];
        
        return(
  <Table
    width={300}
    height={300}
    headerHeight={20}
    rowHeight={30}
    rowCount={this.props.allNodes.length}
    rowGetter={({index}) => this.props.allNodes[index]}>
    <Column label="Name" dataKey="name" width={100} />
    <Column width={200} label="Description" dataKey="labelsNames" />
  </Table>
        );
    }
    
    render(){
//         console.log("AN", this.props.allNodes)
        return(
            <Card>
            
             <Card.Body>
                    <CardDeck >
                    
                         {this.state.cardIds.map((e,i)=> (
                             
                             <div key={i} className= {this.state.activeCard==e ? "card border-primary border-bold " : "card "} onClick={() => this.handleCardClick(e)}>
                                <Card.Header>Set {e}</Card.Header>
                                <Card.Body className="versionSelectCard">
                                    
                                    <ListGroup>
                                    {                                
                                        [...this.props.getSelectedNodes2(e)].map((ee,ii)=> (
                                            <ListGroupItem  key={ii} className="versionSelectItem">{this.props.allNodes[ee].name}</ListGroupItem>
                                        ))
                                    }                                    
                                    </ListGroup>
                                
                                
                                </Card.Body>
                            </div>
                            ))}
                    
                            <Card>
                                <Card.Header>Difference</Card.Header>
                                <Card.Body className="versionSelectCard">
                                    <ListGroup>
                                    {                                
                                        this.props.getSelectedNodesDifference().map((ee,ii)=> (
//                                             <ListGroupItem  key={ii} className="versionSelectItem" style={ee.v ==0 ? {"backgroundColor": "#ede7f6" } : {"backgroundColor": "#e0f2f1"} }>{this.props.allNodes[ee.id].name}</ListGroupItem>
                                             <ListGroupItem  key={ii} className="versionSelectItem" >{this.props.allNodes[ee.id].name}</ListGroupItem>
                                        ))
                                    }                                    
                                    </ListGroup>
                                
                                </Card.Body>
                            </Card>
                    
                    </CardDeck>
                </Card.Body>
            
            
            <Card.Body>
                <Card>
                    <Card.Header>Input</Card.Header>
                    <Card.Body>
                    
                        <Row>
                            <Col className="col-10"><textarea className="form-control" id="selectNodesTextBox" rows="3"  onChange={(e) =>this.handleBatchInput(e)} ></textarea></Col>
                            <Col className="col-2"><Button onClick={(e) => (this.handleBatchInputClick(e))}>Add Nodes</Button></Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Card.Body>
                

                
            <Card.Body>
                {this.renderTable1()}
                {/*this.renderTable2()*/}
            </Card.Body>
            </Card>
            
        );
    }
}

export default SelectNodesComponent;
