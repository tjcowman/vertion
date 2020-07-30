#! /usr/bin/python3
import math
import requests
import json
import random

from plotnine import *

import numpy as np 
import pandas as pd

import argparse
parser = argparse.ArgumentParser()

from functools import reduce
from statistics import mean, stdev

import itertools 
flatten = itertools.chain.from_iterable

hostname = 'http://localhost:9060/'

parser.add_argument('--mode', required=True) #M-emory C-toCache U-plotCache 
parser.add_argument('--trial', required=True)
parser.add_argument('--plotSuff', required=True)
parser.add_argument('--permuteSiteScores', default=False)
args = parser.parse_args()
outputFormat = 'png'

#kinaseByStudy = {
    #14: []
#}

kinMap = {
    'EGFR' : 'P00533',
    'RAF1' : 'P04049',
    'BRAF' : 'P15056',
    'ERK1' : 'P27361',
    'ERK2' : 'P28482',
    'Akt1' : 'P31749',
    'MEK2' : 'P36507',
    'MEK1' : 'Q02750',
    'Abl' : 'P00519',
    'Lck' : 'P06239',
    'AurA' : 'Q93GF5',
    'AurB' : 'M4SMN9',
    'ATM' : 'Q13315',
    'ATR' : 'Q13535',
    'RAF1' :'P04049',
    'PDGFRB' : 'P09619',
    'PKCA' : 'P17252'
}


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
            self.edgeSet.add(str(self.nodes[i]) + '-' + str(self.nodes[i+1]))
        
    def hopLength(self):
        return len(self.edgeLabels)
        
    def proportionPPI(self):
        if self.hopLength() == 0:
            return 0
        else:
            return len(list(filter(lambda x: x == 1, self.edgeLabels))) / self.hopLength()
        
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
        
        

       #NOTE: temporarily remove topk filterin
        self.pathsSelected =pathslice
        #self.pathsSelected =pathslice[0:topk]
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
    
    def getNumPathsUsed(self):
        return (sum(map(lambda tree: len(tree.pathsSelected), self.trees)))
    
    #Warpping one of the pathMEasure lambdas in this will return the mean and standard deviation for the selected paths 
    def summarize(self,pathMeasureFn):
        return  [round(mean(list(flatten(map(lambda tree: tree.getPathMeasure(pathMeasureFn), self.trees)))),3),
                round(stdev(list(flatten(map(lambda tree: tree.getPathMeasure(pathMeasureFn), self.trees)))),3)]
    
    def setOperation(self, setOp ): #Intra
        #return [
            #len(reduce(setOp, map(lambda x: x.getNodeSet(), self.trees))),
            #len(reduce(setOp, map(lambda x: x.getEdgeSet(), self.trees)))
        #]
        return list(map( lambda x: len(x), self.setOperationIntra(setOp)))
    
    
    def setOperationIntra(self, setOp):
         return [
            reduce(setOp, map(lambda x: x.getNodeSet(), self.trees)),
            reduce(setOp, map(lambda x: x.getEdgeSet(), self.trees))
        ]
    
    def setOperationInter(self, otherForest, setOpIntra, setOpInter):
        s1 = self.setOperationIntra(setOpIntra) #returns a [{}, {}] 
        s2 = otherForest.setOperationIntra(setOpIntra)
        
        return [setOpInter(s1[0],s2[0]) ,setOpInter(s1[1],s2[1])]
        
        #return [s1[0].setOp(s2[0], s1[1].setOp(s2[1]))]
        
        #return map(lambda x:  [setOp(x[0]),setOp(x[1])],  zip(s1,s2))
        

    def proportionPPI(self):
        return self.summarize(lambda x: x.proportionPPI())
    
    def meanHops(self):
        return self.summarize(lambda x: len(x.edgeLabels))
    
    def meanPathWeight(self):
        return self.summarize(lambda x: x.totalWeight)
    
    
    
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
        
        
        if args.permuteSiteScores:
            scores = list(map(lambda x: x[2],sites))
            random.shuffle(scores)
            
            for i in range(0,len(sites)):
                sites[i][2]=scores[i]
            
        for line in sites:
            print(line)
            #exit()
            
            
            
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
        
        
        #print("hi",m)
        return (zip(self.getTrackedArgsHeader(), m))
        #return '\t'.join(m)
        
    def getTrackedArgsHeader(self):
        m = []
        for i in range(0, len(self.args)):
            if self.trackArgVals[i]:
                m.append(str(self.args[i][0]))
       
        return m

    def makeQuery(self):
        pload = self.getArgs()
        rq = requests.post(hostname, data=json.dumps(pload))
        
        #analysis code
        F = PathForest(rq.json())
        return F

        

