#!/usr/bin/python3 

import requests
import time
from time import sleep
import random
from random import sample 
import threading

#let command = {cmd:"rwr2", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), 
    #topk:Number(this.state.topk), source:selectedNodes, mode:"el",
    #vertexLabels:  [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsV_s],
    #edgeLabels:  [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsE_s]
#}; 
random.seed(900)

url = 'http://localhost:9060'

versionPool = range(1,26)
sourcePool = range(1,1000)

requestArgs = {
    "versions" : [1],
    "edgeLabels" : [],
    "vertexLabels" : [],

    #Probably don't need to vary
    
    "cmd" : 'rwr2',
    "mode" : "el",
    
    "source" : [],
    "alpha" : .15,
    "epsilon" : 1e-12,
    "topk" : 5 
};


def nodeToJson(index):
    return {
        "i" : index,
        "v" : 1
    }

def runIter(requestArgs):
    ts = time.perf_counter()
    
    r = requests.post(url, str(requestArgs).replace(" ", "").replace("\'","\""))
    
    tt = time.perf_counter() - ts
    
    
    #print(r.content)
    print(tt)
    return tt

def main():
 
    versionSize = 2
    threads = list()
 
    for i in range(256):
        #sleep(.00001)
        req = requestArgs
        req["versions"] = sample(versionPool,versionSize)
        #req["source"] = nodeToJson(sample(sourcePool,1))
        req["source"] = list(map(lambda x: nodeToJson(x),sample(sourcePool,1)))
        #time = runIter(requestArgs)
        #print(requestArgs)
        time = threading.Thread(target=runIter, args=(requestArgs,))
        threads.append(time)
        time.start()
        #print(time)
    print("queries sent")


if __name__ == "__main__":
    main()
