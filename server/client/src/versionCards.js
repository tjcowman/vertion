class VersionCard{
    constructor(){
        this.isStale = false;
        this.versions_s = new Set();          
        this.nodes_s =  new Set();
        this.labelsV_s = new Set();
        this.labelsE_s = new Set();
        
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
        this.cards = [new VersionCard()];
        this.activeCard = 0;
    }
    
    
    push=()=>{
        this.cards.push(new VersionCard());

    }
    
    pop=()=>{
        this.cards.pop();
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
