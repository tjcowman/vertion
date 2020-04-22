#pragma once

#include "vertion.h"
#include "query/IntegratedViewer.h"

#include <queue>

template <class GT>
class Traversal
{
    public:
        Traversal(const IntegratedViewer<GT>& viewer);
        Traversal(const IntegratedViewer<GT>& viewer, const GraphList<VertexI<GT>>& start);

        /**
         * Gets only the indexes of the traversal as an unweighted list
         */
        GraphList<VertexU<GT>> getVertexList()const;

        //Expands the traversal by acquiring all neighbors  of distance 1
        void expand(typename GT::VersionIndex version);

        void traverse();


    private:

        struct ExploreE
        {
            typename GT::Index index_;
            typename GT::Index hops_;
        };

        const IntegratedViewer<GT>* viewer_;

        std::set<typename GT::Index> traversed_;
        std::queue<ExploreE> exploreQueue_;


        GraphList<VertexI<GT>> nodes_;
};

template <class GT>
Traversal<GT>::Traversal(const IntegratedViewer<GT>& viewer)
{
    viewer_ = &viewer;

}

template <class GT>
Traversal<GT>::Traversal(const IntegratedViewer<GT>& viewer, const GraphList<VertexI<GT>>& start)
{
    viewer_ = &viewer;

    nodes_ = start;
    //zero the start nodes
    for(auto& e :nodes_)
    {
        e.value_ = 0;
        traversed_.insert(e.index_);

        exploreQueue_.push({e.index_, e.value_});
    }
}

template <class GT>
GraphList<VertexU<GT>> Traversal<GT>::getVertexList()const
{
    GraphList<VertexU<GT>> nodes;
    for(const auto& e : nodes_)
        nodes.push_back(VertexU<GT>(e.index_, true, e.labels_));

    return nodes;
}

template<class GT>
void Traversal<GT>::expand(typename GT::VersionIndex version)
{
    GraphList<VertexI<GT>> newNodes;

    for(const auto& e : nodes_)
    {
        auto [begin, end] = viewer_->getOutgoingNodes(e.index_);

        for(;begin!=end; ++begin )
        {
            if(traversed_.count(*begin) == 0)
            {
                newNodes.push_back(VertexI<GT>{*begin, e.value_+1});
                traversed_.insert(*begin);
            }
        }
    }

    nodes_.push_back(newNodes);
}

template<class GT>
void Traversal<GT>::traverse()
{
    //Push the source nodes to exploreQueue
    GraphList<VertexI<GT>> newNodes;

    while(exploreQueue_.size()>0 )
    {
        ExploreE cur = exploreQueue_.front();

        auto outE = viewer_->getOutgoingNodes(cur.index_);
        for(auto it= outE.first; it!=outE.second; ++it)
        {
            //Add unexplored outgoigng nodes to the queue
            if( traversed_.count(*it) ==0)
            {
                exploreQueue_.push({*it, cur.hops_+1});
                traversed_.insert(*it);
                newNodes.push_back(VertexI<GT>{*it, cur.hops_+1});
            }
        }
        exploreQueue_.pop();
    }

    nodes_.push_back(newNodes);
}
