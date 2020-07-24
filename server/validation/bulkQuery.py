#! /usr/bin/python3
import math
import requests
import json

import numpy as np 
from functools import reduce
from statistics import mean, stdev

import itertools 
flatten = itertools.chain.from_iterable

hostname = 'http://localhost:9060/'


#Interaction 1
#Harboring 2
#Phosphorylation 4
#Co-Occurrence 8
#mechanisticLabel = 


def bitExtract(n) :
    ids = []
    counter = 0
    while n > 0:
        if n % 2 > 0:
            ids.append(counter)
        counter+=1
        n = n >> 1
    return ids



class ServerState:
    def __init__(self, hostname):
        self.hostname = hostname
        self.nodeData = []  
        self.nodeNameMap = dict()
        
        self.updateFromManifest()
        
    def updateFromManifest(self):
        rls =requests.get(hostname+'ls').json()
        self.nodeData = [None] * rls['nodes']
        self.versionClasses = determineVersionClass(rls)
        self.edgeLabelBitMaps = getEdgeLabelBitMaps(rls)
        self.nodeLabelBitMaps = getNodeLabelBitMaps(rls)
        
    def lookupNames(self, nameList):
        nameListQ = list(filter(lambda x : x not in self.nodeNameMap,nameList))
        
        if len(nameListQ) > 0:
            rq = requests.post(hostname, data=json.dumps({'cmd':'lkpn', 'names':nameListQ}))
        
            #update the newly acquired elements
            for i, e in enumerate(rq.json()):
                self.nodeNameMap[nameListQ[i]] = e['id']
                if e['id'] != -1:
                    self.nodeData[e['id']] = {'name' : nameListQ[i], 'label': e['l'] }
        
        return map(lambda x: self.nodeNameMap[x],nameList)

    #Like regular lookup, except looks up an converts the specified input column
    def lookupNameCol(self, matrix, nameCol):
        #print(matrix)
        ids = list(self.lookupNames(list((map(lambda x : x[nameCol], matrix)))))
        for i,row in enumerate(matrix):
            #print(i, row)
            row[nameCol] = ids[i]
            
        return matrix
        #print(names)

    #Gets the full version definition for a set of version indexes (Selects all node and edge labe;s)
    def versionDef(self,versions):
        nodeLabelBits = map(lambda x: self.nodeLabelBitMaps[x] ,versions)
        nodeLabelBits = reduce(lambda x1,x2 : x1|x2 ,nodeLabelBits)
    
        edgeLabelBits = map(lambda x: self.edgeLabelBitMaps[x] ,versions)
        edgeLabelBits = reduce(lambda x1,x2 : x1|x2 ,edgeLabelBits)
        
        #return {'versions' : versions, 'vertexLabels' : bitExtract(nodeLabelBits), 'edgeLabels' : bitExtract(edgeLabelBits)}
        return {'versions' : [versions], 'vertexLabels' : [bitExtract(nodeLabelBits)], 'edgeLabels' : [bitExtract(edgeLabelBits)]}
    
class Path:
    def __init__(self, serverResponse):
        self.nodeScore=serverResponse['nodeScore']
        self.direction=serverResponse['direction']
        self.nodes= serverResponse['nodes']
        self.edgeLabels= serverResponse['edgeLabels']
        self.totalWeight = serverResponse['totalWeight']
        
        #Get the nodes and eges used
        self.nodeSet = set(self.nodes)
        self.edgeSet = set()
        for i in range(0,len(self.nodes)-1):
            self.edgeSet.add(str(self.nodes[i]) + str(self.nodes[i+1]))
        
    def proportionPPI(self):
        return len(list(filter(lambda x: x == 1, self.edgeLabels)))/len(self.edgeLabels)
        
    def __repr__(self):
        return str(self.nodeScore) + '\n' + str(self.nodes)
        
