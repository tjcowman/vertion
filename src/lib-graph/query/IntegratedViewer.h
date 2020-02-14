#pragma once

#include "vertion.h"

template<class GT>
using ZippedRow = std::vector<std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>>>;
template<class GT>
using ZippedRowIT = typename std::vector<std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>>>::iterator;

template<class GT>
class IngtegratedViewer
{
    public:
        IngtegratedViewer(const VGraph<GT>& graph);
        

        void viewUnion(std::vector<typename GT::VersionIndex> versions);
        
    private:
        
        std::vector<EdgeLabel<GT>> L_; //Edge labels
        std::vector<typename GT::Value> A_; /**< The values of non-zero edges in the graph.*/
        std::vector<typename GT::Index> JA_; /**< The outgoing node/column index of the edges.*/
        VectorIA<GT> IA_; /**< The index bounds in A_ and JA_ for outgoing edges in IA_[index].*/
        
        const VGraph<GT>* graph_;

};

template<class GT>
IngtegratedViewer<GT>::IngtegratedViewer(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

template<class GT>
auto setUnionReduced(ZippedRowIT<GT> first1, ZippedRowIT<GT> last1, ZippedRowIT<GT> first2, ZippedRowIT<GT> last2, ZippedRowIT<GT> result )
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
            *result = *first1;
            std::get<1>(*result) += std::get<1>(*first2);
            std::get<2>(*result) = std::get<2>(*result).makeUnion(std::get<2>(*first2));
            ++first1; 
            ++first2; 
        }
        ++result;
    }
}
    
template<class GT>
void IngtegratedViewer<GT>::viewUnion(std::vector<typename GT::VersionIndex> versions)
{
    for(typename GT::Vertex i=0; i<graph_->size(0).nodes_; ++i)
    {
        //Iterate over the versions for that row
        //auto [JA, A, L] = graph_->getRowData(i, versions[0]);
        auto row = graph_->getRowDataZipped(i, versions[0]);
        
        //Perform the union
        for(size_t v=1; v<versions.size(); ++v)
        {
            auto next = getRowDataZipped(i, versions[i]);
            ZippedRow<GT> tmp;
            setUnionReduced(row.begin(), row.end(), next.begin(), next.end(), tmp);
            row=tmp;
//             row.insert.push_back(getRowDataZipped(i, versions[i]));
        }
        
        for(const auto& e : row)
        {
            JA_.push_back(std::get<0>(e));
            A_.push_back(std::get<1>(e));
            L_.push_back(std::get<2>(e));
        }
        IA_.push_back(AugIA<GT>(IA_.size(), row.size()));
        
//         std::sort(row.begin(), row.end(), [](const auto& lhs, const auto& rhs){return std::get<0>(lhs)<std::get<0>(rhs);});
// 
//         ZippedRowIT it1 = row.begin();
//         ZippedRowIT it2 = row.begin();
//         
//         while(true)
//         {
//             auto eq = std::equal_range()
//         }
//         
    }   
    
    
}
