#pragma once

#include "vertion.h"

// #include <unordered_map>

template<class GT>
using ZippedRow = std::vector<std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>>>;

template<class GT>
using ViewRow = std::pair< typename GT::Index, ZippedRow<GT>>;

template<class GT>
using ZippedRowIT = typename std::vector<std::tuple<typename GT::Index, typename GT::Value, EdgeLabel<GT>>>::iterator;

template<class GT>
class IntegratedViewer
{
    public:
        
        using ArrayA = std::vector<typename GT::Value>;
        using ArrayIA =  std::vector<AugIA<GT>>;
        using ArrayJA = std::vector<typename GT::Index>;
        using ArrayL = std::vector<EdgeLabel<GT>>;
        
        IntegratedViewer(const VGraph<GT>& graph);
        auto getContext()const;

        //returns size as a pair of numnodes and numedges
        std::pair<size_t, size_t> size()const;

        void clear();

        void describe(std::ostream& os);

        //Get the labels associated with the node index, (converts from IV index)
        const auto& getLabels(typename GT::Index index)const ;
        //Get the edge labels, not exactly efficient, need to find the outgoing index for index1 if it exists  (converts from Global index)
        const auto getLabels(typename GT::Index index1, typename GT::Index index2)const;
        
        auto getOutgoingNodes(typename GT::Index node)const;
        
        //Get a vector of node Indexes that are incident on two nodes (finds triangles*)
        std::vector<typename GT::Index> getSharedConnections(typename GT::Index index1, typename GT::Index index2)const;


        std::map<VertexLabel<GT>, typename GT::Index> countVertexLabels()const;
        std::map<EdgeLabel<GT>, typename GT::Index> countEdgeLabels()const;


        typename GT::Index getOriginalIndex(typename GT::Index viewIndex)const;
        typename GT::Index getViewIndex(typename GT::Index originalIndex)const;
        std::vector<typename GT::Index> convertToViewIndexes(const std::vector<typename GT::Index> fullIndexes)const;

        void buildView(std::vector<typename GT::VersionIndex> versions, VertexLabel<GT> nodeLabels, EdgeLabel<GT> edgeLabels);

        void buildViewWIntersect(std::vector<std::vector<typename GT::VersionIndex> > versions, VertexLabel<GT> nodeLabels, EdgeLabel<GT> edgeLabels);

        void viewUnion(std::vector<typename GT::VersionIndex> versions);

        GraphList<EdgeElement<GT>> mapVertexes(const GraphList<VertexU<GT>>& nodes)const;

        typename GT::Index getDegree(typename GT::Index i)const;
        GraphList<VertexI<GT>> getDegrees()const;
        std::vector<std::pair<typename GT::Index,  EdgeLabel<GT>>> getlabeledRow(typename GT::Index index)const;

        const auto& getA()const;
        const auto& getJA()const;
        const auto& getIA()const;
        const auto& getL()const;
        
     private:

        std::vector<typename GT::Index> originalIndexes_;
        std::vector<typename GT::Index> viewIndexes_;

        std::vector<EdgeLabel<GT>> L_; //Edge labels
        std::vector<typename GT::Value> A_; /**< The values of non-zero edges in the graph.*/
        std::vector<typename GT::Index> JA_; /**< The outgoing node/column index of the edges.*/
        std::vector<AugIA<GT>>IA_; /**< The index bounds in A_ and JA_ for outgoing edges in IA_[index].*/

        const VGraph<GT>* graph_;

};

template<class GT>
auto IntegratedViewer<GT>::getContext()const
{
    return graph_->getContext();
}

template<class GT>
const auto& IntegratedViewer<GT>::getA()const
{
    return A_;
}

template<class GT>
const auto& IntegratedViewer<GT>::getJA()const
{
    return JA_;
}

template<class GT>
const auto& IntegratedViewer<GT>::getIA()const
{
    return IA_;
}

template<class GT>
const auto& IntegratedViewer<GT>::getL()const
{
    return L_;
}



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
const auto& IntegratedViewer<GT>::getLabels(typename GT::Index index)const 
{
    return graph_->getVertexData().lookupLabels(viewIndexes_[index]);
}

template<class GT>
const auto IntegratedViewer<GT>::getLabels(typename GT::Index index1, typename GT::Index index2)const
{
    auto viewIndex1 = originalIndexes_[index1];
    auto viewIndex2 = originalIndexes_[index2];
    
    auto rowBounds = getOutgoingNodes(viewIndex1);
    
    auto it = std::lower_bound(rowBounds.first, rowBounds.second, viewIndex2);
    std::cout<<"{} "<<*it<<" "<<viewIndex2<<std::endl;
    if(*it == viewIndex2)
    {
        std::cout<<"LIU"<<std::endl;
        return(L_[std::distance(JA_.cbegin(), it)]);
    }
    else
        return EdgeLabel<GT>();
}


template<class GT>
auto IntegratedViewer<GT>::getOutgoingNodes(typename GT::Index node)const
{
    return std::make_pair(JA_.begin()+IA_[node].s1() , JA_.begin()+IA_[node].s1()+IA_[node].s2());

}

