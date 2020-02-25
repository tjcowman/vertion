import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';

import {Card, CardDeck, ListGroup, ListGroupItem, Button, Row, Col} from 'react-bootstrap'




function getColumns(){
    let col = [
        {
            dataField: "name",
            text: "name",
             filter: textFilter()
        },
        {
            dataField: "labelsNames",
            text: "labels",
             filter: textFilter()
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
//                                         console.log("SN", e, this.props.selNodes[e]),
                                        
                                        [...this.props.getSelectedNodes2(e)].map((ee,ii)=> (
//                                         [...this.props.selNodes[e]].map((ee,ii)=> (
                                            <ListGroupItem  key={ii} className="versionSelectItem">{this.props.allNodes[ee].name}</ListGroupItem>
                                        ))
//                                         console.log("FFFF", this.props.getSelectedNodes2(this.state.activeCard))
                                    }
                                    
                                    </ListGroup>
                                
                                
                                </Card.Body>
                            </div>
                            ))}
                    
                            <Card>
                                <Card.Header>Difference</Card.Header>
                                <Card.Body className="versionSelectCard">
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
                
               {/*  onClick={(event) =>this.props.selectVersionToggle(this.state.activeCard,i)}> {e.name} */}
                
            <Card.Body>
            <Card>
                <Card.Header>Nodes Selected</Card.Header>
                <Card.Body>
                    <BootstrapTable  
                        rowClasses="nodeSelectItem" 
                        selectRow={{
                            mode: 'checkbox',  
                            selected: [...this.props.getSelectedNodes2(this.state.activeCard)],
                            clickToSelect: true, 
                            hideSelectAll: true,
                            onSelect: (row, isSelect, rowIndex,e) => {
                                if(isSelect){
                                    this.props.selectNodes2(this.state.activeCard, row.id)     
                                }
                                else{
                                    this.props.unSelectNodes2(this.state.activeCard, row.id)
                                }
                                //Used to trigger a rerender of the set cards
                                this.handleCardClick(this.state.activeCard)
                            },
                           
                        }}  
                        striped  
                        keyField='id' 
                        data={ this.props.allNodes} 
                        columns={getColumns()}  
                        pagination={ paginationFactory()}
                        filter={ filterFactory() }   
                    /> 
                </Card.Body>
            </Card>
            </Card.Body>
            </Card>
            
        );
    }
}

export default SelectNodesComponent;
