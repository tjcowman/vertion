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

        //Caculate the shortest paths from the cource to sink based on hops_
        GraphList<EdgeElement<GT>> shortestPaths(const VertexI<GT>& source, const GraphList<VertexI<GT>>& sink);

        GraphList<EdgeElement<GT>> shortestPathsWeighted(const VertexI<GT>& sourceIndex, const GraphList<VertexI<GT>>& sink);

        /**
        * Gets only the indexes of the traversal as an unweighted list
        */
        GraphList<VertexU<GT>> getVertexList()const;

        //Expands the traversal by acquiring all neighbors  of distance 1
        void expand();

        void traverse();


    private:

        struct ExploreE
        {
            typename GT::Index index_;
            typename GT::Index hops_;

            friend std::ostream& operator<<( std::ostream& os, const ExploreE& e)
            {
                os<<"("<<e.index_<<" : "<<e.hops_<<")";
                return os;
            }
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
GraphList<EdgeElement<GT>> Traversal<GT>::shortestPaths(const VertexI<GT>& source, const GraphList<VertexI<GT>>& sink)
{
    std::vector<typename GT::Index> fromNodes(viewer_->size().first,0);
    
    std::vector<EdgeLabel<GT>> fromLabels(viewer_->size().first); //tmp 9

    std::set<typename GT::Index> missingNodes;
    for(const auto& e : sink.getElements())
    missingNodes.insert(e.index_);

    traversed_.insert(source.index_);
    exploreQueue_.push({source.index_, source.value_});

    //Stop if nowhere left to explore or the sink nodes have been found
    while(exploreQueue_.size()>0 && missingNodes.size()>0 )
    {
        ExploreE cur = exploreQueue_.front();
        auto outE = viewer_->getlabeledRow(cur.index_);
        //for(auto it= outE.first; it!=outE.second; ++it)
        for(const auto& e : outE)
        {
            //Add unexplored outgoigng nodes to the queue
            if( traversed_.count(e.first) ==0)
            {
                exploreQueue_.push({e.first, cur.hops_+1});
                traversed_.insert(e.first);
                fromNodes[e.first] = cur.index_;
                fromLabels[e.first] = e.second;
                missingNodes.erase(e.first);
            }
        }
        exploreQueue_.pop();
    }

    //Get the edgeList for the traversal tree
    GraphList<EdgeElement<GT>> spTree;
    for(const auto& e : sink)
    {
        typename GT::Index i=e.index_;
        while( i != source.index_)
        {
        if(missingNodes.count(i) == 0) //make sure node was reachable
        {
        //  std::cout<<"L "<<fromLabels[i]<<" "<<i<<" "<<source.index_<<std::endl;
            spTree.push_back(EdgeElement<GT>(i,fromNodes[i], 1, fromLabels[i]));

        }
        i=fromNodes[i];
        }

    }
    return(spTree);
}

template<class GT>
struct Path
{
    bool empty()
    {
        return (visitOrder_.size() == 0 );
    }
    
    void push_back(typename GT::Index index, EdgeLabel<GT> edgeLabel)
    {
        indexes_.insert(index);
        visitOrder_.push_back(index);
        edgeLabels_.push_back(edgeLabel);
    }
    
    //source doesnt have a edge leading into
    void push_back_source(typename GT::Index index)
    {
        indexes_.insert(index);
        visitOrder_.push_back(index);
    }
    
    bool has(typename GT::Index index )
    {
        return indexes_.count(index) > 0;
    }
 
//     std::ostream& operator<<(std::ostream& os, const auto& e)
//     {
//         for(const auto& e :  visitOrder_)
//             os<<e<<" ";
//         return os;
//     }
 
    typename GT::Index length_;
    typename GT::Index nonMech_;
    float nodeScore_;
    int nodeDirection_;
    
    std::set<typename GT::Index> indexes_;
    std::vector<typename GT::Index>visitOrder_;
    std::vector<EdgeLabel<GT>> edgeLabels_;
    float totalWeight_;
//     std::vector<typename GT::Value> edgeWeights_;
};

/** @struct CurrentShortestDistance
*
* Used to maintain shortest distances in Dijkstra's algorithm
*/
template<class T>
struct CurrentShortestDistance
{
    typename  T::Index index_;
    typename  T::Value w_;

    bool operator<(const CurrentShortestDistance & rhs)const
    {
        return w_<rhs.w_;
    }
    bool operator>(const CurrentShortestDistance & rhs)const
    {
        return w_>rhs.w_;
    }
};


//Merge nodeThreshold combines sink nodes when they have the same computed path
template <class GT>
GraphList<EdgeElement<GT>> Traversal<GT>::shortestPathsWeighted(const VertexI<GT>& sourceIndex, const GraphList<VertexI<GT>>& sink)
{
    //auto source = viewer_->getViewIndex(sourceIndex.index_);
    auto source = sourceIndex.index_;
    
    auto numNodes = viewer_->size().first;
    
    std::vector<typename GT::Index> fromNodes(numNodes,0);
    std::vector<EdgeLabel<GT>> fromLabels(numNodes); //tmp 9
    std::vector<bool> explored(numNodes, false);
    


    traversed_.insert(source);

    std::vector<typename GT::Value> shortestPathLengths(numNodes, std::numeric_limits<typename GT::Value>::infinity());
    shortestPathLengths[source]=0;
    
    std::priority_queue<CurrentShortestDistance<GT>, std::vector<CurrentShortestDistance<GT> >, std::greater<CurrentShortestDistance<GT> > > exploreQueue;
    exploreQueue.push(CurrentShortestDistance<GT>{source, 0});
    
    while(exploreQueue.size()>0)
    {
        CurrentShortestDistance cur = exploreQueue.top();
        //auto outE = viewer_->getlabeledRow(cur.index_);
       // std::cout<<cur.index_<<std::endl;
        typename GT::Index lb = viewer_->IA_[cur.index_].s1();
        typename GT::Index rb = viewer_->IA_[cur.index_].s1() + viewer_->IA_[cur.index_].s2() ;
        
       //typename GT::Index pathLength =  shortestPathLengths[cur];

        for(typename GT::Index i=lb; i<rb; ++i) //i is the index in IA_ of the A_ and JA_
        {
            auto val = viewer_->A_[i];
            auto label = viewer_->L_[i];
            auto oIndex = viewer_->JA_[i];
            
              if( label.getBits() == 4  && viewer_->getLabels(oIndex).getBits() == 1) //disallow site to protein direction  for KSA
              {
               //   std::cout<<"RAN"<<std::endl;
                  continue;
              }
            
            //If the prospective path is shorter
           // std::cout<<shortestPathLengths[cur.index_] + viewer_->A_[viewer_->JA_[i]]<<" : "<<shortestPathLengths[viewer_->JA_[i]]<<std::endl;
            if( shortestPathLengths[cur.index_] + val < shortestPathLengths[oIndex])
            {
         
               // std::cout<<shortestPathLengths[viewer_->JA_[i]]<<" -> ";
                shortestPathLengths[oIndex] = shortestPathLengths[cur.index_] + val;
              //  std::cout<<shortestPathLengths[viewer_->JA_[i]]<<std::endl;
                fromNodes[oIndex] = cur.index_;
                fromLabels[oIndex] = label;
            }
            
            //Add unexplored outgoigng nodes to the queue
            if( !explored[oIndex])
            {
              
                    
                    exploreQueue.push({oIndex, shortestPathLengths[oIndex]});
                    //traversed_.insert(e.first);
                    explored[oIndex] = true;
                    fromNodes[oIndex] = cur.index_;
                    fromLabels[oIndex] = label;

            }
        }
        exploreQueue.pop();
    }

    
    //Trace the paths for each query node
//     std::vector<Path<GT>> Paths(sink.size());
//     for(const auto& e : sink)
//     {
//         typename GT::Index i=e.index_;
//         if( shortestPathLengths[i] != std::numeric_limits<typename GT::Value>::infinity()) //make sure node was reachable
//             while( i != source)
//             {
//                 Paths[e.index_].visitOrder.push_back(i);
//                 
//                 i=fromNodes[i];
//             }
//     }
    
    //temporary for the first reachable site, find the dense path subnetwork
    std::vector<Path<GT>> paths;
    
    for(const auto& e : sink)
    {
        paths.push_back(Path<GT>());
        
        typename GT::Index i=e.index_;
        if( shortestPathLengths[i] != std::numeric_limits<typename GT::Value>::infinity()) //make sure node was reachable
        {
            while( i != source)
            {
                std::cout<<i<<std::endl;
                //paths[e.index_].visitOrder_.push_back(i);
                //paths[paths.size()-1].visitOrder_.push_back(i);
                paths[paths.size()-1].push_back(i);
                
                i=fromNodes[i];
            }
            
            break;
        }
    }
    
    GraphList<EdgeElement<GT>> densePath;
    for(int pathIndex=0; pathIndex<paths.size(); ++pathIndex)
    {
        for(int i=0; i<paths[pathIndex].visitOrder_.size(); ++i)
        {
            std::cout<<"VO "<<i<<" "<<paths[pathIndex].visitOrder_[i]<<std::endl;
            auto currentIndex = paths[pathIndex].visitOrder_[i];
            //auto fromIndex = fromNodes
            
            //Add the root branch
            densePath.push_back(EdgeElement<GT>(currentIndex,fromNodes[currentIndex], 1, fromLabels[currentIndex]));
            
            for(int j=i+1; j<paths[pathIndex].visitOrder_.size(); ++j)
            {
                auto fromIndex = paths[pathIndex].visitOrder_[j];
                
                //get the intersections
                auto shared = viewer_->getSharedConnections(currentIndex, fromIndex);
                
                
                for(const auto& e : shared)
                {
                    //if e not already in path
                    if(!paths[pathIndex].has(e))
                    {
                    //TODO: implement the edge label lookup
                        densePath.push_back(EdgeElement<GT>(e,currentIndex, 1, EdgeLabel<GT>()));
                        densePath.push_back(EdgeElement<GT>(e,fromIndex, 1, EdgeLabel<GT>()));
                    }
                }
            }
        }
    }
    return densePath;
    
    
    //Get the edgeList for the traversal tree
    {
//         GraphList<EdgeElement<GT>> spTree;
//         for(const auto& e : sink)
//         {
//             typename GT::Index i=e.index_;
//             
//             
//             GraphList<EdgeElement<GT>> currentPath;
//             bool mechanisticEdge = false;
//             while( i != source)
//             {
//                 if( shortestPathLengths[i] != std::numeric_limits<typename GT::Value>::infinity()) //make sure node was reachable
//                 {
//                 //  std::cout<<"L "<<fromLabels[i]<<" "<<i<<" "<<source.index_<<std::endl;
//                     currentPath.push_back(EdgeElement<GT>(i,fromNodes[i], 1, fromLabels[i]));
//                     if( (fromLabels[i].getBits()& std::bitset<GraphType::GD::LabelSize>(6)).any())
//                         mechanisticEdge=true;
//                 }
//                 i=fromNodes[i];
//             }
//             //add path edges if pass
//             if(mechanisticEdge)
//                 spTree.push_back(currentPath);
// 
//         }
//     
//         
//         //consolidate the edges that were traversed by multiple paths
//         spTree.makeValid(EdgeReduce::sum);
        
//       return(spTree);
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
void Traversal<GT>::expand()
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
