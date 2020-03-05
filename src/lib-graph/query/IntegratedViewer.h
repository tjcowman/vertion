#pragma once

#include "vertion.h"

// #include <unordered_map>

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
        
        void describe(std::ostream& os);
        
        std::map<VertexLabel<GT>, size_t> countVertexLabels()const;
        std::map<EdgeLabel<GT>, size_t> countEdgeLabels()const;
        
        
        typename GT::Index getOriginalIndex(typename GT::Index viewIndex)const;
        
        void buildView(std::vector<typename GT::VersionIndex> versions, VertexLabel<GT> nodeLabels, EdgeLabel<GT> edgeLabels);
        
        void buildViewWIntersect(std::vector<std::vector<typename GT::VersionIndex> > versions, VertexLabel<GT> nodeLabels, EdgeLabel<GT> edgeLabels);
        
        void viewUnion(std::vector<typename GT::VersionIndex> versions);
        
        GraphList<EdgeElement<GT>> mapVertexes(const GraphList<VertexU<GT>>& nodes)const;
        
        typename GT::Index getDegree(typename GT::Index i)const;
        GraphList<VertexI<GT>> getDegrees()const;
        std::vector<std::pair<typename GT::Index,  EdgeLabel<GT>>> getlabeledRow(typename GT::Index index)const;
        
//     private:
        
        std::vector<typename GT::Index> originalIndexes_;
        std::vector<typename GT::Index> viewIndexes_;
        
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
void IntegratedViewer<GT>::describe(std::ostream& os)
{
    for(const auto& e : JA_)
        std::cout<<e<<" ";
    std::cout<<std::endl;
    
    for(const auto& e : A_)
        std::cout<<e<<" ";
    std::cout<<std::endl;
    
    for(const auto& e : L_)
        std::cout<<e<<" ";
    std::cout<<std::endl;
    
    for(const auto& e : IA_)
        std::cout<<e<<" ";
    std::cout<<std::endl;
}

template<class GT>
std::map<VertexLabel<GT>, size_t> IntegratedViewer<GT>::countVertexLabels()const
{
    std::map<VertexLabel<GT>, size_t> counts;
    
    for(const auto& e : viewIndexes_)
    {
        auto eo = originalIndexes_[e];
        auto label = graph_->getVertexData().lookupLabels(eo);
        
        if(counts.find( label) == counts.end())
            counts[ label] = 1;
        else
            counts[ label] = counts[label]+1;
    }
        
    return counts;
}

template<class GT>
std::map<EdgeLabel<GT>, size_t> IntegratedViewer<GT>::countEdgeLabels()const
{
    std::map<EdgeLabel<GT>, size_t> counts;
    
    for(const auto& e : L_)
    {
        if(counts.find(e) == counts.end())
            counts[e] = 1;
        else
            counts[e] = counts[e]+1;
    }
    return counts;
}

template<class GT>
typename GT::Index IntegratedViewer<GT>::getOriginalIndex(typename GT::Index viewIndex)const
{
    return viewIndexes_[viewIndex];
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

             std::get<2>(z) = std::get<2>(z).makeUnion(std::get<2>(*first2));
             *result = z;

            ++first1; 
            ++first2; 
        }
        ++result;
    }
}
    

template<class GT>
auto setUnionReducedNodeFilter(VertexLabel<GT>, ZippedRowIT<GT> first1, ZippedRowIT<GT> last1, ZippedRowIT<GT> first2, ZippedRowIT<GT> last2, std::back_insert_iterator<ZippedRow<GT>> result )
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

             std::get<2>(z) = std::get<2>(z).makeUnion(std::get<2>(*first2));
             *result = z;

            ++first1; 
            ++first2; 
        }
        ++result;
    }
}
    
