
import 'bootstrap/dist/css/bootstrap.min.css';

import {Tab, Nav} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom';

import Axios from 'axios';

//import {InfoPanel} from  './infoPanel.js';
//import {LogPanel} from './logPanel.js';

import SelectVersionsComponent from './selectVersionsComponent.js';
//import SelectNodesComponent from './selectNodesComponent.js';
//import {SelectLabelsComponent} from './selectLabelsComponent.js'

//import {QueryComponentRWR} from './queryComponentRWR.js';
//import QueryComponentMotif from './queryComponentMotif.js';

import {PathSearchComponent} from './pathSearch.js'

import {LabelsUsed, NodeData} from './graphStructs.js';
import {VersionCards} from './versionCards.js';

import * as setLib from './setLib.js'

import './index.css';
import './sideBarMenu.css';


//TODO BUG: A lot of state is being mutated directly due to a misunderstanding, need to fix EX: switch to functional setState like currently used in the add and remove versionCard Handlers



class VersionsData{
  constructor(serverResponse){
    this.versions = [];
    this.tags = new Map();
    this.nameLookup = new Map();

    if(typeof serverResponse !== 'undefined'){
      this.versions = serverResponse.versions.map((e) => ({name:e.name, tags:e.tags}));


      serverResponse.versions.forEach((e) => {
          e.tags.forEach((t) => {
              if (!this.tags.has(t)){
                  this.tags.set(t,  [])
              }
             this.tags.get(t).push({index: e.index, name: e.name})
             this.nameLookup.set(e.name, e.index);
          })
      });
    }
  }

  //!!!Filters out the empty tagged versions when obtaining an array of all tags w/ their versions
  //Now filters out all but the PPI tagged for display as the others are used implicitly by the queries
  getDisplayedTags(){
   // return [...this.tags].filter(e => e[0] !== "Empty");
       return [...this.tags].filter(e => e[0] === "PPI");
  }


}

class App extends React.Component {
    constructor(props){

        super(props);
        this.state={

            navCollapsed: false,

//             logStruct : new LogStruct(),

            serverProps : {},


            versionsData: new VersionsData(),
            nodeData: new NodeData(), //TODO change to labelsData
            labelsUsed: new LabelsUsed(),


            backAddr  : "localhost:9060", //"129.22.31.155:28340", //"192.168.1.70:9060", //"localhost:9060",


            versionCardsO: new VersionCards(),
            versionCardPlainText : [""],

            versionCardHandlers : {
                add : this.handleAddVersionCard,
                remove : this.handleRemoveVersionCard,
                click : this.handleClickVersionCard
            }
        }


        var date = new Date();
//         try{
        let qs = JSON.stringify({cmd:"ls"})

        Axios.post('http://'+this.state.backAddr+'/ls', qs).then((response)=>{
            console.log("lsResponse", response)

            //Not used currently, for various future settings?
            let serverProps = JSON.parse(response.data.serverProps);



            this.setState({
                serverProps : serverProps,
                versionsData : new VersionsData(response.data),
                labelsUsed: new LabelsUsed(response.data),
                nodeData: new NodeData(response.data.nodes),

            }, () =>{console.log("initstate", this.state); this.handleLog("i","Ready")})

         }).catch(error => {})
//         }
//         catch{
//
//         }

    }

    //Used to update the name of a versionCard
    handleChangeVersionCardName=(cardI, newName)=>{
//         console.log("ET", event.target, event.target[0], event.target.dataset.cardi)

//         event.preventDefault();
        let versionCardsO = this.state.versionCardsO;
// //         console.log(versionCardsO.cards[event.id], event.target.id)
//         versionCardsO.cards[event.target[0].cardi].name = event.target[0].value;
//         console.log(event.target)

        versionCardsO.cards[cardI].name = newName;
        this.setState({versionCardsO : versionCardsO});
    }

    //TODO: Split the lookup and fill in nodeData from the handleSelect card
    handleNodeLookup=(names, afterLookupFn)=>{
            let queryNames = this.state.nodeData.filterKnown([...new Set(names)]);

            //Only need to make request if names are unknown
            if(queryNames.length > 0){
                Axios.post('http://'+this.state.backAddr,JSON.stringify({cmd:"lkpn", names:queryNames})).then((response)=>{

//                     console.log("R", response.data)
                    let nodeData = this.state.nodeData.update(queryNames, response.data);

                    this.setState({nodeData: nodeData}, afterLookupFn

                    );
                })
            }
            else
                afterLookupFn()
    }

    handleNodeLookupIndex=(indexes, afterLookupFn)=>{
//         console.log("wut", afterLookupFn)
        let queryIndexes = this.state.nodeData.filterKnownIndex([...new Set(indexes)]);

        //Only need to make request if names are unknown
        if(queryIndexes.length > 0){
            Axios.post('http://'+this.state.backAddr,JSON.stringify({cmd:"lkpi", ids:queryIndexes})).then((response)=>{

//                 console.log("R", response.data)
                let nodeData = this.state.nodeData.updateIndex(queryIndexes, response.data);

                this.setState({nodeData: nodeData}, afterLookupFn

                );
            })
        }
        else
            if(typeof(afterLookupFn) != 'undefined')
                afterLookupFn()
    }

    handleLog=(mtype, message)=>{
        let logStruct = this.state.logStruct;
//         this.state.logStruct.log(mtype, message);
        this.setState({logStruct: logStruct})
      //  console.log(this.state)
    }


