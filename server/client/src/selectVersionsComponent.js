import React from 'react';


import {Card} from 'react-bootstrap'

import {SelectedElementDeck}  from './selectedElementDeck.js'


class SelectVersionsComponent extends React.Component{

    constructor(props){
        super(props);
        this.state={
        }
//         console.log("HHH", this.props.versionCardHandlers)
    }


//     handleCardClick=(cardId)=>{
//         this.props.handleClickVersionCard(cardId);
//     }


    renderVersionNames(){
        return(
            <Card>
            <Card.Header>Versions</Card.Header>
                <Card.Body>


              
                      {this.props.versionsData.getDisplayedTags().map((e,i)=>(
                        <div key={i}>
                        <div className="border versionDisplaySelect">
                            <b>{e[0]}</b>
                            <div>
                            {e[1].map((ee,ii) =>(
//                                    console.log(ee, ii),
                                    <button  key={ii}


                                        className={this.props.handleCheckToggle("versions_s",this.props.versionCardsO.activeCard,ee.index) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                        onClick={(event) =>
                                            (this.props.handleToggle("versions_s", this.props.versionCardsO.activeCard, ee.index)
                                            )

                                        }
                                    >
                                    {ee.name}
                                    </button>

                            ))}
                            </div>
                            </div>
                        </div>
                    ))}

                </Card.Body>

            </Card>
        );
    }

    render(){
        return(
            <>
            <Card.Body>
                {this.renderVersionNames()}
            </Card.Body>


                <Card.Body>

                    <SelectedElementDeck activeCard={this.props.versionCardsO.activeCard}
                        versionCardsO={this.props.versionCardsO}
                        displayKeys={["versions_s"]}
                        partitionHeadings={["Versions"]}
                      //  displayLookup={[this.props.elementNames.versions]}
                        displayLookup={[this.props.versionsData.versions]}
                        versionCardHandlers = {this.props.versionCardHandlers}
                    />
                </Card.Body>


            </>


        );
    }
}

export default SelectVersionsComponent;
//{this.state.names[e[1]]}
