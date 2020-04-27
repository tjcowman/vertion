import { StrictMode} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import {Tab, Nav,} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom';

import Axios from 'axios';

import {InfoPanel} from  './infoPanel.js';
import {LogPanel} from './logPanel.js';

import SelectVersionsComponent from './selectVersionsComponent.js';
import SelectNodesComponent from './selectNodesComponent.js';
import {SelectLabelsComponent} from './selectLabelsComponent.js'

import {QueryComponentRWR} from './queryComponentRWR.js';
import QueryComponentMotif from './queryComponentMotif.js';

import {LabelSet, LabelsUsed, NodeData} from './graphStructs.js';
import {VersionCards, VersionCard} from './versionCards.js';

import * as setLib from './setLib.js'

import './index.css';
import './sideBarMenu.css';


class LogStruct{
    //{type, text, count(calculated)}

    constructor(){
      this.messages = [];
    }

    mostRecent(){
      return this.messages[this.messages.length-1];
    }

    log(mtype, message){
//console.log("m1", this.mostRecent(), "m2",message)
        if( !(this.mostRecent() === undefined) && this.mostRecent().text === message){
          this.mostRecent().count +=1;

        }
        else
            this.messages.push({type :  mtype, text: message, count: 1});

    }
}




class VersionsData{
  constructor(serverResponse){
    this.versions = [];
    this.tags = new Map();

    if(typeof serverResponse !== 'undefined'){
      this.versions = serverResponse.versions.map((e) => ({name:e.name, tags:e.tags}));


      serverResponse.versions.forEach((e) => {
          e.tags.forEach((t) => {
              if (!this.tags.has(t)){
                  this.tags.set(t,  [])
              }
             this.tags.get(t).push({index: e.index, name: e.name})
          })
      });
    }
  }

  //Filters out the empty tagged versions when obtaining an array of all tags w/ their versions
  getDisplayedTags(){
    return [...this.tags].filter(e => e[0] != "Empty");
  }


}

class App extends React.Component {
    constructor(props){

        super(props);
        this.state={
            logStruct : new LogStruct(),

            serverProps : {},


            versionsData: new VersionsData(),
            nodeData: new NodeData(), //TODO change to labelsData
            labelsUsed: new LabelsUsed(),


            backAddr  : "192.168.1.19:9060",


            versionCardsO: new VersionCards(),
            versionCardHandlers : {
                add : this.handleAddVersionCard,
                remove : this.handleRemoveVersionCard,
                click : this.handleClickVersionCard
            }
        }

//         console.log(versionCardHandlers);

        var date = new Date();
        Axios.get('http://'+this.state.backAddr+'/ls', date.getTime()).then((response)=>{
            console.log("lsResponse", response)

            //Not used currently, for various future settings?
            let serverProps = JSON.parse(response.data.serverProps);



            this.setState({
                serverProps : serverProps,
                versionsData : new VersionsData(response.data),
                labelsUsed: new LabelsUsed(response.data),
                nodeData: new NodeData(response.data.nodes),

            }, () =>{console.log("initstate", this.state); this.handleLog("i","Ready")})

         })

    }

    //TODO: Split the lookup and fill in nodeData from the handleSelect card
    handleNodeLookup=(names, afterLookupFn)=>{
            let queryNames = this.state.nodeData.filterKnown(names);

            //Only need to make request if names are unknown
            if(queryNames.length > 0){
                Axios.post('http://'+this.state.backAddr,JSON.stringify({cmd:"lkpn", names:queryNames})).then((response)=>{

                    console.log("R", response.data)
                    let nodeData = this.state.nodeData.update(queryNames, response.data);

                    this.setState({nodeData: nodeData}, afterLookupFn

                    );
                })
            }
            else
                afterLookupFn()
    }

    handleNodeLookupIndex=(indexes, afterLookupFn)=>{
        let queryIndexes = this.state.nodeData.filterKnownIndex(indexes);

        //Only need to make request if names are unknown
        if(queryIndexes.length > 0){
            Axios.post('http://'+this.state.backAddr,JSON.stringify({cmd:"lkpi", ids:queryIndexes})).then((response)=>{

                console.log("R", response.data)
                let nodeData = this.state.nodeData.updateIndex(queryIndexes, response.data);

                this.setState({nodeData: nodeData}, afterLookupFn

                );
            })
        }
        else
            afterLookupFn()
    }

