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
      console.log(cardIds)
      if(by === "any"){
        for(let i of cardIds){
          console.log('cards',this.cards,i)
          labels.add(this.cards[i].summary[kind]);
        }
      }
      console.log('sumlab', labels)
      return labels;
    }

    handleAddVersionCard=()=>{
        this.push();
//         let versionCardsO = this.state.versionCardsO;
//         versionCardsO.push();
//
//         this.setState({versionCardsO: versionCardsO});
    }

    handleRemoveVersionCard=()=>{
        if (this.cards.length <=1)
            return;
        this.cards.pop();
        this.activeCard = Math.min(this.activeCard, this.cards.length-1);
       /*
        if(this.state.versionCardsO.cards.length <= 1)
            return;

        let versionCardsO = this.state.versionCardsO;
        versionCardsO.pop();

        this.setState({
            versionCardsO: versionCardsO,
            activeVersionCard : Math.min(this.state.activeVersionCard, versionCardsO.cards.length-1)
        });*/
    }

    handleClickVersionCard=(id)=>{
//         this.setState({activeVersionCard: id})
        this.activeCard = id;
    }

}

export{VersionCards, VersionCard}
