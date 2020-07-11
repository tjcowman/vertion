#pragma once

#include "vertion.h"
#include "query/Traversal_View.h"
#include "query/RandomWalker.h" 


#include <nlohmann/json.hpp>
using json = nlohmann::json;

//NOTE: All input should be in terms of global node ids and returned as global ids (view indexes should be handled ) 

/*
 * Generates a set of kinase from a source node (kinase) to a set of phosphorylation site nodes.
 */
template <class GT>
class KinasePaths
{
    public:
        KinasePaths(const IntegratedViewer<GT>& viewer);
        
        
        void compute(const VertexI<GT>& source, const GraphList<VertexS<GT>>& sinks, float mechRatio,  const GraphList<VertexS<GT>>& globalProximity);
        
        
        GraphList<EdgeElement<GT>> computeDense(const std::vector<typename GT::Index> & pathNodes)const;
        
        void printPathEdgeLists(std::ostream& os)const;
        void printPathJson(std::ostream& os)const;
        
        const std::vector<Path<GT>>& getPaths()const;
//         const std::vector<std::vector<Path<GT>>>& getPermPaths()const;
        
        float arg_minWeight_;
        
    private:
        
        
        typename GT::Value weightFunction(typename GT::Index row, typename GT::Index edge, typename GT::Value original, float mechRatio)const;
        void computeNodeScores( const GraphList<VertexS<GT>>& sinks);
        //calculates the shortest paths given the current settings, returns the shortest path lengths
        auto runSP(typename GT::Index sourceIndex, const typename IntegratedViewer<GT>::ArrayA& A, float mechRatio, const typename IntegratedViewer<GT>::ArrayIA& IA, const typename IntegratedViewer<GT>::ArrayJA& JA, const typename IntegratedViewer<GT>::ArrayL& L);
        auto formatPaths(typename GT::Index sourceIndex)const;
        void scorePaths(std::vector<Path<GT>>& paths);
        
        std::map<typename GT::Index, std::pair<typename GT::Value, int>> nodeScoreLookup_; //(Score,Direction)
        
        
        //TODO: replace with single index corresponding to the vector JA/A location
        std::vector<std::pair<typename GT::Index,EdgeLabel<GT>>> fromData_; //(source node, edgelabel)

        
        
        std::vector<Path<GT>> paths_;
//         std::vector<std::vector<Path<GT>>> permPaths_;
        
        const IntegratedViewer<GT>* viewer_;
};

//Calculates the values used to assign order to the paths based on "most interesting"
template<class GT> 
void KinasePaths<GT>::scorePaths(std::vector<Path<GT>>& paths)
{
    for(auto& path : paths)
    {
        if(!path.empty())
        {
            path.length_ = path.visitOrder_.size();
            
            path.nonMech_ = 0;
            for(const auto& el : path.edgeLabels_)
                if((el.getBits()  & std::bitset< GT::LabelSize>(9)).any()) //non mechech_
                    ++path.nonMech_;
            
            path.nodeScore_ = nodeScoreLookup_[viewer_->getViewIndex(path.visitOrder_[0])].first; //Looks at the compute score of the protein node containing the sites
            path.nodeDirection_ = nodeScoreLookup_[viewer_->getViewIndex(path.visitOrder_[0])].second;
            //nodeDirectionLookup_[viewer_->getViewIndex(path.visitOrder_[0])];
        }
    }
}

