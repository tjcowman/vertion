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
        
        //calculates the shortest paths given the current settings
        void compute(const VertexI<GT>& source, const GraphList<VertexS<GT>>& sinks);
        void scorePaths();
        
        GraphList<EdgeElement<GT>> computeDense(const std::vector<typename GT::Index> & pathNodes)const;
        
        void printPathEdgeLists(std::ostream& os)const;
        void printPathJson(std::ostream& os)const;
        
        const std::vector<Path<GT>>& getPaths()const;
        
        float arg_minWeight_;
        
    private:
        
        
        
        typename GT::Value weightFunction(/*const GraphList<VertexS<GT>>& nodeWeights,*/ typename GT::Index row, typename GT::Index edge, typename GT::Value original)const ;
        
        void computeNodeScores( const GraphList<VertexS<GT>>& sinks);
        
        
        std::vector<typename GT::Index> fromNodes_;
        std::vector<EdgeLabel<GT>> fromLabels_; //tmp 9
        
        std::array<GraphList<VertexS<GT>>, 3> nodeScores_;
        std::map<typename GT::Index, typename GT::Value> nodeScoreLookup_;
        std::map<typename GT::Index, int> nodeDirectionLookup_;
        
        std::vector<Path<GT>> paths_;
        //const VGraph<GT>* graph_;
        const IntegratedViewer<GT>* viewer_;
};

//Calculates the values used to assign order to the paths based on "most interesting"
template<class GT> 
void KinasePaths<GT>::scorePaths()
{
    for(auto& path : paths_)
    {
        path.length_ = path.visitOrder_.size();
        
        path.nonMech_ = 0;
        for(const auto& el : path.edgeLabels_)
            if((el.getBits()  & std::bitset< GT::LabelSize>(9)).any()) //non mechech_
                ++path.nonMech_;
        
        path.nodeScore_ = nodeScoreLookup_[viewer_->getViewIndex(path.visitOrder_[0])]; //Looks at the compute score of the protein node containing the sites
        path.nodeDirection_ = nodeDirectionLookup_[viewer_->getViewIndex(path.visitOrder_[0])];
    }
}

template<class GT> 
void KinasePaths<GT>::computeNodeScores(const GraphList<VertexS<GT>>& sinks)
{
    //for each node index
    auto rangeit = std::equal_range(sinks.begin(), sinks.end(), *sinks.begin());
    
//     std::cout<<sinks<<std::endl;
    
   // while(rangeit.first != sinks.end())
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
                
//              std::cout<<posTotal<<" "<<negTotal<<std::endl;
        }


       // std::cout<<posNum<<" "<<negNum<<" "<<posTotal<<" "<<negTotal<<std::endl;
        
        typename GT::Value posAvg = posNum > 0 ? posTotal/posNum : 0;
        typename GT::Value negAvg = negNum > 0 ? negTotal/negNum : 0;
        
       // std::cout<<"BFVI "<<rangeit.first->index_<<" "<<rangeit.first->value_<<std::endl;
        
//         std::cout<<"VI "<<rangeit.first->index_<<" -> "<<viewIndex<<std::endl;
        
        //compute the magnitude and place in correct nodeScores bin
        if(posNum > 0 && negNum > 0)
            nodeScores_[2].push_back(VertexS<GT>(viewIndex, sqrt(pow(posAvg,2) + pow(negAvg,2)) ));
        else if(posNum > 0)
            nodeScores_[0].push_back(VertexS<GT>(viewIndex,posAvg));
        else
            nodeScores_[1].push_back(VertexS<GT>(viewIndex, negAvg));
        
        if(rangeit.second == sinks.end())
            break;
        
        rangeit = std::equal_range(rangeit.second, sinks.end(), *rangeit.second);
        
    }
    
    //std::cout<<"STSRTING LOOKUP"<<std::endl;
    
    for(int i=0; i<3; ++i)
        for(const auto& e : nodeScores_[i])
        {
            nodeScoreLookup_.insert(std::make_pair(e.index_, e.value_));
            nodeDirectionLookup_.insert(std::make_pair(e.index_, i));
        }
            
//     std::cout<<"NODELOOKUPSIZE "<<nodeScoreLookup_.size()<<std::endl;
        
    //for(
    //std::cout<<nodeScores_[0]<<nodeScores_[1]<<nodeScores_[2];
    
}

template<class GT>
KinasePaths<GT>::KinasePaths(const IntegratedViewer<GT>& viewer)
{
    viewer_ = &viewer;
}

