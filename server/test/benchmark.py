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


parser = argparse.ArgumentParser()

parser.add_argument('--replicates', required=True)

parser.add_argument('--connections', required=True)
parser.add_argument('--versions', required=True)
parser.add_argument('--out', required=True)
parser.add_argument('--sigmaOpNorms', required=True)

args = parser.parse_args()


#random.seed(900)

url = 'http://129.22.31.155:28340'
#'http://localhost:9060'

versionPool = list(range(1,26))
#shuffle the versions so the same versions aren't covered by the normal distribution used to generate random version integrations
random.shuffle(versionPool)

sourcePool = range(1,100000)

#normProbs= npr.zeros(len(versionPool))
#mu = len(normProbs)/2
#sigma = float(args.sigmaOpNorm)*len(versionPool)

#print("Real Sigma",sigma)

def norm(x, sigma, mu):
    e1 = 1/(sigma*math.sqrt(2*math.pi))
    ep = pow(math.e, (-.5 * pow(((x-mu)/sigma),2 )))
    return e1* ep



#for i in range(len(normProbs)):
    ##print(i)
    #normProbs[i] = norm(i+1)
    ##round(norm(i),6)


#normProbs /= normProbs.sum()



def generateProbs(sigmaOpNorm):
    
    normProbs= npr.zeros(len(versionPool))

    mu = len(normProbs)/2
    sigma = float(sigmaOpNorm)*len(versionPool)



    for i in range(len(normProbs)):
        normProbs[i] = norm(i+1, sigma, mu)
    
    normProbs /= normProbs.sum()
    
    #print(normProbs)
    
    return(normProbs)



#normProbs /= normProbs.sum()


#print(versionPool)





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

def generateQuery(normProbs, numVersions):
    req = copy.deepcopy(requestArgsDefault)
    
    #print(npr.random.choice(versionPool, int(args.ver), normProbs))
    
    req["versions"] = list(npr.random.choice(versionPool, numVersions, p=normProbs, replace=False))
    #req["source"] = list(map(lambda x: nodeToJson(x),sample(sourcePool,1)))
    
    print(str(req).replace(" ", "").replace("\'","\""))
    return  str(req["versions"]), str(req["source"]), str(req).replace(" ", "").replace("\'","\"")
    



def sendQuery(repId, thrId, sigmaOpNorm, numVersions, numConnections ):
    ts = time.perf_counter()
    
    normProbs = generateProbs(sigmaOpNorm)
    
    ver, src,  Q = generateQuery(normProbs, numVersions)
    
    #print(Q)
    
    try:
        r = requests.post(url, Q)
    except Exception as e:
        with open(args.out, "a") as out:
            out.write('\t'.join(["FAIL", str(repId), str(thrId), str(sigmaOpNorm),
                                 str(0), str(0), str(0), 
                                 str(numVersions), str(numConnections) , ver, src,
                                 str(0), str(0), str(0)
                                ]) + "\n")
            
    else:
        timeTaken = time.perf_counter() - ts
        

        stats = json.loads(r.content) 
        

        with open(args.out, "a") as out:
            out.write('\t'.join(["SUCC", str(repId), str(thrId), str(sigmaOpNorm),
                                 str(timeTaken), str(stats["debug"]['rwr']['nodes']), str(stats["debug"]['rwr']['edges']),
                                 str(numVersions), str(numConnections) , ver, src, 
                                 str(stats["debug"]['rwr']["iter"]), str(stats["debug"]['timing']["compute"]), str(stats["debug"]['timing']["integrate"]),
                                ]) + "\n")



def main():
    
    #write header if blank
    with open(args.out, "a") as out:
        if os.path.getsize(args.out) == 0:
            out.write('\t'.join(["State", "RepId", "ThreadId", "SigmaNorm", "pytime", "Nodes", "Edges", "Versions", "Connections", "VersionsL", "Source", "Iterations", "Compute Time", "Integrate Time"]) + "\n")
    
    threads = list()
 
 
    sigmaOpNorms = list(map(lambda x : float(x),str.split(args.sigmaOpNorms, ',')))
    #print(sigmaOpNorms)
    versions = list(map(lambda x : int(x),str.split(args.versions, ',')))
    connections = list(map(lambda x : int(x),str.split(args.connections, ',')))
    #conns = 
 
    for rep in range(0, int(args.replicates)):
        for v in versions:
            for c in connections:
                for s in sigmaOpNorms:
    
                    for i in range(0, c):
                        results = threading.Thread(target=sendQuery, args=(rep, i, s, v, c,))
                        threads.append(results)
                        results.start()
                
                    
                    print("sent Queries")
                    for t in threads:
                        t.join()
        


if __name__ == "__main__":
    main()