template<class GT> 
void KinasePaths<GT>::computeNodeScores(const GraphList<VertexS<GT>>& sinks)
{
     std::array<GraphList<VertexS<GT>>, 3> nodeScores; //Stores the node score information based on the passed set of sites
     
    //for each node index
    auto rangeit = std::equal_range(sinks.begin(), sinks.end(), *sinks.begin());
    
    while(true)
    {
        auto viewIndex = viewer_->getViewIndex(rangeit.first->index_);
        typename GT::Value posTotal = 0.0;
        typename GT::Index posNum = 0;
        
        typename GT::Value negTotal = 0.0;
        typename GT::Index negNum =0;
        
        
        while(rangeit.first != rangeit.second)
        {
            if(rangeit.first->value_ > 0)
            {
                posTotal+= rangeit.first->value_;
                ++posNum;
            }
            else
            {
                negTotal+= std::abs(rangeit.first->value_);
                ++negNum;
            }
             ++rangeit.first;
        }

        typename GT::Value posAvg = posNum > 0 ? posTotal/posNum : 0;
        typename GT::Value negAvg = negNum > 0 ? negTotal/negNum : 0;
        
        //compute the magnitude and place in correct nodeScores bin
        if(posNum > 0 && negNum > 0)
            nodeScores[2].push_back(VertexS<GT>(viewIndex, sqrt(pow(posAvg,2) + pow(negAvg,2)) ));
        else if(posNum > 0)
            nodeScores[0].push_back(VertexS<GT>(viewIndex,posAvg));
        else
            nodeScores[1].push_back(VertexS<GT>(viewIndex, negAvg));
        
        if(rangeit.second == sinks.end())
            break;
        
        rangeit = std::equal_range(rangeit.second, sinks.end(), *rangeit.second);
        
    }
    
    
    for(int i=0; i<3; ++i)
        for(const auto& e : nodeScores[i])
        {
            nodeScoreLookup_.insert(std::make_pair(e.index_, std::make_pair(e.value_, i )));
        }

}

template<class GT>
KinasePaths<GT>::KinasePaths(const IntegratedViewer<GT>& viewer)
{
    viewer_ = &viewer;
}

template<class GT>
typename GT::Value KinasePaths<GT>::weightFunction(typename GT::Index row, typename GT::Index edge, typename GT::Value original, float mechRatio)const 
{
     const auto & L = viewer_->getL();
    //disallow site->protein 
    if( (L[edge].getBits() == 4  && viewer_->getLabels(row).getBits() == 2)) 
        return std::numeric_limits<typename GT::Value>::infinity();
    
    
    //Prioritize proten->site KSA
    if(!(L[edge].getBits() & std::bitset< GT::LabelSize>(6)).any())
        original = mechRatio;
    else original=1;
    
    
    //Weight to prefer paths including scoredNodes
    auto it = nodeScoreLookup_.find(edge);
    if(it != nodeScoreLookup_.end())
        original = original * (.5/ it->second.first);

    return original;    
}

template<class GT>
auto KinasePaths<GT>::runSP(typename GT::Index sourceIndex, const typename IntegratedViewer<GT>::ArrayA& A,  float mechRatio, const typename IntegratedViewer<GT>::ArrayIA& IA, const typename IntegratedViewer<GT>::ArrayJA& JA, const typename IntegratedViewer<GT>::ArrayL& L)
{
    auto numNodes = viewer_->size().first;

    fromData_ = decltype(fromData_)(numNodes, std::make_pair(-1, 0)); 
    
    std::vector<bool> explored(numNodes, false);
    std::set<typename GT::Index> traversed;

    traversed.insert(sourceIndex);

    std::vector<typename GT::Value> shortestPathLengths(numNodes, std::numeric_limits<typename GT::Value>::infinity());
    shortestPathLengths[sourceIndex]=0.0;
    
    std::priority_queue<CurrentShortestDistance<GT>, std::vector<CurrentShortestDistance<GT> >, std::greater<CurrentShortestDistance<GT> > > exploreQueue;
    exploreQueue.push(CurrentShortestDistance<GT>{sourceIndex, 0.0});
    
    while(exploreQueue.size()>0)
    {
        CurrentShortestDistance cur = exploreQueue.top();
//         std::cout<<cur.index_<<std::endl;
       // std::cout<<"i "<<cur.index_<<std::endl;
        typename GT::Index lb = IA[cur.index_].s1();
        typename GT::Index rb = IA[cur.index_].s1() + IA[cur.index_].s2() ;
        
       //typename GT::Index pathLength =  shortestPathLengths[cur];

        for(typename GT::Index i=lb; i<rb; ++i) //i is the index in IA_ of the A_ and JA_
        {
            auto val = A[i];
            if(val != std::numeric_limits<typename GT::Value>::infinity())
            {
                auto label = L[i];
                auto oIndex = JA[i];
                
                    //If the prospective path is shorter
                    if( shortestPathLengths[cur.index_] + val < shortestPathLengths[oIndex])
                    {
                        shortestPathLengths[oIndex] = shortestPathLengths[cur.index_] + val;
                        fromData_[oIndex] = std::make_pair(cur.index_, label);
                    }
                
                //Add unexplored outgoigng nodes to the queue
                if( !explored[oIndex])
                {
                        exploreQueue.push({oIndex, shortestPathLengths[oIndex]});
                        explored[oIndex] = true;
                        fromData_[oIndex] = std::make_pair(cur.index_, label);
                }
            }
        }
        exploreQueue.pop();
    }
    return shortestPathLengths;
}

