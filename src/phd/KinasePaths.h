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
    using NodeInput = const GraphList<VertexS<GT>> &;
    
    public:
        KinasePaths(const IntegratedViewer<GT>& viewer);
        
        void compute(NodeInput source, NodeInput sinks);
        void computeSiteE(NodeInput source, NodeInput sinks,   GraphList<VertexHP<GT>>& reWeights);
        std::vector<Path<GT>> computeCrossP(NodeInput path1, NodeInput  path2,  NodeInput reWeights);
        
       // std::vector<Path<GT>> computeCrossPaths(const VertexS<GT>& source , const GraphList<VertexS<GT>>& sinks);
        
        
       // void printPathEdgeLists(std::ostream& os)const;
        
        const std::vector<std::vector<Path<GT>>>& getPaths()const;

        
        float arg_mechRatio_;
        float arg_weightFraction_;
        
    private:
        
        
        void weightFunction(std::vector<typename GT::Value>&, NodeInput reWeights = NodeInput{})const;
        
        void computeNodeScores( const GraphList<VertexS<GT>>& sinks);
        //calculates the shortest paths given the current settings, returns the shortest path lengths
        auto runSP(typename GT::Index sourceIndex, const typename IntegratedViewer<GT>::ArrayA& A);
        
        /*
         * Organizes the results of the shotest path search into a vector of path objects
         */
        auto formatPaths(typename GT::Index sourceIndex,  const std::vector<typename GT::Value>& shortestPathLengths, const std::vector<typename GT::Index>& sinkIndexes= std::vector<typename GT::Index>() )const;
       
        void scorePaths(std::vector<Path<GT>>& paths);
        
        std::map<typename GT::Index, std::pair<typename GT::Value, int>> nodeScoreLookup_; //(Score,Direction)
        
        
        //TODO: replace with single index corresponding to the vector JA/A location
        std::vector<std::pair<typename GT::Index,EdgeLabel<GT>>> fromData_; //(source node, edgelabel)

        
        //Filled out for each requested kinase
        std::vector<std::vector<Path<GT>>> paths_;

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
    arg_weightFraction_ = 1;
}

template<class GT>
auto KinasePaths<GT>::runSP(typename GT::Index sourceIndex, const typename IntegratedViewer<GT>::ArrayA& A)
{
    const auto& IA = viewer_->getIA();
    const auto& JA = viewer_->getJA();
    const auto& L = viewer_->getL();
    
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
        exploreQueue.pop();

        typename GT::Index lb = IA[cur.index_].s1();
        typename GT::Index rb = IA[cur.index_].s1() + IA[cur.index_].s2() ;
        

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
                        exploreQueue.push({oIndex, shortestPathLengths[oIndex]});
                }                
            }
        }
        
    }
    return shortestPathLengths;
}

template<class GT>
auto KinasePaths<GT>::formatPaths(typename GT::Index sourceIndex,  const std::vector<typename GT::Value>& shortestPathLengths, const std::vector<typename GT::Index>& sinkIndexes)const
{
    std::vector<Path<GT>> paths;
    
    
    std::vector<std::pair<typename GT::Value, typename GT::Index>> topPaths;
    
    if(sinkIndexes.size()==0) //default to all pathable if none are requested
    {
        for(const auto& e : nodeScoreLookup_)
        {
            //compute the sorted scores for nodes that were pathable
            if( shortestPathLengths[e.first] != std::numeric_limits<typename GT::Value>::infinity())
            {
                topPaths.push_back(std::make_pair(e.second.first,e.first));
            }
            std::sort(topPaths.begin(), topPaths.end());
        }
    }
    else
    {
        for(const auto& e : sinkIndexes)
            if( shortestPathLengths[e] != std::numeric_limits<typename GT::Value>::infinity())
                topPaths.push_back(std::make_pair(0,e));
        
    }
    
    //Traces the paths back from the sink nodes to fill out the computed paths
    for(typename GT::Index i=0; i<topPaths.size()*arg_weightFraction_; ++i)
    {
        auto index = topPaths[i].second;
        auto score = topPaths[i].first;

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
        }
        
    }
    return paths;

}



template<class GT>
void KinasePaths<GT>::weightFunction(std::vector<typename GT::Value>& A, NodeInput reWeights)const 
{
    const auto& IA = viewer_->getIA();
    const auto & L = viewer_->getL();
    const auto& JA = viewer_->getJA();
    
    if(reWeights.size() == 0)
    {
        for(typename GT::Index row=0; row<viewer_->size().first; ++row)
        {
            typename GT::Index lb = IA[row].s1();
            typename GT::Index rb = IA[row].s1() + IA[row].s2();
            
            for(typename GraphType::GD::Index edge=lb; edge<rb; ++edge)
            {
                //Prioritize proten->site KSA
                if(!(L[edge].getBits() & std::bitset< GT::LabelSize>(6)).any())
                    A[edge] *=  arg_mechRatio_;


                auto it = nodeScoreLookup_.find(edge);
                if(it != nodeScoreLookup_.end())
                {
                    A[edge]  *= 1/std::abs((it->second.first));
                }
            }
        }
    }
    else
    {
        for(typename GT::Index row=0; row<viewer_->size().first; ++row)
        {
            typename GT::Index lb = IA[row].s1();
            typename GT::Index rb = IA[row].s1() + IA[row].s2();
            
            for(typename GraphType::GD::Index edge=lb; edge<rb; ++edge)
            {
                //Prioritize proten->site KSA
                if(!(L[edge].getBits() & std::bitset< GT::LabelSize>(6)).any())
                    A[edge] *=  arg_mechRatio_;


                auto it = nodeScoreLookup_.find(edge);
                if(it != nodeScoreLookup_.end())
                {
                    A[edge]  *= 1/std::abs((it->second.first));
                }
                
                A[edge] *= 1/-log(reWeights[JA[edge]].value_);
            }
        }
        
    }
}

