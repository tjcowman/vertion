#pragma once

#include "vertion.h"



template<class GT>
class SetOperator
{
    public:
        SetOperator(const VGraph<GT>& graph);
        
        GraphList<EdgeElement<GT>> intersectVersions(std::vector<typename GT::VersionIndex> versions)const;
        
    private:
        
        //TODO: make the general for other set operations
        void intersectRows(std::vector<std::pair<typename GT::Index, EdgeLabel<GT> > >& res, const std::vector<std::pair<typename GT::Index, EdgeLabel<GT> >>& nextV)const;
        
        const VGraph<GT>* graph_;

};

template<class GT>
SetOperator<GT>::SetOperator(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

//TODO: include options for handlign labels
template<class GT>
GraphList<EdgeElement<GT>> SetOperator<GT>::intersectVersions(std::vector<typename GT::VersionIndex> versions)const
{
    GraphList<EdgeElement<GT>>  retVal;
    //Iterate over all rows or indexes in the graphs
    auto nodeFilter = graph_->getVertexList();
    
    for(const auto& node : nodeFilter)
    {
        //Iterate over the versions for that row
        //auto row = args.G.getGraph().getRowVersion<Row::JA>(node.index_, args.V[0]);
        auto row = graph_-> template getRowVersion<Row::JAL>(node.index_, versions[0]);


        //auto [JA, A, L] = graph_->getRowData(node.index_, versions[0]);
        //auto [t1, t2] = graph_-> template getRowVersion<Row::JAL>(node.index_, versions[0]);
        
        for(typename GT::VersionIndex v=1; v<versions.size(); ++v)
        {
            intersectRows(row,  graph_->template getRowVersion<Row::JAL>(node.index_,versions[v]));
        }
        for(const auto& e : row)
        {
            retVal.push_back(EdgeElement<GT>{node.index_, e.first, 1, e.second});
        }
    }   
    return retVal;
    
}

//TODO: re-write to enable combinign of the edge labels
template<class GT>
void SetOperator<GT>::intersectRows(std::vector<std::pair<typename GT::Index, EdgeLabel<GT> > >& res, const std::vector<std::pair<typename GT::Index, EdgeLabel<GT> >>& nextV)const
{
    std::vector<std::pair<typename GT::Index, EdgeLabel<GT> > > tmpL;
    std::vector<std::pair<typename GT::Index, EdgeLabel<GT> > > tmpR;
    //TODO: write self to make more efficient/functional, currently unions the labels of intersected rows
    
//     for(const auto& e : res)
//         std::cout<<e.first<<","<<e.second<<" ";
//     std::cout<<std::endl;
//     
//     
//     for(const auto& e : nextV)
//         std::cout<<e.first<<","<<e.second<<" ";
//     std::cout<<std::endl;
//     
    std::set_intersection(res.begin(), res.end(), nextV.begin(), nextV.end(), std::back_inserter(tmpL), [](const auto& lhs, const auto& rhs){return lhs.first < rhs.first;});
    std::set_intersection(nextV.begin(), nextV.end(), res.begin(), res.end(), std::back_inserter(tmpR), [](const auto& lhs, const auto& rhs){return lhs.first < rhs.first;});
    
//         for(const auto& e : tmpL)
//         std::cout<<e.first<<","<<e.second<<" ";
//     std::cout<<std::endl;
//     
//     
//     for(const auto& e : tmpR)
//         std::cout<<e.first<<","<<e.second<<" ";
//     std::cout<<std::endl;
//     
    res.clear(); 
//     std::cout<<tmpL.size()<<" "<<tmpR.size()<<std::endl;
    
    for(size_t i=0;  i<tmpL.size(); ++i)
    {
        res.push_back({tmpL[i].first, tmpL[i].second.makeUnion(tmpR[i].second)});
//         std::cout<<i<<std::endl;
    }
}