template<class GT>
auto KinasePaths<GT>::formatPaths(typename GT::Index sourceIndex)const
{
    std::vector<Path<GT>> paths;
    //Traces the paths back from the sink nodes to fill out the computed paths
    for(const auto& e : nodeScoreLookup_)
    {
        auto index = e.first;
        auto score = e.second.first;

        //scorelookup is based on viewIndexes
        if(score < arg_minWeight_)
        {
            continue;
        }
            
//         if( shortestPathLengths[index] != std::numeric_limits<typename GT::Value>::infinity()) //make sure node was reachable
        if(fromData_[index].first != -1)
        {
            paths.push_back(Path<GT>());
            
            while( index != sourceIndex)
            {
                paths[paths.size()-1].push_back(viewer_->getOriginalIndex(index),  fromData_[index].second);
                index=fromData_[index].first;
            }
            paths[paths.size()-1].push_back_source(viewer_->getOriginalIndex(sourceIndex) );
        }
        else
        {
            paths.push_back(Path<GT>());
//             std::cout<<"NOT PATHED "<<" "<<std::endl;
        }
    }
    return paths;

}

//NOTE: the paths are returned using global indexes
template<class GT>
void KinasePaths<GT>::compute(const VertexI<GT>& source, const GraphList<VertexS<GT>>& sinks, float mechRatio, const GraphList<VertexS<GT>>& globalProximity)
{
    computeNodeScores(sinks);
    
    auto Arw = viewer_->getA(); //makes copy of the weight array 
    const auto& IA = viewer_->getIA();
    const auto& JA = viewer_->getJA();
    const auto& L = viewer_->getL();

   // row is the node index, edge is the edge index ex: A_[edge] JA_[edge]
    for(typename GT::Index row=0; row<viewer_->size().first; ++row)
    {
        typename GT::Index lb = IA[row].s1();
        typename GT::Index rb = IA[row].s1() + IA[row].s2();
        
        for(typename GraphType::GD::Index edge=lb; edge<rb; ++edge)
        {
            Arw[edge] = weightFunction( row, edge, Arw[edge]* -log(globalProximity[JA[edge]].value_) , mechRatio );  //Use the rwr score to weight, global so will be no 0s
        }
    }

    
    //Performs djikstras algorithm for the provided source and sink nodes
    auto sourceIndex = viewer_->getViewIndex(source.index_);
    auto spLengths = std::move(runSP(sourceIndex, Arw, mechRatio, IA, JA, L));
    
    paths_ = formatPaths(sourceIndex);
    
    for(int i=0; i<paths_.size(); ++i)
        if(!paths_[i].empty())
            paths_[i].totalWeight_ = spLengths[ viewer_->getViewIndex(paths_[i].visitOrder_[0]) ]; 
    
    
    
    scorePaths(paths_);



}

// template<class GT>
// GraphList<EdgeElement<GT>> KinasePaths<GT>::computeDense(const std::vector<typename GT::Index>& pathNodes)const
// {
//     
//     GraphList<EdgeElement<GT>> densePath;
//      //std::set<typename GT::Index>
//     
//     for(int i=0; i<pathNodes.size()-1; ++i)
//     {
//         auto currentIndex_G = pathNodes[i];
//         auto nextIndex_G = pathNodes[i+1];
//         
//         //Add the root branch
//         densePath.push_back(EdgeElement<GT>(currentIndex_G, nextIndex_G, 1,  viewer_->getLabels(currentIndex_G, nextIndex_G)));
//         
//         for(int j=i+1; j<pathNodes.size(); ++j)
//         {
//             auto fromIndex_G = pathNodes[j];
//             
//             //get the intersections (needs ViewIndex)
//             auto shared = viewer_->getSharedConnections(viewer_->getViewIndex(currentIndex_G), viewer_->getViewIndex(fromIndex_G));
//             
//             
//             for(const auto& e : shared)
//             {
//                 //if e not already in path
//                 //if(!paths[pathIndex].has(e))
//                 {
//                 //TODO: implement the edge label lookup
//                     densePath.push_back(EdgeElement<GT>(viewer_->getOriginalIndex(e), currentIndex_G, 1, viewer_->getLabels(viewer_->getOriginalIndex(e), currentIndex_G)));
//                     densePath.push_back(EdgeElement<GT>(viewer_->getOriginalIndex(e), fromIndex_G, 1, viewer_->getLabels(viewer_->getOriginalIndex(e), fromIndex_G)));
//                 }
//             }
//         }
//     }
//     return densePath;
//     
// }