    handleAddVersionCard=()=>{
        let versionCardPlainText = this.state.versionCardPlainText;
        versionCardPlainText.push("");
        this.setState(prevState=>({

            versionCardsO: prevState.versionCardsO.handleAddVersionCard().handleClickVersionCard(this.state.versionCardsO.cards.length-1),
            versionCardPlainText : versionCardPlainText


        }))
        console.log("PT", this.state.versionCardPlainText)
    }

    handleRemoveVersionCard=()=>{
        if(this.state.versionCardsO.cards.length <= 1)
            return;

        this.setState(prevState=>({
            versionCardsO: prevState.versionCardsO.handleRemoveVersionCard(),
             versionCardPlainText : prevState.versionCardPlainText.slice(0, Math.max(1, prevState.versionCardPlainText.length-1))
        }))
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
        if(name ==="versions_s"){
            let l = this.state.labelsUsed.getUsedLabelSum([...this.state.versionCardsO.getSelectedVersions()]);
            //console.log("labelset", l)

            //deselect labels that don't exist in the chosen integration
            versionCardsO.cards[cardId].labelsV_s = setLib.intersection(versionCardsO.cards[cardId].labelsV_s, l.nodes);
            versionCardsO.cards[cardId].labelsE_s = setLib.intersection(versionCardsO.cards[cardId].labelsE_s, l.edges);


            //Select the edges in the chosen integration by default
            versionCardsO.cards[cardId].labelsV_s = setLib.union(versionCardsO.cards[cardId].labelsV_s, l.nodes);
            versionCardsO.cards[cardId].labelsE_s = setLib.union(versionCardsO.cards[cardId].labelsE_s, l.edges);

            //console.log("displayLabels",l)
            versionCardsO.cards[cardId].displayLabels = l;
        }



        this.setState(prevState=>({
            versionCardsO: versionCardsO,
            versionCardPlainText: [...prevState.versionCardPlainText].map((e,i)=> i === cardId ? prevState.versionCardsO.card(cardId).plainText(): e)
        })/*, console.log(this.state.versionCardPlainText)*/);

//         this.setState(prevState=>({versionCardsO: prevState.versionCardsO.toggle(cardId, name,elementId)}));

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
//console.log("newStats",stats)
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
            //  console.log("lsv", response.data)
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


    renderAll(){
        return(

            <>
            {console.log(this.state)}

            <div className="mainContent">
                <div style={{left: this.state.navCollapsed ? 0 : 180}} className=" btn-secondary menuToggleButton"   onClick= {()=> {this.setState({navCollapsed: !this.state.navCollapsed}) } }></div>
                <Tab.Container  id="menu" defaultActiveKey="versions" >

                    <div className={this.state.navCollapsed ? " border-right menuContainerClosed bg-light":" border-right menuContainerOpen bg-light" } >

                        <div className=" text-dark sideElementHeading border-bottom">GraphView</div>

                            <Nav.Link eventKey="versions" className=" sideElement">Tissues</Nav.Link>
                            {/*<Nav.Link eventKey="labels" className=" sideElement">Labels</Nav.Link>*/}
                            {/*<Nav.Link eventKey="summary" className="sideElement" onClick={  this.handleUpdateCardSummaryt} >Summary</Nav.Link>*/}

                        <div className=" text-dark sideElementHeading border-bottom">Tools</div>
                            {/*<Nav.Link eventKey="nodes" className="sideElement">Nodes</Nav.Link>*/}
                            {/*<Nav.Link eventKey="query_rwr" className=" sideElement">RWR</Nav.Link>*/}
                            {/*<Nav.Link eventKey="query_motif" className=" sideElement">Motifs</Nav.Link>*/}
                            <Nav.Link eventKey="path_search" className=" sideElement">Path Explorer</Nav.Link>

                    </div>



                    <div className= "displayPanel"  style={{left: this.state.navCollapsed ? 20 : 200, width: this.state.navCollapsed ? 'calc(100% - 20px)' : 'calc(100% - 200px)'}}>
                        <Tab.Content>
          
                            <Tab.Pane eventKey="versions">
                                <SelectVersionsComponent
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}

                                    versionCardsO={this.state.versionCardsO}
                                    versionCardHandlers={this.state.versionCardHandlers}
                                    handleChangeVersionCardName={this.handleChangeVersionCardName}

                                    versionsData= {this.state.versionsData}
                                />
                            </Tab.Pane>

                            <Tab.Pane eventKey="path_search" className="pageContentArgsRight">
                                <PathSearchComponent
                                    backAddr={this.state.backAddr}
                                    getVersionDefinition={this.getVersionDefinition}
//                                     selectedVersions={this.state.versions_s}

                                    handleNodeLookupIndex={this.handleNodeLookupIndex}

                                    nodeData = {this.state.nodeData}


                                    versionCardsO={this.state.versionCardsO}
                                    versionsData={this.state.versionsData}
                                    versionCardPlainText={this.state.versionCardPlainText}
                                    handleLog={this.handleLog}
                                    labelsUsed = {this.state.labelsUsed}
                                />

                            </Tab.Pane>

                        </Tab.Content>


                    </div>

                </Tab.Container>
            </div>

        </>
        );

    }



    render(){
        return(
           // {/*<StrictMode>*/}

                <div className="windowAll">

                    <div className= "fixed-top border-bottom titleBar bg-dark"></div>
                    <div>{this.renderAll()}</div>
                  {/*  <div className="argsPlaceholder"></div>*/}

                </div>

            //{/*</StrictMode>*/}
        );
    }

}

ReactDOM.render(
<App />,
document.getElementById('root')
);
