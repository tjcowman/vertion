#! /usr/bin/python3

import requests
import json

import numpy as np
from functools import reduce

hostname = 'http://localhost:9060/'


#TODO Make a serverState object
class ServerState:
    def __init__(self, hostname):
        self.hostname = hostname
        self.nodeData = []
        self.nodeNameMap = dict()
        
        self.updateFromManifest()
        
    def updateFromManifest(self):
        rls =requests.get(hostname+'ls').json()
        self.versionClasses = determineVersionClass(rls)
        self.edgeLabelBitMaps = getEdgeLabelBitMaps(rls)
        self.nodeLabelBitMaps = getNodeLabelBitMaps(rls)
        
    def lookupNames(self, nameList):
        nameList = list(filter(lambda x : x not in self.nodeNameMap,nameList))
        rq = requests.post(hostname, data=json.dumps({'cmd':'lkpn', 'names':nameList}))
        
        print(rq.json())
        #update the newly acquired elements
        for i, e in enumerate(rq.json()):
            #print(i, e)
            self.nodeNameMap[nameList[i]] = e['id']


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


def bitExtract(n) :
    
    #print(n)
    ids = []
    counter = 0
    while n > 0:
        if n % 2 > 0:
            ids.append(counter)
        counter+=1
        n = n >> 1
    return ids

#Takes the list of version ids and returns them with the corresponding lists of labelIds 
def selectAllLabels(versionIds, nodeLabelBitMaps, edgeLabelBitMaps):

    
    nodeLabelBits = map(lambda x: nodeLabelBitMaps[x] ,versionIds)# versionIds.map(nodeLabelBitMaps,index)
    nodeLabelBits = reduce(lambda x1,x2 : x1|x2 ,nodeLabelBits)
    #print(nodeLabelBits)
    
    edgeLabelBits = map(lambda x: edgeLabelBitMaps[x] ,versionIds)
    edgeLabelBits = reduce(lambda x1,x2 : x1|x2 ,edgeLabelBits)
    
    return {'versions' : versionIds, 'nodeLabels' : bitExtract(nodeLabelBits), 'edgeLabels' : bitExtract(edgeLabelBits)}
    
 
#def lookupNames(nameList):
    #nameList = nameList.select(lambda x : )
    #rq = requests.post(hostname, 'cmd':'lkpn', 'names':nameList)
                       
 
def main():
    ss = ServerState(hostname)
    ss.lookupNames(['Q15459', 'ff'])
    print(ss.nodeNameMap)
    #print(ss.hostna)
    
    #print('starting')
    #rls =requests.get(hostname+'ls').json()
    ##print(rls)
    
    #nodeData = []
    #nodeNameMap = {}
    
    #versionClasses = determineVersionClass(rls)
    
    #edgeLabelBitMaps = getEdgeLabelBitMaps(rls)
    #nodeLabelBitMaps = getNodeLabelBitMaps(rls)
    
    #versionDef = selectAllLabels([1,21,22,20], nodeLabelBitMaps, edgeLabelBitMaps)
    
    #sites = [['Q15459',359,-1.3219], ['Q15459',451,0.5352], ['P28482',185,4.4463], ['P28482',187,4.4195], ['Q8N3F8',273,-0.3219]]
    #kinase = ['P00533','P15056']
    #weightFraction = 1
    #lookupType = 'uniprot'
    #mechRatio = 100
    #localProximity = False
    
 
    
    #pload = {'cmd' : 'pths', **versionDef, 'kinase':kinase, 'sites':sites, 'weightFraction':weightFraction, 'lookupType':lookupType, 'mechRatio':mechRatio, 'localProximity':localProximity }
    #rq = requests.post(hostname, data=json.dumps(pload))
    #print(rq.json());

if __name__ == "__main__":
    main()
