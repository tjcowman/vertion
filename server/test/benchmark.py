#!/usr/bin/python3 

import requests
import time
from time import sleep
import random
from random import sample 
import threading
import copy
import argparse
import json
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
sourcePool = range(1,100000)



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
    
    
    return  str(req["versions"]), str(req["source"]), str(req).replace(" ", "").replace("\'","\"")
    



def sendQuery():
    ts = time.perf_counter()
    
    ver, src,  Q = generateQuery()
    r = requests.post(url, Q)
    
    timeTaken = time.perf_counter() - ts
    
    #print(r.content.decode('UTF-8'))
    #parse the returned data for 
    stats = json.loads(r.content) 
    

    with open(args.out, "a") as out:
        out.write(str(timeTaken) + "\t")
        out.write(args.ver + "\t" + args.conn + "\t" + ver + "\t" + src + "\t")
        out.write(str(stats["debug"]['rwr']["iter"]) + "\t" + str(stats["debug"]['timing']["compute"]) + "\t" + str(stats["debug"]['timing']["integrate"]) + "\n")
        



def main():
    
    with open(args.out, "a") as out:
        out.write('\t'.join(["pytime", "Versions", "Connections", "VersionsL", "Source", "Iterations", "Compute Time", "Integrate Time"]) + "\n")
    
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