class PathTree:
    def __init__(self, serverResponse ):
        self.paths = []
        self.pathsSelected = []
        
        for path in serverResponse:
            self.paths.append(Path(path))
            
        #sort the obtained paths by ther total computed weightFraction
        self.paths.sort(key =lambda x: x.nodeScore)
            
        self.nodeSet = reduce(lambda x1,x2 : x1.union(x2), map( lambda x: x.nodeSet, self.paths))
        self.edgeSet = reduce(lambda x1,x2 : x1.union(x2), map( lambda x: x.edgeSet, self.paths))
        
    def getPathMeasure(self, FnMeasure):
        #paths=self.getPaths()
        return map(lambda p: FnMeasure(p), self.pathsSelected)
        
    def getPaths(self, ):
            return self.pathsSelected

    #Uses the current topk to determine whether the pathTree needs to recalculate the node and edgeSets
    def getNodeSet(self ):
            return self.nodeSet

    def getEdgeSet(self):
            return self.edgeSet

    def updateIntegration(self, topkScore, topk):
        pathslice = self.paths[0: math.floor((len(self.paths)-1)*topkScore)]
        pathslice.sort(key =lambda x: x.totalWeight)
        
        self.pathsSelected =pathslice[0:topk]
        #print(self.pathsSelected.edgeLabels)
        self.nodeSet = reduce(lambda x1,x2 : x1.union(x2), map( lambda x: x.nodeSet, self.pathsSelected))
        self.edgeSet = reduce(lambda x1,x2 : x1.union(x2), map( lambda x: x.edgeSet, self.pathsSelected))
        self.topk=topk
        self.topkScore=topkScore

    def __repr__(self, topk = float('inf')):
        return '\n'.join(map(str,self.paths))
        
class PathForest:
    def __init__(self, serverResponse):
        self.trees = []
        self.topk = -1
        self.topScore = -1
        
        for tree in serverResponse['trees']:
            self.trees.append(PathTree(tree))
            
            
    def __repr__(self):
        return '\n'.join(map(str, self.trees))
    
    
    def scoreFilter(self,topkScore, topk):
        for tree in self.trees:
            tree.updateIntegration(topkScore, topk)
        
    def summarize(self,pathMeasureFn):
        return  [mean(list(flatten(map(lambda tree: tree.getPathMeasure(pathMeasureFn), self.trees)))),
                stdev(list(flatten(map(lambda tree: tree.getPathMeasure(pathMeasureFn), self.trees))))]
    
    def setOperation(self, setOp ):
        return [
            len(reduce(setOp, map(lambda x: x.getNodeSet(), self.trees))),
            len(reduce(setOp, map(lambda x: x.getEdgeSet(), self.trees)))
        ]

    def proportionPPI(self):
        #return mean(map(lambda x: x.proportionPPI(), self.trees))
        #return mean(list(flatten(map(lambda tree: tree.getPathMeasure(lambda x: x.proportionPPI()), self.trees))))
        return self.summarize(lambda x: x.proportionPPI())
    
    def meanHops(self):
        #return mean(list(flatten(map(lambda tree: tree.getPathMeasure(lambda x: len(x.edgeLabels)), self.trees))))
        return self.summarize(lambda x: len(x.edgeLabels))
    
    #Kind of replaced by union
    def meanSize(self):
        return [mean(map(lambda x: len(x.nodeSet), self.trees)),
                mean(map(lambda x: len(x.edgeSet), self.trees))]
    
    def lowQualityEdges(self):
        return 
        
        
def determineVersionClass(rls):
    vs = {'PPI' : set(), 'PHS' : set(),  'KS' : set(), 'COC' : set()}
    for v in rls['versions']:
        for vtag in v['tags']:
            if vtag in vs:
                vs[vtag].add(v['index'])
    return vs
 
 
def getEdgeLabelBitMaps(rls):
    return rls['labelsUsed']['edges']

def getNodeLabelBitMaps(rls):
    return rls['labelsUsed']['nodes']


def parseSites(filename):
    sites = []
    with open(filename, 'r') as f:
        for line in f:
            tokens = line.strip('\n').split('\t')
            
            for i in range(1,len(tokens)):
                tokens[i] = float(tokens[i])
                
            #print(tokens)
            if tokens is not None:
                sites.append(tokens)
        
        return sites
 
#def runQuerySet(ss, ):

