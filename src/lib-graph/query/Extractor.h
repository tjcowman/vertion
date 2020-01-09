#pragma once

#include "vertion.h"

template<class GT>
class Extractor
{
    public:
        Extractor(const VGraph<GT>& graph);
        
        VGraph<GT> extractNodes();
        
        std::pair<VGraph<GT>, std::vector<typename GT::Index> > extractVersion(int version);

        std::pair<VGraph<GT>, std::vector<typename GT::Index> >  extractSubGraph(const GraphList<VertexU<GT>>& vertexList, int version, bool restrictive);
        
    private:
        const VGraph<GT>* graph_;

};

template<class GT>
Extractor<GT>::Extractor(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

template<class GT>
VGraph<GT>  Extractor<GT>::extractNodes()
{
    VGraph<GT> extractedGraph(graph_->getContext());
    extractedGraph.vertexData_ = graph_->vertexData_;
    
    return extractedGraph;
}

template<class GT>
std::pair<VGraph<GT>, std::vector<typename GT::Index> >  Extractor<GT>::extractSubGraph(const GraphList<VertexU<GT>>& vertexList, int version, bool restrictive)
{
    VGraph<GT> extractedGraph(graph_->getContext());
    
    std::vector<typename GT::Index> rebaseMap;
    
    //Get insert the nodes based on index in original
    std::tie(extractedGraph.vertexData_, rebaseMap )= graph_->vertexData_.select(vertexList);

    extractedGraph.setEmptyInitialVersion();

    auto preIndexedEdges =  mapVertexListToEdgeList(*graph_, version, vertexList);
    for( auto& e : preIndexedEdges.getElements() )
    {
        e.index1_ = rebaseMap[e.index1_];
        e.index2_ = rebaseMap[e.index2_];
    }

    VersionChanges<GT> vc( preIndexedEdges, EdgeList(), EdgeList());

    extractedGraph.addVersion(vc,0);

    //Initial Version is empty now so add the tag to version1
    extractedGraph.getTags().addTags(1, graph_->getTags().template lookup(version));
    
    return std::pair(extractedGraph, rebaseMap);
}

template<class GT>
std::pair<VGraph<GT>, std::vector<typename GT::Index> > Extractor<GT>::extractVersion( int version)
{
    GraphList<VertexU<GT>> vertexes;
    for(typename GT::Index i=0; i<graph_->size(version).nodes_; ++i)
        vertexes.push_back(VertexU<GT>(i,(typename GT::Value)1));
    return extractSubGraph(vertexes, version, true);
}