template<class GT>
typename GT::Value KinasePaths<GT>::weightFunction(/*const GraphList<VertexS<GT>>& nodeWeights,*/ typename GT::Index row, typename GT::Index edge, typename GT::Value original)const 
{
    //disallow site->protein 
    if( (viewer_->L_[edge].getBits() == 4  && viewer_->getLabels(row).getBits() == 2)) 
        //if(viewer_->getLabels(row).getBits() == 1))
        return std::numeric_limits<typename GT::Value>::infinity();
    
    
    //Prioritize proten->site KSA
     //if((IV.L_[edge].getBits() & std::bitset<GraphType::GD::LabelSize>(6)).any())
    if((viewer_->L_[edge].getBits() & std::bitset< GT::LabelSize>(6)).any())
        original = .0000001;
    else original=1;
    
    
    //Weight to prefer paths including scoredNodes
    auto it = nodeScoreLookup_.find(edge);
    if(it != nodeScoreLookup_.end())
        original = original * (.5/ it->second);
    
    //Use the rwr score to weight, global so will be no 0s
//     original = original * -log(nodeWeights[edge].value_);
    
    
//     std::cout<<row<<" "<<edge<<" "<<original<<std::endl;
    
    return original;
    
}

//NOTE: the paths are returne dusing global indexes
template<class GT>
void KinasePaths<GT>::compute(const VertexI<GT>& source, const GraphList<VertexS<GT>>& sinks)
{
    computeNodeScores(sinks);
    
    auto Arw = viewer_->A_;
    
    
    //compute the global rwr
    RandomWalker<GT> RW(*viewer_);
    

    typename RandomWalker<GT>::Args_Walk args_walk{.15, 1e-6, GraphList<VertexS<GT>>()};
    auto res = RW.walk(GraphList<VertexS<GT>>(), args_walk);
//     std::cout<<"RWR DONE"<<std::endl;
//     std::cout<<res<<std::endl;
   // row is the node index, edge is the edge index ex: A_[edge] JA_[edge]
    for(typename GT::Index row=0; row<viewer_->size().first; ++row)
    {
        typename GT::Index lb = viewer_->IA_[row].s1();
        typename GT::Index rb = viewer_->IA_[row].s1() + viewer_->IA_[row].s2();
        
        for(typename GraphType::GD::Index edge=lb; edge<rb; ++edge)
        {
//             std::cout<<res[edge].value_<<std::endl;
            Arw[edge] = weightFunction(/*res,*/ row, edge, Arw[edge]* -log(res[viewer_->JA_[edge]].value_) );
        }
    }
    
//     for(const auto& e : Arw)
//         std::cout<<e<<std::endl;

//     std::cout<<"reweight done"<<std::endl;
    //auto sourceIndex = source.index_;
    auto sourceIndex = viewer_->getViewIndex(source.index_);
//     std::cout<<"SI "<<sourceIndex<<std::endl;
    
    
    auto numNodes = viewer_->size().first;
    
    fromNodes_ = std::vector<typename GT::Index> (numNodes,0);
    fromLabels_ =std::vector<EdgeLabel<GT>> (numNodes); //tmp 9
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
       // std::cout<<"i "<<cur.index_<<std::endl;
        typename GT::Index lb = viewer_->IA_[cur.index_].s1();
        typename GT::Index rb = viewer_->IA_[cur.index_].s1() + viewer_->IA_[cur.index_].s2() ;
        
       //typename GT::Index pathLength =  shortestPathLengths[cur];

        for(typename GT::Index i=lb; i<rb; ++i) //i is the index in IA_ of the A_ and JA_
        {
            auto val = Arw[i];
            if(val != std::numeric_limits<typename GT::Value>::infinity())
            {
                auto label = viewer_->L_[i];
                auto oIndex = viewer_->JA_[i];
                

                
                //If the prospective path is shorter

                    if( shortestPathLengths[cur.index_] + val < shortestPathLengths[oIndex])
                    {
                        shortestPathLengths[oIndex] = shortestPathLengths[cur.index_] + val;
                        fromNodes_[oIndex] = cur.index_;
                        fromLabels_[oIndex] = label;
                    }
                
                //Add unexplored outgoigng nodes to the queue
                if( !explored[oIndex])
                {
                        exploreQueue.push({oIndex, shortestPathLengths[oIndex]});
                        explored[oIndex] = true;
                        fromNodes_[oIndex] = cur.index_;
                        fromLabels_[oIndex] = label;

                }
            }
        }
        exploreQueue.pop();
    }