template<class GT>
void IntegratedViewer<GT>::buildView(std::vector<typename GT::VersionIndex> versions, VertexLabel<GT> nodeLabels, EdgeLabel<GT>  edgeLabels)
{
    clear();
    
    //Get full node list and filter out unrequested labels
    auto allNodes = graph_->getVertexList();
    
//     std::cout<<allNodes<<std::endl;
    
    if(nodeLabels.getBits().any())
    {
        allNodes = allNodes.select([nodeLabels](const auto& e){
            return ((e.labels_.getBits() & nodeLabels.getBits()).any());
        });
    }
//     std::cout<<allNodes.size()<<std::endl;
    
    
    IA_.reserve(allNodes.size());
    
    //Determine the node old->new index mapping
    viewIndexes_ = allNodes.getIndexes();
    originalIndexes_ = std::vector<typename GT::Index>(graph_->size(0).nodes_, GT::invalidIndex);
    for(size_t i=0; i<viewIndexes_.size(); ++i)
        originalIndexes_[viewIndexes_[i]] = i; 
    
    
    for(const auto& node : allNodes)
    {
        //Iterate over the versions for that row
        auto row = graph_->getRowDataZipped(node.index_, versions[0]);
        
        //Perform the union if versions > 1
        for(size_t v=1; v<versions.size(); ++v)
        {
            auto next = graph_->getRowDataZipped(node.index_, versions[v]);
            ZippedRow<GT> tmp;
            setUnionReduced<GT>(row.begin(), row.end(), next.begin(), next.end(), std::back_inserter(tmp));
            row=tmp;
        }
        //Filter out based on node labels
        if(nodeLabels.getBits().any())
        {
//             std::cout<<"node filter"<<std::endl;
            auto ne = std::remove_if(row.begin(), row.end(), [this](const auto& e){
                return ( originalIndexes_[std::get<0>(e)] == GT::invalidIndex);
            });
             row.resize(std::distance(row.begin(), ne));
        }
        
        if(edgeLabels.getBits().any())
        {
//             std::cout<<"edge filter"<<std::endl;
            auto ne = std::remove_if(row.begin(), row.end(), [edgeLabels](const auto& e){
                return ( !((std::get<2>(e).getBits() & edgeLabels.getBits()).any()));
                
            });
            row.resize(std::distance(row.begin(), ne));
        }
        
//         std::cout<<"here"<<std::endl;
        //Convert to view Indexes
        std::for_each(row.begin(), row.end(), [this]( auto& e){std::get<0>(e) = originalIndexes_[std::get<0>(e)];});
//         std::cout<<"here"<<std::endl;
        for(const auto& e : row)
        {

            JA_.push_back(std::get<0>(e));
            A_.push_back(std::get<1>(e));
            L_.push_back(std::get<2>(e));

        }
//     std::cout<<"here"<<std::endl;
        IA_.push_back( AugIA<GT>(JA_.size()-row.size(), row.size() ));        
    }   
    
}

template<class GT>
void IntegratedViewer<GT>::buildViewWIntersect(std::vector<std::vector<typename GT::VersionIndex> > versions, VertexLabel<GT> nodeLabels, EdgeLabel<GT> edgeLabels)
{
    
}

template<class GT>
void IntegratedViewer<GT>::viewUnion(std::vector<typename GT::VersionIndex> versions)
{
    clear();
    
    IA_ = std::vector<AugIA<GT>>( graph_->size(0).nodes_);
    
    for(typename GT::Index i=0; i<graph_->size(0).nodes_; ++i)
    {
        //Iterate over the versions for that row
        auto row = graph_->getRowDataZipped(i, versions[0]);
        
        //Perform the union
        for(size_t v=1; v<versions.size(); ++v)
        {
            auto next = graph_->getRowDataZipped(i, versions[v]);
            ZippedRow<GT> tmp;
            setUnionReduced<GT>(row.begin(), row.end(), next.begin(), next.end(), std::back_inserter(tmp));
            row=tmp;
        }
        
        for(const auto& e : row)
        {
            JA_.push_back(std::get<0>(e));
            A_.push_back(std::get<1>(e));
            L_.push_back(std::get<2>(e));
        }

        IA_[i] =  AugIA<GT>(JA_.size()-row.size(), row.size());        
    }   
    std::cout<<"VIEW SIZES"<<std::endl;
    std::cout<<L_.size()<<" "<<A_.size()<<" "<<JA_.size()<<" "<<IA_.size()<<std::endl;
    std::cout<<"FINISHED VIEW"<<std::endl;

    
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
        
     
        for(;index1<index2; ++index1)
        {
            if(!restrictive || nodesUsed.find(JA_[index1])!=nodesUsed.end())
            {
                retVal.push_back(EdgeElement<GT>(e.index_, JA_[index1], A_[index1], L_[index1]));
            }
        }
    }
    //std::cout<<retVal<<std::endl;
    
    
    
    return retVal;
}


template<class GT>
typename GT::Index IntegratedViewer<GT>::getDegree(typename GT::Index i)const
{
    return(IA_[i].s2());
}


template<class GT>
GraphList<VertexI<GT>> IntegratedViewer<GT>::getDegrees()const
{
    GraphList<VertexI<GT>> degrees;
    for(typename GT::Index i=0; i<IA_.size(); ++i)
        degrees.push_back(VertexI<GT>{i,IA_[i].s2()});
    
    return degrees;
}

template<class GT>
std::vector<std::pair<typename GT::Index,  EdgeLabel<GT>>> IntegratedViewer<GT>::getlabeledRow(typename GT::Index index)const
{
    std::vector<std::pair<typename GT::Index,  EdgeLabel<GT>>> row;
      row.resize(IA_[index].s2());
//     
    for(typename GT::Index i=IA_[index].s1(); i < IA_[index].s1()+IA_[index].s2(); ++i)
        row[i -IA_[index].s1()] = std::make_pair(JA_[i], L_[i]);
        
    return row;
}