def initialize_query_set(siteFile, kinaseList):
    ss = ServerState(hostname)
    q = QuerySet()
    
    versionDef = ss.versionDef([8,20,21,22])

    sites =   parseSites(siteFile)  #[['Q15459',359,-1.3219], ['Q15459',451,0.5352], ['P28482',185,4.4463], ['P28482',187,4.4195], ['Q8N3F8',273,-0.3219]]
    kinase = list(map(lambda x: kinMap[x], kinaseList ))
    
    q.addArg(['cmd', ['pths']])
    q.addArgs(versionDef)
    
    q.addArg(['kinase' , [kinase]])
    
    q.addArg(['sites', [sites]])
    q.addArg(['weightFraction', [1]], True)
    q.addArg(['lookupType', ['uniprot']])
    q.addArg(['mechRatio', [1]], True)
    q.addArg(['localProximity', [False]])
    q.begin()
    return q

#def compute queryForest(query_set):

 
def main_compute_dataFrame(siteFile, kinaseList):
    q = initialize_query_set(siteFile, kinaseList)


    dfp = {
        'weightFraction' :[],
        'mechRatio' : [],
        'topScore' : [],
        'topk' : [],
        'pathsUsed' : [],
        
        'union_n' : [],
        'union_e' : [],
        'intersection_n' : [],
        'intersection_e' : [],
        
        'propPPI_m' :[],
        'propPPI_sd': [],
        'hops_m': [],
        'hops_sd': [],
        'pathWeight_m': [],
        'pathWeight_sd': []
    }
    
    dfp2 = {
        'weightFraction' :[],
        'mechRatio' : [],
        'topScore' : [],
        'topk' : [],
        'pathsUsed' : [],
        
        'propPPI' :[],
        'hops': [],
        'pathWeight': [],
        
        'union' : [],
        'intersection' : [],
        'difference' : []
    }
    
    while not q.end():

        #analysis code
        F = q.makeQuery()
        
        #Print some summary stats for debugging
        print("Summary")
        print(list(map(lambda tree: len(tree.paths), F.trees)))
        

        for topScore in np.round(np.arange(.02, 1, .01),3): #[ .005, .01, .015, .1, .2, .5, .75, 1] :# np.round(np.arange(.01, .1, .01),2):
            for topk in [10]: #[10, 20, 40]:
            
        #for topScore in [.01, .05, .1, .2, .4, .8]: #[ .005, .01, .015, .1, .2, .5, .75, 1] :# np.round(np.arange(.01, .1, .01),2):
            #for topk in range(10, 500, 20):
            
                F.scoreFilter(topScore, topScore)
            
                #F.scoreFilter(topScore, topk)
                
                #dfp["topk"].append(topk)
                #dfp["topScore"].append(topScore)
                #dfp["pathsUsed"].append(F.getNumPathsUsed())
                #[dfp[key].append(val) for (key,val) in q.getTrackedArgs()]
                
                #[dfp[key].append(val) for (key,val) in zip(["union_n","union_e"], F.setOperation(set.union)) ]
                #[dfp[key].append(val) for (key,val) in zip(["intersection_n","intersection_e"], F.setOperation(set.intersection)) ]
                
                #[dfp[key].append(val) for (key,val) in zip(["propPPI_m","propPPI_sd"], F.proportionPPI()) ]
                #[dfp[key].append(val) for (key,val) in zip(["hops_m","hops_sd"], F.meanHops()) ]
                #[dfp[key].append(val) for (key,val) in zip(["pathWeight_m","pathWeight_sd"],  F.meanPathWeight()) ]
        
        
                dfp2["topk"].append(topk)
                dfp2["topScore"].append(topScore)
                dfp2["pathsUsed"].append(F.getNumPathsUsed())
                [dfp2[key].append(val) for (key,val) in q.getTrackedArgs()]
                
                
                dfp2['propPPI'].append(F.proportionPPI()) 
                dfp2['hops'].append( F.meanHops())
                dfp2['pathWeight'].append(F.meanPathWeight())
                
                dfp2['union'].append(F.setOperation(set.union))
                dfp2['intersection'].append(F.setOperation(set.intersection))
                dfp2['difference'].append(F.setOperation(set.symmetric_difference))
        
        q.baseIncrement()
    
    #df = pd.DataFrame(data=dfp)
    df = pd.DataFrame(data=dfp2)
    print(df)
    
    return df

def main_create_cache(df, filename):
    df.to_csv(filename)
    
def main_load_cache(filename):
    return pd.read_csv(filename)

#def formatDataFrame 
 
