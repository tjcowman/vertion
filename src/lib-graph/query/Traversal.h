#pragma once

#include "vertion.h"

#include <queue>

template <class GT>
class Traversal
{
    public:
        Traversal(const VGraph<GT>& graph);
        Traversal(const VGraph<GT>& graph, const GraphList<VertexI<GT>>& start);

        /**
         * Gets only the indexes of the traversal as an unweighted list
         */
        GraphList<VertexU<GT>> getVertexList()const;

        //Expands the traversal by acquiring all neighbors  of distance 1
        void expand(typename GT::VersionIndex version);

        //Expands the traversal by including all distance nodes from the input passing through nodes satisfying the function F, where F takes an integer
//         template<typename F>
//         void expand(typename GT::Index distance, F selectF, typename GT::VersionIndex version );



        void traverse(typename GT::VersionIndex version);

        //NOTE: Will only work for hopCount in Traversa lwith current implementation as stores VertexI
//         void shortestPaths(typename GT::Index source);

    private:

        struct ExploreE
        {
            typename GT::Index index_;
            typename GT::Index hops_;
        };

        const VGraph<GT>* graph_;

        std::set<typename GT::Index> traversed_;
        std::queue<ExploreE> exploreQueue_;


        GraphList<VertexI<GT>> nodes_;
};

template <class GT>
Traversal<GT>::Traversal(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

template <class GT>
Traversal<GT>::Traversal(const VGraph<GT>& graph, const GraphList<VertexI<GT>>& start)
{
    graph_ = &graph;

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
        auto [begin, end] = graph_->getOutgoingNodes(e.index_,  version);

//           std::cout<<graph_->getID(e.index_)<<":: "<<std::endl;
        for(;begin!=end; ++begin )
        {
            if(traversed_.count(*begin) == 0)
            {
//                 if(*begin > 1000000000)
                {
//                     std::cout<<graph_->getID(e.index_)<<" :: "<<*begin<<std::endl;
                }

                newNodes.push_back(VertexI<GT>{*begin, e.value_+1});
                traversed_.insert(*begin);
            }
        }
    }

    nodes_.push_back(newNodes);
}

// template<class GT>
// template<typename F>
// void Traversal<GT>::expand(typename GT::Index distance, F select, typename GT::VersionIndex version )
// {
//     //Push the source nodes to exploreQueue
//     GraphList<VertexI<GT>> newNodes;
//
//
//     while(exploreQueue_.size()>0 )
//     {
//         ExploreE cur = exploreQueue_.front();
//
//         auto outE = graph_->getOutgoingNodes(cur.index_, version);
//         for(auto it= outE.first; it!=outE.second; ++it)
//         {
//             //Add unexplored outgoigng nodes to the queue
//             if( traversed_.count(*it) ==0 &&
//                 cur.hops_ < distance &&
//                 selectF(*it)
//             )
//             {
//                 exploreQueue_.push({*it, cur.hops_+1});
//                 traversed_.insert(*it);
//                 newNodes.push_back(VertexI<GT>{*it, cur.hops_+1});
//             }
//         }
//         exploreQueue_.pop();
//     }
//
//     nodes_.push_back(newNodes);
// }

template<class GT>
void Traversal<GT>::traverse(typename GT::VersionIndex version)
{
    //Push the source nodes to exploreQueue
    GraphList<VertexI<GT>> newNodes;

    while(exploreQueue_.size()>0 )
    {
        ExploreE cur = exploreQueue_.front();

        auto outE = graph_->getOutgoingNodes(cur.index_, version);
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


//  /** @struct CurrentShortestDistance
//     *
//     * Used to maintain shortest distances in Dijkstra's algorithm
//     */
//     template<class T>
//     struct CurrentShortestDistance
//     {
//         typename  T::Index v_;
//         typename  T::Value w_;
//
//         bool operator<(const CurrentShortestDistance & rhs)const
//         {
//             return w_<rhs.w_;
//         }
//         bool operator>(const CurrentShortestDistance & rhs)const
//         {
//             return w_>rhs.w_;
//         }
//     };

// template<class GT>
// void Traversal<GT>::shortestPaths(typename GT::Index source)
// {
//     typename GT::Index numNodes = graph_->size(version_).nodes_;
//
//     std::vector<Range> IAU = graph_->getIA(version_);
//     std::vector<typename GT::Value> A = graph_->getA();
//     std::vector<typename GT::Index> JA = graph_->getJA();
//
//     std::vector<typename GT::Value> shortestPathLengths(nodes, std::numeric_limits<typename GT::Value>::infinity());
//     shortestPathLengths[source]=0;
//
//     std::priority_queue<CurrentShortestDistance<T>, std::vector<CurrentShortestDistance<GT> >, std::greater<CurrentShortestDistance<GT> > > exploreQueue;
//     std::vector<bool> explored(nodes, false);
//
//     exploreQueue.push(CurrentShortestDistance<T>{source, 0});
//     while(exploreQueue.size()>0)
//     {
//         typename GT::Index cur = exploreQueue.top().v_;
//         typename GT::Index pathLength =  shortestPathLengths[cur];
//
//         typename GT::Index lb = IAU[cur].begin;
//         typename GT::Index rb = IAU[cur].end;
//
//         //For all outgoing edges of current
//         for(typename GT::Index i=lb; i<rb; ++i)
//         {
//             if( shortestPathLengths[cur] + A[i] < shortestPathLengths[JA[i]])
//             {
//                 shortestPathLengths[JA[i]] = shortestPathLengths[cur] + A[i];
//             }
//             if(! explored[JA[i]] )
//             {
//                 exploreQueue.push( CurrentShortestDistance<T>{ JA[i], shortestPathLengths[JA[i]]} );
//                 explored[JA[i]] = true;
//             }
//         }
//         exploreQueue.pop();
//     }
//
//     return VertexList(shortestPathLengths);
// }
