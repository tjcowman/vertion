
class LabelSet{
    constructor(names){
        this.names = []
        
        if(typeof names != 'undefined'){
            this.names = names.map((e)=>({name:e}));
        }
    }
    
    bitsToArray(labelBits){
        let indexes = [];
        for(let i=0; i<this.names.length; ++i) {
            if (labelBits & 0x1)
                indexes.push(i);
        
            labelBits = labelBits >> 1;
        }
        return indexes;
    }
  
    arrayToNames(labelArray){
        let names=[];

        for(let e in labelArray)
            names.push(this.names[labelArray[e]]);
            
        return names;
    }
    
    bitsToNames(labelBits){
        return this.arrayToNames(this.bitsToArray(labelBits));
    }
  
    bitsToNamesFlat(labelBits){
        return this.bitsToNames(labelBits).map((e)=>(e.name));
    }
}

//Holds the result of nodeLookup queries to the server so the same node name isn't queried twice
class NodeData{
    constructor(numNodes){
//         this.indexes = new Map();
        this.indexes = new Array(numNodes)
        this.names = new Map();
            
    }
    
    getIndex(name){
        return this.names.get(name);
    }
    getEntry(index){
        return this.indexes[index];
    }
    
    //Returns the names that have not been looked up yet
    filterKnown(names){
        let unknownNames = names.filter((e) => (!this.names.has(e)))
        return unknownNames;
    }
    
    filterKnownIndex(indexes){
        return indexes.filter((e)=>(this.indexes[e]) == null )
    }
    
    //Takes a array of pairs corresponding to the name : index of nodes
    update(names, serverResponse){
        for (let i=0; i< names.length; ++i){
            this.names.set(names[i], serverResponse[i].id);
            if(serverResponse[i] !== -1)
                this.indexes[serverResponse[i].id] = {name: names[i], labels:serverResponse[i].l, labelsText: "tmp" };
//             this.indexes.set(serverResponse[i], names[i]);
        }
        return this;
    }
    
    updateIndex(indexes, serverResponse){
        for (let i=0; i< indexes.length; ++i){
            this.names.set(indexes[i], serverResponse[i].name);
//             if(serverResponse[i] != -1)
            this.indexes[indexes[i]] = {name: serverResponse[i].name, labels:serverResponse[i].l, labelsText: "tmp"};
//             this.indexes.set(serverResponse[i], names[i]);
        }
        return this;
    }
    
}


export {LabelSet, NodeData};
