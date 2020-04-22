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

                      this.props.labelsUsed.nodeNames.arrayToNames([...this.props.versionCardsO.getActiveCard().labelsV_s]).map((e,i) =>(
                                <button  key={i}
                                    value={e.name}
                                    name={i}
                                    className={this.props.handleCheckToggle("labelsV_s",this.props.versionCardsO.activeCard, i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
                                            this.props.handleToggle("labelsV_s",this.props.versionCardsO.activeCard,i)
                                    }
                                >
                                {e.name}
                                </button>
                        ))}
                        </div>

                    </div>

                </Card.Body>
                <Card.Body>
                    <div className="card">
                        <Card.Header>Edge Labels</Card.Header>
                        <div className=" card-body "> {

                        this.props.labelsUsed.edgeNames.arrayToNames([...this.props.versionCardsO.getActiveCard().labelsE_s]).map((e,i) =>(

                                <button  key={i}
                                    value={e.name}
                                    name={i}
                                    className={this.props.handleCheckToggle("labelsE_s",this.props.versionCardsO.activeCard, i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
                                         this.props.handleToggle("labelsE_s",this.props.versionCardsO.activeCard,i)
                                    }
                                >
                                {e.name}
                                </button>
                        ))}
                        </div>

                    </div>

                </Card.Body>


                <Card.Body>

                    <SelectedElementDeck activeCard={this.props.versionCardsO.activeCard}
                        displayKeys={["labelsV_s","labelsE_s"]}
                        versionCardsO={this.props.versionCardsO}
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