class QuerySet():
    def __init__(self):
        self.endFlag = True
        self.iteration = 0
        self.lsb = 0
        self.args = []
        self.trackArgVals = []

    def addArg(self, argPair, trackArgVal=False):
        self.args.append(argPair)
        self.trackArgVals.append(trackArgVal)

        
    def addArgs(self, argPairs, trackArgVal=False):
        for p in argPairs.items():
            self.args.append(p)
            self.trackArgVals.append(trackArgVal)
        
    def begin(self):
        #print(self.args)
        
        
        #self.iteration = 0
        self.lsb = 0
        self.bases = list(map(lambda x: len(x[1]), self.args))
        self.bases.append(2) #The end flag needs 2 states 
        self.baseCounter = [0] *len(self.bases)
        self.endFlag = False;
        #print(list(self.bases))

    def end(self):
        return self.endFlag

    def baseIncrement(self):
        #print(self.bases)
       
        if not self.end():
            self.baseCounter[self.lsb]+=1

            #rollover
            while self.baseCounter[self.lsb] > (self.bases[self.lsb]-1):
                self.baseCounter[self.lsb] = 0   
                self.lsb+=1
                self.baseCounter[self.lsb] +=1
                
            self.lsb=0
            
            if self.baseCounter[len(self.baseCounter)-1] ==1:
                self.endFlag = True
            
        #self.iteration += 1
        #print(self.baseCounter)
       
    def getArgs(self):
        m = {}

        for i in range(0, len(self.args)):
            m[self.args[i][0]] = self.args[i][1][self.baseCounter[i]]
        #return map(map(lambda x: {self.args[x][0] : self.args[x][1][self.] },self.baseCounter))
        return m
        
    def iterateAll(self):
        self.begin()
        
        while not self.end():
            print(self.getArgs())
            self.baseIncrement()
            
            
    def getTrackedArgs(self):
        m = []
        for i in range(0, len(self.args)):
            if self.trackArgVals[i]:
                m.append(str(self.args[i][1][self.baseCounter[i]]))
        
        return '\t'.join(m)
        
    def getTrackedArgsHeader(self):
        m = []
        for i in range(0, len(self.args)):
            if self.trackArgVals[i]:
                m.append(str(self.args[i][0]))
        
        return '\t'.join(m)
    #def nextPayload():
        #return 
 
def main():
    ss = ServerState(hostname)
    q = QuerySet()
    
    versionDef = ss.versionDef([1,20,21,22])

    sites =  parseSites('/home/tcowman/githubProjects/cophos/data/raw/Processed_perturb/Phosphorylation_Data/phospho_data_c14.csv.uniprot')  #[['Q15459',359,-1.3219], ['Q15459',451,0.5352], ['P28482',185,4.4463], ['P28482',187,4.4195], ['Q8N3F8',273,-0.3219]]
    #kinase = ['P00533','P15056']
    
    q.addArg(['cmd', ['pths']])
    q.addArgs(versionDef)
    q.addArg(['kinase' , [['P00533','P15056']]])
    q.addArg(['sites', [sites]])
    
    q.addArg(['weightFraction', [1]], True)
    
    q.addArg(['lookupType', ['uniprot']])
    
    q.addArg(['mechRatio', [1000]], True)
    
    q.addArg(['localProximity', [False]])
    
    
    #q.iterateAll()
    
    q.begin()
    print(q.getTrackedArgsHeader())
    while not q.end():
        pload = q.getArgs()
        rq = requests.post(hostname, data=json.dumps(pload))
        
        #analysis code
        F = PathForest(rq.json())
        
       
        for topScore in [1,.1,.05]: #np.round(np.arange(1,.05, -.05),2):
            for topk in [10]:
                F.scoreFilter(topScore, topk)
                
                print(
                q.getTrackedArgs(),
                topScore,
                topk,
                
                #Set operations on the sets of nodes and edges between kinase trees
                F.setOperation(set.intersection), 
                F.setOperation(set.union), 
                F.setOperation(set.difference), 
            
                F.proportionPPI(),
                F.meanHops()
            
                #list(map(lambda x: x.proportionPPI(topScore, topk), F.trees)), 
            #F.meanSize()
                )
        
        q.baseIncrement()
    
 
  

if __name__ == "__main__":
    main()
