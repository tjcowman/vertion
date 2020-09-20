import React from 'react';
import {Card} from 'react-bootstrap'

import {SelectedElementDeck} from './selectedElementDeck.js'

class SelectLabelsComponent extends React.Component{

    constructor(props){
        super(props);

    }

    render(){
        return(
            <>
                <Card.Body>
                    <div className="card">
                        <Card.Header>Vertex Labels</Card.Header>
                        <div className=" card-body "> {

//                      this.props.labelsUsed.nodeNames.arrayToNames([...this.props.versionCardsO.getActiveCard().displayLabels.nodes]).map((e,i) =>(
              [...this.props.versionCardsO.getActiveCard().displayLabels.nodes].map((nameIndex, listIndex)=>(

                                <button  key={listIndex}
                                    value={nameIndex}
                                    name={nameIndex}
                                    className={this.props.handleCheckToggle("labelsV_s",this.props.versionCardsO.activeCard, nameIndex) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
                                            this.props.handleToggle("labelsV_s",this.props.versionCardsO.activeCard,nameIndex)
                                    }
                                >
                                {this.props.labelsUsed.nodeNames.indexToName(nameIndex)}
                                </button>
                        ))}
                        </div>

                    </div>

                </Card.Body>
                <Card.Body>
                    <div className="card">
                        <Card.Header>Edge Labels</Card.Header>
                        <div className=" card-body "> {

                        //this.props.labelsUsed.edgeNames.arrayToNames([...this.props.versionCardsO.getActiveCard().displayLabels.edges]).map((e,i) =>(
                          [...this.props.versionCardsO.getActiveCard().displayLabels.edges].map((nameIndex, listIndex)=>(
                              //console.log(nameIndex),
                                <button  key={listIndex}
                                    value={nameIndex}
                                    name={nameIndex}
                                    className={this.props.handleCheckToggle("labelsE_s",this.props.versionCardsO.activeCard, nameIndex) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
                                         this.props.handleToggle("labelsE_s",this.props.versionCardsO.activeCard,nameIndex)
                                    }
                                >
                                {this.props.labelsUsed.edgeNames.indexToName(nameIndex)}
                                </button>
                        ))}
                        </div>

                    </div>

                </Card.Body>


                <Card.Body>

                    <SelectedElementDeck activeCard={this.props.versionCardsO.activeCard}
                        displayKeys={["labelsV_s","labelsE_s"]}
                        versionCardsO={this.props.versionCardsO}
                        handleChangeVersionCardName={this.props.handleChangeVersionCardName}
                        partitionHeadings={["Vertex", "Edge"]}
                        displayLookup={[this.props.labelsUsed.nodeNames.names, this.props.labelsUsed.edgeNames.names]}
                        versionCardHandlers = {this.props.versionCardHandlers}
                    />

                 </Card.Body>

            </>

        );
    }

}

export {SelectLabelsComponent};