def computeForestOverlap(querySet1, querySet2):
    F1 = querySet1.makeQuery()
    F2 = querySet2.makeQuery()
    
    dfp={
            'topScore' : [],
            'topk' : [],
            'pathsUsed' : [],
            #'union' : [],
            'nodeDiff' : [],
            'edgeDiff' : [],
            'nodeUn' : [],
            'edgeUn' : []
        }
    
    for topScore in np.round(np.arange(.02, 1, .01),3): 
        for topk in  [20]: #[10,20,40]:
            F1.scoreFilter(topScore, topk)
            F2.scoreFilter(topScore, topk)
            #dfp["totalWeight"].append() 
            dfp["topk"].append(topk)
            dfp["topScore"].append(topScore)
            dfp["pathsUsed"].append(min(F1.getNumPathsUsed(),F2.getNumPathsUsed() ) )
            
        
 
        
            res = list(F1.setOperationInter(F2, set.union, set.symmetric_difference)) #intra op, inter op
            res = [len(res[0]), len(res[1])]
            
            dfp["nodeDiff"].append(res[0])
            dfp["edgeDiff"].append(res[1])
            
            res = list(F1.setOperationInter(F2, set.union, set.intersection)) #intra op, inter op
            res = [len(res[0]), len(res[1])]
            dfp["nodeUn"].append(res[0])
            dfp["edgeUn"].append(res[1])
            
            
           
            #res = map(len, res)
            
            #print(topScore, topk, res)
    
    DF = pd.DataFrame(data=dfp)     
    #print(DF)     
    #DF['ifRatio'] = DF.apply(lambda row: math.sqrt(pow( row.nodeUn/row.nodeDiff ,2) + pow(row.edgeUn/row.edgeDiff , 2) ), axis=1)
    DF['ifRatio'] = DF.apply(lambda row:  (row.edgeUn)/(row.edgeDiff), axis=1)
    DF = DF[DF.pathsUsed >= 2*DF.topk ]
   
    
    
    plt = (
            ggplot(data=DF)        

            +scale_x_reverse( breaks= np.round(np.arange(0 ,1,.1), 2) )
            #+scale_y_log10()
            +facet_wrap('~topk')
            +geom_line(aes(x='topScore', y='ifRatio') )
            #+geom_line(aes(x='topScore', y='nodeDiff') )
            #+geom_line(aes(x='topScore', y='edgeDiff' ), linetype='dashed') 
            #+geom_line(aes(x='topScore', y='nodeUn'), color='red' )
            #+geom_line(aes(x='topScore', y='edgeUn' ), color='red', linetype='dashed') 
            +xlab('Phosphorylation Threshold (Top %)')
            +ylab('Nodes (solid) - Edges (dashed)')
            
    )   
    #print(plt)
    plt.save(filename='validation/plots/kinSiteDiff'+'.'+outputFormat, width=15, height=6, limitsize=False)
    #return "done"
 
 
def main_plot2(df):
    print('\n')
    
    #extracts only the means from the speicified column lists
    df[['hops', 'propPPI', 'pathWeight']] = df[['hops', 'propPPI', 'pathWeight']].applymap(lambda x: x[0])
    
    df['ifRatio'] = df.apply(lambda row: ( row.intersection[1]) / (row.difference[1]), axis=1)
    #df['ifRatio'] = df.apply(lambda row: math.sqrt(pow(row.intersection[0] / row.difference[0],2) + pow(row.intersection[1] / row.difference[1], 2) ), axis=1)
    #print(df)
    #melths the set operation columns into a single value column
    dft = pd.melt(df, var_name='setOp', id_vars=['topk', 'topScore', 'pathsUsed', 'propPPI', 'hops', 'pathWeight', 'ifRatio'], value_vars=['difference', 'intersection'])
    
    #splits the node and edge set operations into seperate columns
    dfs=pd.DataFrame(dft)
    dfs[['nodes', 'edges']] = pd.DataFrame(dft.value.tolist(), index=dft.index)
    DF = pd.concat([dft, dfs])
    
    #Filter trials where paths available was less than the desired topk (Note pathsUsedd must be 2 * topk as there are 2 trees)
    DF = DF[DF.pathsUsed >= 2*DF.topk ]
    
    
    #print(df[['hops', 'propPPI', 'pathWeight']].applymap(lambda x: x[0]))
    #print(dft)
    #print(pd.melt(df, id_vars=['topk', 'topScore', 'pathsUsed'], value_vars=['propPPI', 'hops', 'pathWeight']))
    
    
    #non topk
    #plt = (
         #ggplot(data=df)     
            #+scale_x_reverse( breaks= np.round(np.arange(0 ,1,.1), 2) )
            #+geom_line(aes(x='topScore', y='hops') )
            #+ylab('Mean Path Length (Hops)')
            #+xlab('Phosphorylation Threshold (Top %)')
    #)   
    #plt.save(filename='validation/plots/hopDistanceNT'+args.plotSuff+'.'+outputFormat, width=15, height=6, limitsize=False)
    
    
    #plt = (
            #ggplot(data=df)     
            #+scale_x_reverse( breaks= np.round(np.arange(0 ,1,.1), 2) )
            #+facet_wrap('~topk')
            #+geom_line(aes(x='topScore', y='hops') )
            #+ylab('Mean Path Length (Hops)')
            #+xlab('Phosphorylation Threshold (Top %)')
    #)   
    #plt.save(filename='validation/plots/hopDistance'+args.plotSuff+'.'+outputFormat, width=15, height=6, limitsize=False)
    
    #GOOD
    #plt = (
            #ggplot(data=DF)        

            #+scale_x_reverse( breaks= np.round(np.arange(0 ,1,.1), 2) )
            ##+scale_y_log10()
            ##+facet_wrap('~topk')
            #+geom_line(aes(x='topScore', y='nodes', color='setOp') )
            #+geom_line(aes(x='topScore', y='edges' , color='setOp'), linetype='dashed') 
            #+xlab('Phosphorylation Threshold (Top %)')
            #+ylab('Nodes (solid) - Edges (dashed)')
            
    #)   
    
    plt = (
            ggplot(data=DF)        

            +scale_x_reverse( breaks= np.round(np.arange(0 ,1,.1), 2) )
            #+scale_y_log10()
            #+facet_wrap('~topk')
            +geom_line(aes(x='topScore', y='ifRatio', color='setOp') )
            +xlab('Phosphorylation Threshold (Top %)')
            +ylab('Nodes (solid) - Edges (dashed)')
            
    )   
    
    plt.save(filename='validation/plots/pathTreeOverlap'+args.plotSuff+'.'+outputFormat, width=15, height=6, limitsize=False)
    

 