template<class GT>
void KinasePaths<GT>::compute(NodeInput source, NodeInput sinks)
{
    computeNodeScores(sinks);
    
    auto Arw = viewer_->getA(); //makes copy of the weight array to apply new edge weighting
    weightFunction(Arw);

    paths_= std::vector<std::vector<Path<GT>>>(source.size());
    for(int k=0; k<source.size(); ++k)
    {
        if(source[k].index_ !=  GT::invalidIndex)
        {
            //Performs djikstras algorithm for the provided source and sink nodes
            auto sourceIndex = viewer_->getViewIndex(source[k].index_);
            auto spLengths = std::move(runSP(sourceIndex, Arw));
            
            paths_[k] = formatPaths(sourceIndex, spLengths);
            
            for(int i=0; i<paths_[k].size(); ++i)
                if(!paths_[k][i].empty())
                    paths_[k][i].totalWeight_ = spLengths[ viewer_->getViewIndex(paths_[k][i].visitOrder_[0]) ]; 
            
            scorePaths(paths_[k]);
        }
    }

}

//NOTE: the paths are returned using global indexes
template<class GT>
void KinasePaths<GT>::computeSiteE(NodeInput source, NodeInput sinks,  GraphList<VertexHP<GT>>& reWeights)
{    
    computeNodeScores(sinks);
    
    auto Arw = viewer_->getA(); //makes copy of the weight array 
    //for(const auto& e : Arw)
      //  e *= 1/-log(reWeights[JA[edge]].value_;
    
    
    weightFunction(Arw, reWeights);
    
    paths_= std::vector<std::vector<Path<GT>>>(source.size());
    for(int k=0; k<source.size(); ++k)
    {
        auto sinkIndex = viewer_->getViewIndex(sinks[0].index_); //should only be one sink
        if(source[k].index_ !=  GT::invalidIndex)
        {
            //Performs djikstras algorithm for the provided source and sink nodes
            auto sourceIndex = viewer_->getViewIndex(source[k].index_);
            auto spLengths = std::move(runSP(sourceIndex, Arw));
            
            paths_[k] = formatPaths(sourceIndex, spLengths, std::vector<typename GT::Index>{sinkIndex});
            
            for(int i=0; i<paths_[k].size(); ++i)
                if(!paths_[k][i].empty())
                    paths_[k][i].totalWeight_ = spLengths[ viewer_->getViewIndex(paths_[k][i].visitOrder_[0]) ]; 
            
        }
    }


}

template<class GT>
std::vector<Path<GT>> KinasePaths<GT>::computeCrossP(NodeInput path1, NodeInput  path2,  NodeInput reWeights)
{
    auto Arw = viewer_->getA(); //makes copy of the weight array 
    const auto & L = viewer_->getL();
    weightFunction(Arw, reWeights);
//     
//     //get list of the kinase nodes for each path
    auto kp1 = path1.select([ &](const auto& e){return viewer_->getLabels(viewer_->getViewIndex(e.index_)).getBits()[2];});
    auto kp2 = path2.select([ &](const auto& e){return viewer_->getLabels(viewer_->getViewIndex(e.index_)).getBits()[2] ;});
//     
    std::cout<<kp1.size()<<" ::: "<<kp2.size()<<std::endl;
    
    std::vector<Path<GT>> retPaths;
    
    for(const auto& k1 : kp1)
    {
        auto sourceIndex = viewer_->getViewIndex(k1.index_);
       // paths_= std::vector<std::vector<Path<GT>>>();
        for(const auto& k2 : kp2)
        {
            if(k1.index_ == k2.index_){continue;}
         
            
            //for(int k=0; k<source.size(); ++k)
            //{
                auto sinkIndex = viewer_->getViewIndex(k2.index_); //should only be one sink

                //Performs djikstras algorithm for the provided source and sink nodes
                
                auto spLengths = std::move(runSP(sourceIndex, Arw));
                
                auto paths = formatPaths(sourceIndex, spLengths, std::vector<typename GT::Index>{sinkIndex});
                
                
                retPaths.insert(retPaths.end(), paths.begin(), paths.end());
                
//                 for(int i=0; i<paths_[k].size(); ++i)
//                     if(!paths_[k][i].empty())
//                         paths_[k][i].totalWeight_ = spLengths[ viewer_->getViewIndex(paths_[k][i].visitOrder_[0]) ]; 
//                     
                
           // }
            std::cout<<retPaths.size()<<std::endl;
            
            
        }
    }
    return retPaths;

    
    
}



/*
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
    }
    
    //reduce
   edges.sort(EdgeSort::indexInc);
   edges.reduce(EdgeReduce::sum);
    
    //print
    for(const auto& e : edges)
        os<<viewer_->graph_->getID(viewer_->getOriginalIndex(e.index1_))<<"\t"<<viewer_->graph_->getID(viewer_->getOriginalIndex(e.index2_))<<"\t"<<e.value_<<"\t"<<e.labels_.getBits().to_ulong()<<"\n";
}
*/

template<class GT>
const std::vector<std::vector<Path<GT>>>& KinasePaths<GT>::getPaths()const
{
    return paths_;
}
