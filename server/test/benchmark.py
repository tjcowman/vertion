#!/usr/bin/python3 

import requests
import time
from time import sleep
import random
from random import sample 
import threading
import copy
import argparse
#let command = {cmd:"rwr2", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), 
    #topk:Number(this.state.topk), source:selectedNodes, mode:"el",
    #vertexLabels:  [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsV_s],
    #edgeLabels:  [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsE_s]
#}; 

parser = argparse.ArgumentParser()


parser.add_argument('--conn', required=True)
parser.add_argument('--ver', required=True)
parser.add_argument('--out', required=True)

args = parser.parse_args()


random.seed(900)

url = 'http://localhost:9060'
versionPool = range(1,26)
sourcePool = range(1,1000)



requestArgsDefault = {
    "versions" : [1],
    "edgeLabels" : [],
    "vertexLabels" : [],

    #Probably don't need to vary
    
    "cmd" : 'rwr2',
    "mode" : "el",
    
    "source" : [],
    "alpha" : .15,
    "epsilon" : 1e-12,
    "topk" : 0 
};

def nodeToJson(index):
    return {
        "i" : index,
        "v" : 1
    }

def generateQuery():
    req = copy.deepcopy(requestArgsDefault)
    req["versions"] = sample(versionPool, int(args.ver))
    req["source"] = list(map(lambda x: nodeToJson(x),sample(sourcePool,1)))
    
    
    return str(req).replace(" ", "").replace("\'","\"")
    



def sendQuery():
    ts = time.perf_counter()
    
    r = requests.post(url, generateQuery())
    
    timeTaken = time.perf_counter() - ts
    
    #parse the returned data for 
    stats = r.json();
    
    print(stats)
    
    with open(args.out, "a") as out:
        out.write(str(timeTaken) + "\n")



def main():
    threads = list()
 
    for i in range(0, int(args.conn)):
        #print(generateQuery())
        #sendQuery()
        results = threading.Thread(target=sendQuery)
        threads.append(results)
        results.start()
 
    
    for t in threads:
        t.join()
        
    #versionSize = 2
    #threads = list()
 
    #for i in range(256):
        ##sleep(.00001)
        #req = copy.deepcopy(requestArgs)
        #req["versions"] = sample(versionPool,versionSize)
        ##req["source"] = nodeToJson(sample(sourcePool,1))
        #req["source"] = list(map(lambda x: nodeToJson(x),sample(sourcePool,1)))
        ##time = runIter(requestArgs)
        ##print(requestArgs)
        #time = threading.Thread(target=runIter, args=(requestArgs,))
        #threads.append(time)
        #time.start()
        ##print(time)
    #print("queries sent")


if __name__ == "__main__":
    main()