    handleLog=(mtype, message)=>{
        let logStruct = this.state.logStruct;
        this.state.logStruct.log(mtype, message);
        this.setState({logStruct, logStruct})
      //  console.log(this.state)
    }


    handleAddVersionCard=()=>{
        let versionCardsO = this.state.versionCardsO;
        this.state.versionCardsO.handleAddVersionCard();

        this.setState({versionCardsO: versionCardsO}, this.handleClickVersionCard(this.state.versionCardsO.cards.length-1));
    }

    handleRemoveVersionCard=()=>{
        if(this.state.versionCardsO.cards.length <= 1)
            return;

        let versionCardsO = this.state.versionCardsO;
        this.state.versionCardsO.handleRemoveVersionCard();

        this.setState({
            versionCardsO: versionCardsO,
            activeVersionCard : Math.min(this.state.activeVersionCard, versionCardsO.cards.length-1)
        });
    }

    handleClickVersionCard=(id)=>{
        let versionCardsO = this.state.versionCardsO;
        this.state.versionCardsO.handleClickVersionCard(id);
        this.setState({versionCardsO: versionCardsO});
    }




    handleToggle=(name, cardId, elementId)=>{

//         console.log("DB", name, cardId, elementId)
        let versionCardsO = this.state.versionCardsO;
        versionCardsO.cards[cardId].toggle(name,elementId);

        //check to see whta else needs to be updated
        if(name =="versions_s"){
            let l = this.state.labelsUsed.getUsedLabelSum([...this.state.versionCardsO.getSelectedVersions()]);
            console.log("labelset", l)

            //deselect labels that don't exist in the chosen integration
            versionCardsO.cards[cardId].labelsV_s = setLib.intersection(versionCardsO.cards[cardId].labelsV_s, l.nodes);
            versionCardsO.cards[cardId].labelsE_s = setLib.intersection(versionCardsO.cards[cardId].labelsE_s, l.edges);


            //Select the edges in the chosen integration by default
            versionCardsO.cards[cardId].labelsV_s = setLib.union(versionCardsO.cards[cardId].labelsV_s, l.nodes);
            versionCardsO.cards[cardId].labelsE_s = setLib.union(versionCardsO.cards[cardId].labelsE_s, l.edges);

            console.log("displayLabels",l)
            versionCardsO.cards[cardId].displayLabels = l;
        }

        this.setState({versionCardsO: versionCardsO});
//         console.log("VC ", this.state.versionCardsO)
    }

    handleCheckToggle=(name,cardId, elementId)=>{
        return this.state.versionCardsO.cards[cardId][name].has(elementId);
    }

    handleSelect=(name, cardId, elementId)=>{
        if( elementId !== -1 & !this.state.versionCardsO.cards[cardId][name].has(elementId))
            this.handleToggle(name, cardId, elementId)
    }


    handleUpdateCardSummary=(cardId, stats)=>{
      let versionCardsO = this.state.versionCardsO;

      versionCardsO.updateSummary(cardId, stats);
console.log("newStats",stats)
    //  versionCardsO.cards[cardId].stats.name = cardId;
      versionCardsO.cards[cardId].isStale=false;

      //I think this handles making sure it doesnt set stale false with old selection values
      this.setState((prevState) =>({versionCardsO: versionCardsO}));

    }

    ust=(id)=>{
      if(this.state.versionCardsO.cards[id].isStale){
          let command = {
              cmd: 'lsv',
              versions:  [...this.state.versionCardsO.cards[id].versions_s],
              vertexLabels: [...this.state.versionCardsO.cards[id].labelsV_s],
              edgeLabels: [...this.state.versionCardsO.cards[id].labelsE_s],
          }
          console.log("command",command)

          Axios.post('http://'+this.state.backAddr, JSON.stringify(command)).then((response)=>{
              this.handleUpdateCardSummary(id, response.data);
              console.log("lsv", response.data)
          });
      }
    }

