
//This stores the bits corresponding to labels that exist in each version returned to the front end
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

    indexToName(index){
      return this.names[index].name;
    }

    bitsToNames(labelBits){
        return this.arrayToNames(this.bitsToArray(labelBits));
    }

    bitsToNamesFlat(labelBits){
        return this.bitsToNames(labelBits).map((e)=>(e.name));
    }
}

class LabelsUsed{
    constructor(serverResponse){
        this.nodeNames = new LabelSet();
        this.edgeNames = new LabelSet();
        this.edges = [];
        this.nodes = [];


        if(typeof serverResponse != 'undefined'){
            this.nodeNames = new LabelSet(serverResponse.labels.vertex.names);
            this.edgeNames = new LabelSet(serverResponse.labels.edge);

            this.edges= serverResponse.labelsUsed.edges;
            this.nodes = serverResponse.labelsUsed.nodes;

        }
    }

    nameLookupNode(bits){
      //console.log("nameLookupRes",this.nodeNames.bitsToNamesFlat(bits))
      return this.nodeNames.bitsToNamesFlat(bits);
    }
    nameLookupEdge(bits){
      return this.edgeNames.bitsToNamesFlat(bits);
    }

     getUsedLabelSum(versionsArray){
         let nodeLabelSum=0;
         let edgeLabelSum=0;
         for(let i in versionsArray){
          // console.log("i", i, this.edges[versionsArray[i]])
            nodeLabelSum = nodeLabelSum | this.nodes[versionsArray[i]];
            edgeLabelSum = edgeLabelSum | this.edges[versionsArray[i]];
         }
      //   console.log(edgeLabelSum)

         return({
           nodes : new Set(this.nodeNames.bitsToArray(nodeLabelSum)),
           edges : new Set(this.edgeNames.bitsToArray(edgeLabelSum))

        })

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
                this.indexes[serverResponse[i].id] = {name: names[i], pname: serverResponse[i].pname, labels:serverResponse[i].l, labelsText: "tmp" };
//             this.indexes.set(serverResponse[i], names[i]);
        }
        return this;
    }

    updateIndex(indexes, serverResponse){
        for (let i=0; i< indexes.length; ++i){
            this.names.set(indexes[i], serverResponse[i].name);

//             if(serverResponse[i] != -1)
            this.indexes[indexes[i]] = {name: serverResponse[i].name, pname: serverResponse[i].pname ,labels:serverResponse[i].l, labelsText: "tmp"};
//             this.indexes.set(serverResponse[i], names[i]);
        }
        return this;
    }

}


export {LabelSet, LabelsUsed, NodeData};
