#!/usr/bin/python3 

import os
import requests
import time
from time import sleep
import random
from random import sample 
import threading
import copy
import argparse
import json
import math
import numpy as npr
#let command = {cmd:"rwr2", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), 
    #topk:Number(this.state.topk), source:selectedNodes, mode:"el",
    #vertexLabels:  [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsV_s],
    #edgeLabels:  [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsE_s]
#}; 

parser = argparse.ArgumentParser()


parser.add_argument('--conn', required=True)
parser.add_argument('--ver', required=True)
parser.add_argument('--out', required=True)
parser.add_argument('--sigmaOpNorm', required=True)

args = parser.parse_args()


#random.seed(900)

url = 'http://localhost:9060'

versionPool = list(range(1,26))
#shuffle the versions so the same versions aren't covered by the normal distribution used to generate random version integrations
random.shuffle(versionPool)

sourcePool = range(1,100000)

#normProbs = list(range(len(versionPool)))

normProbs= npr.zeros(len(versionPool))
mu = len(normProbs)/2
sigma = float(args.sigmaOpNorm)*len(versionPool)

print("Real Sigma",sigma)

def norm(x):
    e1 = 1/(sigma*math.sqrt(2*math.pi))
    ep = pow(math.e, (-.5 * pow(((x-mu)/sigma),2 )))
    return e1* ep



for i in range(len(normProbs)):
    #print(i)
    normProbs[i] = norm(i+1)
    #round(norm(i),6)


normProbs /= normProbs.sum()

print(versionPool)
print(normProbs)

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
    
    #print(npr.random.choice(versionPool, int(args.ver), normProbs))
    
    req["versions"] = list(npr.random.choice(versionPool, int(args.ver), p=normProbs, replace=False))
    #req["source"] = list(map(lambda x: nodeToJson(x),sample(sourcePool,1)))
    
    
    return  str(req["versions"]), str(req["source"]), str(req).replace(" ", "").replace("\'","\"")
    



def sendQuery():
    ts = time.perf_counter()
    
    ver, src,  Q = generateQuery()
    
    print(Q)
    
    r = requests.post(url, Q)
    
    timeTaken = time.perf_counter() - ts
    
    #print(r.content.decode('UTF-8'))
    #parse the returned data for 
    stats = json.loads(r.content) 
    

    with open(args.out, "a") as out:
        out.write(args.sigmaOpNorm + "\t")
        out.write(str(timeTaken) + "\t" + str(stats["debug"]['rwr']['nodes']) + "\t" + str(stats["debug"]['rwr']['edges']))
        out.write(args.ver + "\t" + args.conn + "\t" + ver + "\t" + src + "\t")
        out.write(str(stats["debug"]['rwr']["iter"]) + "\t" + str(stats["debug"]['timing']["compute"]) + "\t" + str(stats["debug"]['timing']["integrate"]) + "\n")
        



def main():
    
    #write header if blank
    with open(args.out, "a") as out:
        if os.path.getsize(args.out) == 0:
            out.write('\t'.join(["SigmaNorm", "pytime", "Nodes", "Edges", "Versions", "Connections", "VersionsL", "Source", "Iterations", "Compute Time", "Integrate Time"]) + "\n")
    
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