template<class GT>
void KinasePaths<GT>::printPathEdgeLists(std::ostream& os)const
{
    GraphList<EdgeElement<GT>> edges;
    
    
    os<<"source\ttarget\tpaths\tlabels\n";
    //std::cout<<"print el "<<std::endl;
    for (const auto& path : paths_)
    {
        for(int i=0; i<path.visitOrder_.size()-1; ++i)
            edges.push_back(EdgeElement<GT>(path.visitOrder_[i], path.visitOrder_[i+1], 1, fromData_[path.visitOrder_[i]].second ));
            //os<<viewer_->graph_->getID(viewer_->getOriginalIndex(path.visitOrder_[i]))<<"\t"<<viewer_->graph_->getID(viewer_->getOriginalIndex(path.visitOrder_[i+1]))<<"\t"<<fromLabels_[path.visitOrder_[i]].getBits().to_ulong()<<"\n";
    }
    
    //reduce
   edges.sort(EdgeSort::indexInc);
    //auto ne = edges.accumulate
    
   edges.reduce(EdgeReduce::sum);
    
    //print
    for(const auto& e : edges)
        os<<viewer_->graph_->getID(viewer_->getOriginalIndex(e.index1_))<<"\t"<<viewer_->graph_->getID(viewer_->getOriginalIndex(e.index2_))<<"\t"<<e.value_<<"\t"<<e.labels_.getBits().to_ulong()<<"\n";
    
    
//     for(const auto& e : SP.getElements())
//        OUT<<IV.graph_->getID(IV.getOriginalIndex(e.index1_))<<"\t"<<IV.graph_->getID(IV.getOriginalIndex(e.index2_))<<"\t"<<e.value_<<"\t"<<e.labels_.getBits().to_ulong()<<"\t"<<manualLabel<<"\n";
}

template<class GT>
void KinasePaths<GT>::printPathJson(std::ostream& os)const
{
    GraphList<EdgeElement<GT>> edges;
    
    //std::cout<<"print el "<<std::endl;
    for (const auto& path : paths_)
    {
        for(int i=0; i<path.visitOrder_.size()-1; ++i)
            edges.push_back(EdgeElement<GT>(path.visitOrder_[i], path.visitOrder_[i+1], 1, fromData_[path.visitOrder_[i]].second ));
            //os<<viewer_->graph_->getID(viewer_->getOriginalIndex(path.visitOrder_[i]))<<"\t"<<viewer_->graph_->getID(viewer_->getOriginalIndex(path.visitOrder_[i+1]))<<"\t"<<fromLabels_[path.visitOrder_[i]].getBits().to_ulong()<<"\n";
    }
    
    //reduce
   edges.sort(EdgeSort::indexInc);
    //auto ne = edges.accumulate
    
   edges.reduce(EdgeReduce::sum);
   
   os<<"{\"elements\": { \"edges\": [";
   
   for(const auto& e : edges)
       os<<"{\"source\": \""<<viewer_->graph_->getID(viewer_->getOriginalIndex(e.index1_))<<"\", \"target\": \""<<viewer_->graph_->getID(viewer_->getOriginalIndex(e.index2_))<<"\"},\n";
   
   os<<"]}}";
    
}

template<class GT>
const std::vector<Path<GT>>& KinasePaths<GT>::getPaths()const
{
    return paths_;
}

// template<class GT>
// const std::vector<std::vector<Path<GT>>>& KinasePaths<GT>::getPermPaths()const
// {
//     return permPaths_;
// }