template<class GT>
std::vector<typename GT::Index> IntegratedViewer<GT>::getSharedConnections(typename GT::Index index1, typename GT::Index index2)const
{
    std::vector<typename GT::Index> res;
    auto row1 = getOutgoingNodes(index1);
    auto row2 = getOutgoingNodes(index2);
    
    std::set_intersection(row1.first, row1.second, row2.first, row2.second, std::back_inserter(res));
    
    return res;
}

template<class GT>
std::pair<size_t, size_t> IntegratedViewer<GT>::size()const
{
  //Acount for undirected where edges are actually /2
  if(graph_->getContext() == Context::undirected)
    return std::make_pair(IA_.size(), A_.size()/2);
  else
    return std::make_pair(IA_.size(), A_.size());
}

template<class GT>
std::map<VertexLabel<GT>, typename GT::Index> IntegratedViewer<GT>::countVertexLabels()const
{
    std::map<VertexLabel<GT>,typename GT::Index> counts;

    for(const auto& e : viewIndexes_)
    {
      //  auto eo = originalIndexes_[e];
        auto label = graph_->getVertexData().lookupLabels(e);

        if(counts.find( label) == counts.end())
            counts[ label] = 1;
        else
            counts[ label] = counts[label]+1;
    }

    return counts;
}

template<class GT>
std::map<EdgeLabel<GT>, typename GT::Index> IntegratedViewer<GT>::countEdgeLabels()const
{
    std::map<EdgeLabel<GT>, typename GT::Index> counts;

    for(const auto& e : L_)
    {
        if(counts.find(e) == counts.end())
            counts[e] = 1;
        else
            counts[e] = counts[e]+1;
    }

    //account for /2 when edges are undirected
    if(graph_->getContext() == Context::undirected)
    {
      for(auto& e : counts)
      e.second /= 2;
    }

    return counts;
}

template<class GT>
typename GT::Index IntegratedViewer<GT>::getOriginalIndex(typename GT::Index viewIndex)const
{
    return viewIndexes_[viewIndex];
}

template<class GT>
typename GT::Index IntegratedViewer<GT>::getViewIndex(typename GT::Index originalIndex)const
{
    return originalIndexes_[originalIndex];
}

template<class GT>
std::vector<typename GT::Index> IntegratedViewer<GT>::convertToViewIndexes(const std::vector<typename GT::Index> fullIndexes)const
{
    std::vector<typename GT::Index> retVal;
    for(const auto& e : fullIndexes)
    {
        auto i = getViewIndex(e);
        if( i != GT::invalidIndex)
            retVal.push_back(i);
    }
    return retVal;
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

    std::vector<ViewRow<GT>> rows;

    //Gets rows from first version, satisfying the nodeLabel constraint
    if(nodeLabels.getBits().any())
    {
        for(typename GT::Index i=0; i<graph_->size(0).nodes_; ++i)
        {
            if((graph_->getVertexData().lookupLabels(i).getBits() & nodeLabels.getBits()).any())
                rows.push_back(std::make_pair(i, graph_->getRowDataZipped(i, versions[0])));
        }
    }
    else
    {
         for(typename GT::Index i=0; i<graph_->size(0).nodes_; ++i)
             rows.push_back(std::make_pair(i, graph_->getRowDataZipped(i, versions[0])));
    }

    //Integrate the rows between versions
    for(auto& row : rows)
    {
        for(size_t v=1; v<versions.size(); ++v)
        {
            auto next = graph_->getRowDataZipped(row.first, versions[v]);
            ZippedRow<GT> tmp;
            setUnionReduced<GT>(row.second.begin(), row.second.end(), next.begin(), next.end(), std::back_inserter(tmp));
            row.second=tmp;
        }
    }

    //Filter out the edges and outgoing nodes that are unrequested
    for(auto& row : rows)
    {
        auto ne = std::remove_if(row.second.begin(), row.second.end(), [edgeLabels, nodeLabels,this, row](const auto& e){
            return (

                      //  (!(std::get<2>(e).getBits() & edgeLabels.getBits()).any()) ||
                        (!(graph_->getVertexData().lookupLabels(row.first).getBits() & nodeLabels.getBits()).any()  )

            );

        });
        row.second.resize(std::distance(row.second.begin(), ne));
    }

    //remove rows with no outgoing edges
    auto ne = std::remove_if(rows.begin(), rows.end(), [](const auto& row){return row.second.size() == 0;});
    rows.resize(std::distance(rows.begin(), ne));

    //Determine the node old->new index mapping

    viewIndexes_ = std::vector<typename GT::Index>(rows.size());
    originalIndexes_ = std::vector<typename GT::Index>(graph_->size(0).nodes_, GT::invalidIndex);

    for(typename GT::Index i=0; i< viewIndexes_.size(); ++i)
    {
        viewIndexes_[i] = rows[i].first;
        originalIndexes_[rows[i].first] = i;
    }


        //Convert to view Indexes
//         std::for_each(row.begin(), row.end(), [this]( auto& e){std::get<0>(e) = originalIndexes_[std::get<0>(e)];});

        for(const auto& row : rows)
        {
            for(const auto& e : row.second)
            {
                //convert to the viewIndex
                JA_.push_back(originalIndexes_[std::get<0>(e)]);

                A_.push_back(std::get<1>(e));
                L_.push_back(std::get<2>(e));

            }

            //Row indices computed based on the length of the current nodes edge segment as standard
            IA_.push_back( AugIA<GT>(JA_.size()-row.second.size(), row.second.size() ));
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