//     std::cout<<"Trav done"<<std::endl;
    
   // std::vector<Path<GT>> paths;
    for(int j=0; j<3; ++j)
    {
     //   std::cout<<"begin j "<<std::endl;
        for(const auto& e : nodeScores_[j].getElements())
        {
            typename GT::Index i=e.index_;
            
            //scorelookup is based on viewIndexes
            if(nodeScoreLookup_[i] < arg_minWeight_)
            {
//                 std::cout<<"WEIGHT NOT PATHED "<<nodeScoreLookup_[i]<<" "<<i<<std::endl;
                continue;
            }
                
           // std::cout<<"SPWEIGHT "<<shortestPathLengths[i]<<std::endl;
            
        // std::cout<<"j= "<<j<<" i= "<<i<<" SPL "<<shortestPathLengths[i]<<" FNS "<<fromNodes_.size()<<std::endl;
            if( shortestPathLengths[i] != std::numeric_limits<typename GT::Value>::infinity()) //make sure node was reachable
            {
                paths_.push_back(Path<GT>());
                
                while( i != sourceIndex)
                {
                  //  std::cout<<i<<std::endl;
                    paths_[paths_.size()-1].push_back(viewer_->getOriginalIndex(i),  fromLabels_[i]);
                    
                    i=fromNodes_[i];
                }
                paths_[paths_.size()-1].push_back_source(viewer_->getOriginalIndex(sourceIndex) );
                
                //break;
            }
            else
            {
//                    std::cout<<"NOT PATHED "<<nodeScoreLookup_[i]<<" "<<i<<std::endl;
            }
        }
    }
    
    scorePaths();
    std::sort(paths_.begin(), paths_.end(), [](const auto& lhs, const auto& rhs){
        return(   std::tie(lhs.nonMech_, lhs.length_/*, lhs.nodeScore_*/) 
                < std::tie(rhs.nonMech_, rhs.length_/*, rhs.nodeScore_*/)             
        );
    });
   // std::cout<<"num paths "<<paths_.size()<<std::endl;

}

template<class GT>
GraphList<EdgeElement<GT>> KinasePaths<GT>::computeDense(const std::vector<typename GT::Index>& pathNodes)const
{
    
    GraphList<EdgeElement<GT>> densePath;
     //std::set<typename GT::Index>
    
    for(int i=0; i<pathNodes.size()-1; ++i)
    {
        auto currentIndex_G = pathNodes[i];
        auto nextIndex_G = pathNodes[i+1];
        
        //Add the root branch
        densePath.push_back(EdgeElement<GT>(currentIndex_G, nextIndex_G, 1,  viewer_->getLabels(currentIndex_G, nextIndex_G)));
        
        for(int j=i+1; j<pathNodes.size(); ++j)
        {
            auto fromIndex_G = pathNodes[j];
            
            //get the intersections (needs ViewIndex)
            auto shared = viewer_->getSharedConnections(viewer_->getViewIndex(currentIndex_G), viewer_->getViewIndex(fromIndex_G));
            
            
            for(const auto& e : shared)
            {
                //if e not already in path
                //if(!paths[pathIndex].has(e))
                {
                //TODO: implement the edge label lookup
                    densePath.push_back(EdgeElement<GT>(viewer_->getOriginalIndex(e), currentIndex_G, 1, viewer_->getLabels(viewer_->getOriginalIndex(e), currentIndex_G)));
                    densePath.push_back(EdgeElement<GT>(viewer_->getOriginalIndex(e), fromIndex_G, 1, viewer_->getLabels(viewer_->getOriginalIndex(e), fromIndex_G)));
                }
            }
        }
    }
    return densePath;
    
}

template<class GT>
void KinasePaths<GT>::printPathEdgeLists(std::ostream& os)const
{
    GraphList<EdgeElement<GT>> edges;
    
    
    os<<"source\ttarget\tpaths\tlabels\n";
    //std::cout<<"print el "<<std::endl;
    for (const auto& path : paths_)
    {
        for(int i=0; i<path.visitOrder_.size()-1; ++i)
            edges.push_back(EdgeElement<GT>(path.visitOrder_[i], path.visitOrder_[i+1], 1, fromLabels_[path.visitOrder_[i]] ));
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
            edges.push_back(EdgeElement<GT>(path.visitOrder_[i], path.visitOrder_[i+1], 1, fromLabels_[path.visitOrder_[i]] ));
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
