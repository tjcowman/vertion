import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

import {Card, CardDeck, ListGroup, ListGroupItem, Button, Row, Col} from 'react-bootstrap'

import {SelectedElementDeck}  from './selectedElementDeck.js'

import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';

const { SearchBar } = Search;

function getColumns(){
    let col = [
        {
            dataField: "name",
            text: "name",
        },
        {
            dataField: "labelsNames",
            text: "labels",
        },     
    ]   

    return col;
}



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
//         console.log(this.state.batchText)
    }
    
    handleBatchInputClick=(event)=>{
//          console.log(this.state.batchText)
         
        let ids = [];
         
        this.state.batchText.split('\n').forEach((e) => (
            ids.push( this.props.nodeLookup.get(e))
//             this.props.selectNodes2(this.state.activeCard,  this.props.nodeLookup.get(e))  
//              console.log(e, this.props.nodeLookup.get(e))
        ));
        
//          console.log("wut", ids)
        this.props.selectNodes2(this.state.activeCard,  ids.filter(e => typeof e !== 'undefined' )) 
        
        this.setState({batchText: ""});
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
                    {props=>(
                        <div>
                        <SearchBar {...props.searchProps}/>
                        
                            <BootstrapTable  
                            { ...props.baseProps }
                                rowClasses="nodeSelectItem" 
                                selectRow={{
                                    mode: 'checkbox',  
                                    selected: [...this.props.selectedNodes[this.state.activeCard]],
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
                        )}
                    
                    </ToolkitProvider>
                        
                </Card.Body>
            </Card>
            
        );
    }
    
    RenderSelectedNodes(){
        return (

            <SelectedElementDeck activeCard={this.state.activeCard} 
                cardIds={this.state.cardIds} 
                handleCardClick={this.handleCardClick} 
                elementIndexes={this.props.selectedNodes}
                displayLookup={this.props.allNodes}
//                 showDiff={true}
            />
           
        );
    }
    
    render(){

        return(
            <Card>
            
                <Card.Body>
                    {this.RenderSelectedNodes()}
                </Card.Body>
                
                
                <Card.Body>
                    <Card>
                        <Card.Header>Input</Card.Header>
                        <Card.Body>
                        
                            <Row>
                                <Col className="col-10"><textarea value={this.state.batchText} className="form-control" id="selectNodesTextBox" rows="3"  onChange={(e) =>this.handleBatchInput(e)} ></textarea></Col>
                                <Col className="col-2"><Button onClick={(e) => (this.handleBatchInputClick(e))}>Add Nodes</Button></Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Card.Body>
                    

                    
                <Card.Body>
                    {this.renderTable1()}
                </Card.Body>
            
            </Card>
            
        );
    }
}

export default SelectNodesComponent;
