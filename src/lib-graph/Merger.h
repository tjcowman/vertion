#pragma once

#include "vertion.h"

//TODO: add check for already aligned labels

template<class GT>
class Merger
{
    public:
        Merger(const VGraph<GT>& graph1, const VGraph<GT>& graph2 );
  
        VGraph<GT> merge();
        
    private:
        
        const VGraph<GT>* graph0_;
        const VGraph<GT>* graph1_;
        //std::vector<const VGraph<GT>*> graphs_;
};

template<class GT>
Merger<GT>::Merger(const VGraph<GT>& graph1, const VGraph<GT>& graph2)
{
    graph0_ = &graph1;
    graph1_ = &graph2;
//     graphs_.push_back(&graph1);
//     graphs_.push_back(&graph2);
}

template<class GT>
VGraph<GT> Merger<GT>::merge()
{
    VGraph<GT> retVal(graph0_->getContext());
    
    //Unify the node ids and indexes and vertex labels
    VertexController<GT> vertexData;
    std::map<typename GT::Index, typename GT::Index> map1;
    std::map<typename GT::Index, typename GT::Index> map2;
    
    std::tie(vertexData, map1, map2) = (graph0_->vertexData_).merge(graph1_->vertexData_);
    
    retVal.vertexData_ = std::move(vertexData);
    retVal.setEmptyInitialVersion();
    
    retVal.LMap_ = graph0_->LMap_.merge(graph1_->LMap_);
    //Unify the edge labels         
    auto lm1 = graph0_->LMap_.reIndex(retVal.LMap_);
    auto lm2 = graph1_->LMap_.reIndex(retVal.LMap_);

    //Add the left branch
    for(typename GT::VersionIndex i=0; i<graph0_->versionsData_.size(); ++i)
    {
        auto edges = graph0_->getEdgeList(i);
        edges.elementApply([map1, lm1](auto& e){
            e.index1_ = map1.at(e.index1_);
            e.index2_ = map1.at(e.index2_);
            e.labels_ = e.labels_.recode(lm1);
        });
        retVal.insertEdges(edges, graph0_->versionsData_[i].parentVersion_, graph0_->getTags().lookup(i), graph0_->getContext() );
    }
    
    //Add the right branch    
    int versionOffset = retVal.size().versions_-1;
    for(typename GT::VersionIndex i=1; i<graph1_->versionsData_.size(); ++i)
    {
        auto edges = graph1_->getEdgeList(i);
        edges.elementApply([map2, lm2](auto& e){
            e.index1_ = map2.at(e.index1_);
            e.index2_ = map2.at(e.index2_);
            e.labels_ = e.labels_.recode(lm2);
        });
        if(i==1)//Special case for first version to also branch off of 0
                retVal.insertEdges(edges, 0, graph1_->getTags().lookup(i), graph1_->getContext() );
            else
                retVal.insertEdges(edges, graph1_->versionsData_[i].parentVersion_+versionOffset, graph1_->getTags().lookup(i), graph1_->getContext() );
    }
    
    return retVal;
}
