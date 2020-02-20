#pragma once

#include "vertion.h"

template<class GT>
using ZippedRow = std::vector<std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>>>;
template<class GT>
using ZippedRowIT = typename std::vector<std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>>>::iterator;
//using ZippedRowIT = typename std::vector<std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>>>::iterator;

template<class GT>
class IntegratedViewer
{
    public:
        IntegratedViewer(const VGraph<GT>& graph);
        
        void clear();
        
        void viewUnion(std::vector<typename GT::VersionIndex> versions);
        
        GraphList<EdgeElement<GT>> mapVertexes(const GraphList<VertexU<GT>>& nodes)const;
        
//     private:
        
        std::vector<EdgeLabel<GT>> L_; //Edge labels
        std::vector<typename GT::Value> A_; /**< The values of non-zero edges in the graph.*/
        std::vector<typename GT::Index> JA_; /**< The outgoing node/column index of the edges.*/
        std::vector<AugIA<GT>>IA_; /**< The index bounds in A_ and JA_ for outgoing edges in IA_[index].*/
        
        const VGraph<GT>* graph_;

};

template<class GT>
void IntegratedViewer<GT>::clear()
{
    L_.clear();
    A_.clear();
    JA_.clear();
    IA_.clear();
}

template<class GT>
IntegratedViewer<GT>::IntegratedViewer(const VGraph<GT>& graph)
{
    graph_ = &graph;
    IA_ =  std::vector<AugIA<GT>>();
    JA_ =  std::vector<typename GT::Index>();
    A_ = std::vector<typename GT::Value>();
    L_ = std::vector<EdgeLabel<GT>>();
}

template<class GT>
auto setUnionReduced(ZippedRowIT<GT> first1, ZippedRowIT<GT> last1, ZippedRowIT<GT> first2, ZippedRowIT<GT> last2, std::back_insert_iterator<ZippedRow<GT>> result )
{
    while (true)
    {
        if (first1==last1) 
            return std::copy(first2,last2,result);
        if (first2==last2) 
            return std::copy(first1,last1,result);

        if (*first1<*first2) 
        { 
            *result = *first1; 
            ++first1; 
        }
        else if (*first2<*first1) 
        { 
            *result = *first2; 
            ++first2; 
        }
        else 
        {
            std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>> z = (*first1);
            
//             std::get<1>(*result) += std::get<1>(*first2);
             std::get<2>(z) = std::get<2>(z).makeUnion(std::get<2>(*first2));
             *result = z;
//             std::get<2>((*first1));// = (*result)[2].makeUnion((*first2)[2]);
            ++first1; 
            ++first2; 
        }
        ++result;
    }
}
    
template<class GT>
void IntegratedViewer<GT>::viewUnion(std::vector<typename GT::VersionIndex> versions)
{
    clear();
    
    IA_ = std::vector<AugIA<GT>>( graph_->size(0).nodes_);
    
    for(typename GT::Index i=0; i<graph_->size(0).nodes_; ++i)
    {
        //Iterate over the versions for that row
        //auto [JA, A, L] = graph_->getRowData(i, versions[0]);
        auto row = graph_->getRowDataZipped(i, versions[0]);
        
        //Perform the union
        for(size_t v=1; v<versions.size(); ++v)
        {
            auto next = graph_->getRowDataZipped(i, versions[v]);
            ZippedRow<GT> tmp;
            setUnionReduced<GT>(row.begin(), row.end(), next.begin(), next.end(), std::back_inserter(tmp));
            row=tmp;
//             row.insert.push_back(getRowDataZipped(i, versions[i]));
        }
        
        for(const auto& e : row)
        {
//             std::cout<<std::get<0>(e)<<"\t"<<std::get<1>(e)<<"\t"<<std::get<2>(e)<<std::endl;
            
            JA_.push_back(std::get<0>(e));
            A_.push_back(std::get<1>(e));
            L_.push_back(std::get<2>(e));
        }
       // IA_.push_back(AugIA<GT>(JA_.size()-1, row.size()));
        IA_[i] =  AugIA<GT>(JA_.size()-row.size(), row.size());
//         std::cout<<IA_.back()<<std::endl;

//         
    }   
    std::cout<<"VIEW SIZES"<<std::endl;
    std::cout<<L_.size()<<" "<<A_.size()<<" "<<JA_.size()<<" "<<IA_.size()<<std::endl;
    std::cout<<"FINISHED VIEW"<<std::endl;
//     for(const auto& e : JA_)
//         std::cout<<e<<" ";
//     std::cout<<std::endl;
//     
//     for(const auto& e : A_)
//         std::cout<<e<<" ";
//     std::cout<<std::endl;
//     
//     for(const auto& e : L_)
//         std::cout<<e<<" ";
//     std::cout<<std::endl;
//     
//     for(const auto& e : IA_)
//         std::cout<<e<<" ";
//     std::cout<<std::endl;
//     
    
}

template<class GT>
GraphList<EdgeElement<GT>> IntegratedViewer<GT>::mapVertexes(const GraphList<VertexU<GT>>& nodes)const
{
    GraphList<EdgeElement<GT>> retVal;
    bool restrictive=true;
    
    std::set<typename GT::Index> nodesUsed;
    for(const auto& e : nodes.getElements())
        nodesUsed.insert(e.index_);
    
    for(auto e : nodes.getElements())
    {
        auto index1 = IA_[e.index_].s1();
        auto index2 = index1 + IA_[e.index_].s2();
        
//         auto [index1, index2] = ;
        
//         auto AJA = graph.template getRowVersion<Row::AJA>(e.index_, version);
//         auto L = graph.template getRowVersion<Row::L>(e.index_, version);
//         
//         auto itPair = std::make_pair(AJA.second.begin(), AJA.second.end()); //graph.getOutgoingNodes(e.index_, version);
//         auto itPairVal =  AJA.first.begin(); //graph.getOutgoingValues(e.index_, version).first;
//         auto itPairLabel = L.begin();
//         
//         
 //       for(auto it=itPair.first; it!=itPair.second; ++it)
     
        for(;index1<index2; ++index1)
        {
            if(!restrictive || nodesUsed.find(JA_[index1])!=nodesUsed.end())
            {
                retVal.push_back(EdgeElement<GT>(e.index_, JA_[index1], A_[index1], L_[index1]));
            }
//             if(!restrictive || nodesUsed.find(*it)!=nodesUsed.end())
//                 retVal.push_back(EdgeElement<GT>{e.index_,*it, *itPairVal, *itPairLabel});
//             ++itPairVal;
//             ++itPairLabel;
        }
    }
    //std::cout<<retVal<<std::endl;
    
    
    
    return retVal;
}
