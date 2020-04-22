import React from 'react';

// import BootstrapTable from 'react-bootstrap-table-next';
// import paginationFactory from 'react-bootstrap-table2-paginator';

import {Card, CardDeck, ListGroup, ListGroupItem, Button, Row, Col} from 'react-bootstrap'

import {SelectedElementDeck}  from './selectedElementDeck.js'

// import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';
import Axios from 'axios';
// const { SearchBar } = Search;

function getColumns(){
    let col = [
        {
            dataField: "name",
            text: "name",
        },
        {
            dataField: "labelsPlainText",
            text: "labels",
        },     
    ]   

    return col;
}



class SelectNodesComponent extends React.Component{ 

    constructor(props){
        super(props)
        this.state={
            batchText: ""
        }
    }
    
//     handleCardClick=(cardId)=>{
//         this.props.handleClickVersionCard(cardId);
//     }
    
    handleBatchInput=(event)=>{
        this.setState({
            batchText : event.target.value
        })
    }
    
    handleBatchInputClick=(event)=>{

        if(this.state.batchText === "")
            return;
        
        let names = this.state.batchText.split('\n');

        //makes sure the node ids exist first
        if(names.length > 0){
            
            
            let  selectFn =()=> {names.forEach((n) => (
                this.props.handleSelect("nodes_s", this.props.versionCardsO.activeCard, this.props.nodeData.getIndex(n))

            ))}
            
            
            this.props.handleNodeLookup(names, selectFn )

        }

        this.setState({batchText: ""});

    }
    /*
    renderTable1(){
        return(
            <Card>
                <Card.Header>Nodes Selected</Card.Header>
                <Card.Body>
                
                    <ToolkitProvider
                        keyField='id' 
                        data={ this.props.elementNames.vertexes} 
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
                                    selected:  [...this.props.versionCardsO.cards[this.props.activeVersionCard]["nodes_s"]], //[...this.props.selectedNodes[this.props.activeVersionCard]],
                                    clickToSelect: true, 
                                    hideSelectAll: true,
                                    onSelect: (row, isSelect, rowIndex,e) => {
                                        this.props.handleToggle("nodes_s", this.props.activeVersionCard, row.id)
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
    }*/
    
    RenderSelectedNodes(){
        return (

            <SelectedElementDeck activeCard={this.props.versionCardsO.activeCard} 
            
                versionCardsO={this.props.versionCardsO}
                displayKeys={["nodes_s"]}
                partitionHeadings={[""]}

                displayLookup={[ this.props.nodeData.indexes]}
          
                versionCardHandlers = {this.props.versionCardHandlers}
//                 showDiff={true}
            />
           
        );
    }
    
    render(){

        return(
            <>
            

                
                
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
                    {this.RenderSelectedNodes()}
                </Card.Body>

               {/*     
                <Card.Body>
                    {this.renderTable1()}
                </Card.Body>
                */}
            </>
            
        );
    }
}

export default SelectNodesComponent;