def main():
    #Note Null model is difficult because we are always selecting real kinases and real protein phosphorylstion sites that experience phos changes under some studied perturbation
    #The way the search is done results in similar topology profiles for each query
    #Try looking at the the overlap (union) of the tree net from same aite pair to different phos sites
    
    toTrialName = lambda x: '/home/tcowman/githubProjects/cophos/data/raw/Processed_perturb/Phosphorylation_Data/phospho_data_c' +str(x)+'.csv.uniprot'
    trials = [
        #multiple kinases, choose 2
        {'siteFile' : toTrialName(17),'kinaseList' : ['EGFR', 'BRAF']}, #0
        {'siteFile' : toTrialName(49),'kinaseList' : ['EGFR', 'BRAF']}, #1
        {'siteFile' : toTrialName(17),'kinaseList' : ['MEK1', 'MEK2']}, #2
        {'siteFile' : toTrialName(49),'kinaseList' : ['MEK1', 'MEK2']}, #3
        
        #Exactly 2 kinases
        {'siteFile' : toTrialName(69),'kinaseList' : ['MEK1', 'MEK2']}, #4
        {'siteFile' : toTrialName(70),'kinaseList' : ['MEK1', 'MEK2']}, #5
         
        {'siteFile' : toTrialName(36),'kinaseList' : ['ATM', 'ATR']}, #6
        {'siteFile' : toTrialName(5),'kinaseList' : ['ATM', 'ATR']}, #7
        
        {'siteFile' : toTrialName(25),'kinaseList' : ['AurA', 'AurB']}, #8
        
        
        #NULL models?
        {'siteFile' : toTrialName(36),'kinaseList' : ['MEK1', 'MEK2']}, #9
        {'siteFile' : toTrialName(69),'kinaseList' : ['ATM', 'ATR']}, #10
        
        #NULL 2??? Different Kin
        {'siteFile' : toTrialName(36),'kinaseList' : ['MEK1', 'ATR']}, #11
        
        
        #??
        {'siteFile' :  toTrialName(38),'kinaseList' : ['ERK1', 'ERK2']}, #11

    ]
    #print(trials)
    
    
    #NewTest
    print(computeForestOverlap(
        initialize_query_set( toTrialName(17) , ['BRAF']),
        initialize_query_set( toTrialName(49) , ['BRAF'])
    ))  
    exit()
    
    df = None
    if args.mode  !="P":
        df = main_compute_dataFrame(trials[int(args.trial)]['siteFile'], trials[int(args.trial)]['kinaseList'])
        if args.mode == "C":
            main_create_cache(df,"df.tmp")
            return
        main_plot2(df)
    elif args.mode == "P":
        df = main_load_cache("df.tmp")
        main_plot2(df)
   
    #print(df)
  

if __name__ == "__main__":
    main()
