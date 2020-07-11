class CardSummary{
  constructor(serverResponse, cardId, name){
  //  this.name = name;
    this.nodes = [];
    this.edges = [];
    this.components = [];

    if(serverResponse !== undefined ){
      this.cardId = cardId;
      this.nodes = serverResponse.nodes;
      this.edges = serverResponse.edges;
      this.components = serverResponse.components;
    }
  }

}

class VersionCard{
    constructor(name){
        this.name = name;
        this.isStale = false;
        this.versions_s = new Set();
        this.nodes_s =  new Set();
        this.labelsV_s = new Set();
        this.labelsE_s = new Set();

        this.displayLabels = {nodes: new Set(), edges : new Set()};

        this.summary = new CardSummary();

        this.stats = {
            nodes: [

            ],
            edges: [

            ]
        };
    }

    toggle=(name, elementId)=>{

        let ns = this[name];

        if(this[name].has(elementId)){
            ns.delete(elementId);
        }
        else{
            ns.add(elementId);
        }


        this[name] = ns;
        this.isStale = true;

    }

    checkToggle=(name, elementId)=>{
         return this[name].has(elementId);
    }

}

class VersionCards{
    constructor(){
        this.cards = [new VersionCard('set 0')];
        this.activeCard = 0;
    }

    updateSummary=(cardId,data)=>{
      this.cards[cardId].summary = new CardSummary(data, cardId);
      this.cards[cardId].summary.name =this.cards[cardId].name;
    }

    getActiveCard=()=>{
      return this.cards[this.activeCard];
    }

    getSelectedVersions=()=>{
        return this.cards[this.activeCard].versions_s;
    }

    push=()=>{
        this.cards.push(new VersionCard('set '+this.cards.length));

    }

    pop=()=>{
        this.cards.pop();
    }

    getSummaryLabelsUsed=(kind, by, cardIds)=>{
      let labels = new Set();
//       console.log(cardIds)
      if(by === "any"){
        for(let i of cardIds){
//           console.log('cards',this.cards,i)
          labels.add(this.cards[i].summary[kind]);
        }
      }
//       console.log('sumlab', labels)
      return labels;
    }

    
    //Used to get the relevant properties defining a version on the server, versions/labels/etc
    getVersionDefinition=(versionIndex)=>{
        
        //TEMP
        if(versionIndex === "T")
            return {versions:[1,20,21,22], vertexLabels:[0,1,2], edgeLabels:[0,1,2,3]}
        
        let versions =  [...this.cards[versionIndex].versions_s];
        if(versions.length === 0)
        {
//             this.handleLog("e", "no versions");
            return null;
        }
        
        let v = { 
            versions:versions, 
            vertexLabels: [...this.cards[versionIndex].labelsV_s],
            edgeLabels:  [...this.cards[versionIndex].labelsE_s],
        };
        return v;
    }
    
    handleAddVersionCard=()=>{
        this.push();
        return this;
    }

    handleRemoveVersionCard=()=>{
        if (this.cards.length <=1)
            return;
        this.cards.pop();
        this.activeCard = Math.min(this.activeCard, this.cards.length-1);
        return this;
    }

    handleClickVersionCard=(id)=>{
        this.activeCard = id;
        return this;
    }

}

export{VersionCards, VersionCard}