    //Is called when the summary tab is clicked to update all of the now stale cards
    handleUpdateCardSummaryt=()=>{
    //  let versionCardsO = this.state.versionCardsO;

      for(let c in this.state.versionCardsO.cards){
        console.log("c",c)
        this.ust(c)

      }
    }


    renderMainPanel5(){
        return(
            <div className="mainContent">
                <Tab.Container id="menu" defaultActiveKey="versions" >

                    <div className=" border-right menuContainer bg-light">


                        <div className=" text-dark sideElementHeading border-bottom">GraphView</div>


                            <Nav.Link eventKey="versions" className=" sideElement">Versions</Nav.Link>
                            <Nav.Link eventKey="labels" className=" sideElement">Labels</Nav.Link>
                            <Nav.Link eventKey="summary" className="sideElement" onClick={  this.handleUpdateCardSummaryt} >Summary</Nav.Link>

                        <div className=" text-dark sideElementHeading border-bottom">Queries</div>
                            <Nav.Link eventKey="nodes" className="sideElement">Nodes</Nav.Link>
                            <Nav.Link eventKey="query_rwr" className=" sideElement">RWR</Nav.Link>
                            <Nav.Link eventKey="query_motif" className=" sideElement">Motifs</Nav.Link>


                    </div>



                    <div className= "displayPanel">
                        <Tab.Content>
                            <Tab.Pane eventKey="summary">
                                <InfoPanel
                                    backAddr={this.state.backAddr}

                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    handleUpdateStats= {this.handleUpdateStats}
                                    handleUpdateCardSummary={this.handleUpdateCardSummary}

                                    versionCardsO={this.state.versionCardsO}
                                    labelsUsed = {this.state.labelsUsed}
                            />
                            </Tab.Pane>

                            <Tab.Pane eventKey="versions">
                                <SelectVersionsComponent
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}

                                    versionCardsO={this.state.versionCardsO}
                                    versionCardHandlers={this.state.versionCardHandlers}

                                    versionsData= {this.state.versionsData}
                                />
                            </Tab.Pane>

                            <Tab.Pane eventKey="labels">
                                <SelectLabelsComponent
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}

                                    versionCardsO={this.state.versionCardsO}
                                    versionCardHandlers={this.state.versionCardHandlers}

                                    labelsUsed = {this.state.labelsUsed}
                                />
                            </Tab.Pane>

                            <Tab.Pane eventKey="nodes">
                                <SelectNodesComponent
                                    backAddr={this.state.backAddr}
                                    nodeData={this.state.nodeData}

                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    handleSelect={this.handleSelect}

                                    handleNodeLookup={this.handleNodeLookup}

                                    versionCardsO={this.state.versionCardsO}
                                    versionCardHandlers={this.state.versionCardHandlers}
                                />

                            </Tab.Pane>

                            <Tab.Pane eventKey="query_rwr">
                                <QueryComponentRWR
                                    backAddr={this.state.backAddr}
                                    selectedVersions={this.state.versions_s}

                                    handleNodeLookupIndex={this.handleNodeLookupIndex}

                                    nodeData = {this.state.nodeData}


                                    versionCardsO={this.state.versionCardsO}

                                    handleLog={this.handleLog}
                                />
                            </Tab.Pane>
                                {/*
                            <Tab.Pane eventKey="query_motif">
                                <QueryComponentMotif
                                    selectedVersions={this.state.versions_s}
                                    getVertexDataRow={this.getVertexDataRow}
                                    getLabels={this.getLabels}
                                    selectedNodes={this.state.nodes_s}
                                />
                            </Tab.Pane>
                            */}

                        </Tab.Content>


                    </div>

                </Tab.Container>

                    <div className="rightBar border-left bg-light">

                    </div>

                <div className="logBar border-top">
                    <LogPanel
                        logStruct={this.state.logStruct}
                    />
                </div>

            </div>


        );

    }



    render(){
//         console.log("RE", this.state.graphData.vertexData)
        return(
            <StrictMode>
                <div className="windowAll">
                    <div className= "fixed-top border-bottom titleBar bg-dark">
                    </div>


                    <div className= "displayPanel2">
                        {this.renderMainPanel5()}
                    </div>
                </div>

            </StrictMode>
        );
    }

}

ReactDOM.render(
<App />,
document.getElementById('root')
);
