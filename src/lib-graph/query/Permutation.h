#pragma once

std::default_random_engine generator;

template<class GT>
class Permutation
{    
    public:
        Permutation(const VGraph<GT>& graph);
        
        GraphList<EdgeElement<GT>> edgePermutation(typename GT::VersionIndex version, typename GT::Index swaps);
        
        /*
        * Permutes the edges such that label x only swaps with label x and takes a labels object to specifiy which edge labels to permute
        */

        GraphList<EdgeElement<GT>> edgePermutationCoherent(typename GT::VersionIndex version, EdgeLabel<GT> labels);
        
        //NOTE: indexPairs need to be propagated to all edge types, otherwise the same edge may be created with conflicting labels
        void edgePermutation_helper(GraphList<EdgeElement<GT>>& edgelist, std::set<std::pair<typename GT::Index, typename GT::Index>>& indexPairs, typename GT::Index swaps);
        
    private:
        const VGraph<GT>* graph_;
};

template<class GT>
Permutation<GT>::Permutation(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

template<class GT>
GraphList<EdgeElement<GT>> Permutation<GT>::edgePermutation(typename GT::VersionIndex version, typename GT::Index swaps)
{
    GraphList<EdgeElement<GT>> permutation = graph_->getEdgeList(version);

    edgePermutation_helper(permutation, swaps);
    
    permutation.makeValid(EdgeReduce::sum);

    return permutation;
}

    
//NOTE: NOTE: NOT ACTUALLY WRONG PRETTY SURE
//NOTE: BUG: NODE types get crossed when between types ex: PHS PHS -> Site/Site and Protein/Protein, maybe? (PHS:SSF:KSI), ehhh maybe not whats happening
//Many KSI edges between protein and Site
template<class GT>
GraphList<EdgeElement<GT>> Permutation<GT>::edgePermutationCoherent(typename GT::VersionIndex version, EdgeLabel<GT> labels)
{
    GraphList<EdgeElement<GT>> permutationReduced(graph_->getContext());
    GraphList<EdgeElement<GT>> edgelistFull = graph_->getEdgeList(version);
    
    std::array<GraphList<EdgeElement<GT>>, GT::LabelSize> edgelists;
    
    //sort out the different edge labels into the edgelists
    for(const auto&  e : edgelistFull)
    {
        auto slot = labels.getBits() & e.labels_.getBits();
        if(slot.count() == 1)
        {
            //find the edgelist for that label
//                 std::cout<<"pushing_back "<<e<<std::endl;
            
            edgelists[e.labels_.getSetLS()].push_back(e);
        }
        else
        {
            std::cerr<<"[WARN] coherent permutation on multi-label edge"<<std::endl;
        }
    }
    
    //collect all initial index pairs
    std::set<std::pair<typename GT::Index, typename GT::Index>> indexPairs;
    for(const auto& e : edgelistFull)
    {
        indexPairs.insert(std::make_pair(e.index1_, e.index2_));
    }
    
    for(int i=0; i<labels.size(); ++i)
    {
        if(labels[i] == 1) //Checks whether to incldue based on label mask
        {
            edgePermutation_helper(edgelists[i], indexPairs, edgelists[i].size()*2);
  
            for(const auto & e : edgelists[i])
                permutationReduced.push_back(e);
        }
    }
//         std::cout<<"LABEL PRED "<<permutationReduced.size()<<std::endl;
//         std::cout<<permutationReduced<<std::endl;
    permutationReduced.makeValid(EdgeReduce::sum);
    
    return permutationReduced;
}
    
    template<class GT> //NOTE: when edge is between differing node types, the orderedness of the indexs should keep them consistant?
    void Permutation<GT>::edgePermutation_helper(GraphList<EdgeElement<GT>>& edgelist, std::set<std::pair<typename GT::Index, typename GT::Index>>& indexPairs, typename GT::Index swaps)
    {
        //std::set<std::pair<typename T::Index, typename T::Index>> indexPairs;
        
       // std::default_random_engine generator;
        std::uniform_int_distribution<typename GT::Index> distribution(0, edgelist.size()-1);
        

     
        for (size_t i=0; i<swaps; ++i)
        {
            
            typename GT::Index n1;
            typename GT::Index n2;
            std::pair<typename GT::Index, typename GT::Index> old1;
            std::pair<typename GT::Index, typename GT::Index> old2;
            std::pair<typename GT::Index, typename GT::Index> new1;
            std::pair<typename GT::Index, typename GT::Index> new2;
            
            while(true)
            {
                //Check not same edges
                n1 = distribution(generator);
                n2 = distribution(generator);
                if(n1 == n2)
                    continue;
                
                //Check edge indexes unique
                if( ( edgelist[n1].index1_ == edgelist[n2].index1_ ) ||
                    ( edgelist[n1].index1_ == edgelist[n2].index2_ ) || 
                    ( edgelist[n2].index1_ == edgelist[n1].index2_) || 
                    ( edgelist[n1].index2_ == edgelist[n2].index2_) 
                   
                )
                    continue;
                
                old1 = std::make_pair( edgelist[n1].index1_, edgelist[n1].index2_);
                old2 = std::make_pair( edgelist[n2].index1_,  edgelist[n2].index2_);
                
//                    std::cout<<old1.first<<" "<<old1.second<<std::endl;
//                     std::cout<<old2.first<<" "<<old2.second<<std::endl;
                
                new1 = std::make_pair( edgelist[n1].index1_, edgelist[n2].index2_);
                new2 = std::make_pair( edgelist[n2].index1_,  edgelist[n1].index2_);
                    
                //Check for wrong index order if undirected
                if(edgelist.getContext() == Context::undirected)
                {
                    if(new1.second < new1.first)
                        std::swap(new1.first, new1.second);
                    if(new2.second < new2.first)
                        std::swap(new2.first, new2.second);
                    
                }
                
               // std::cout<<"newsPros "<<new1.first<<" "<<new1.second<<" : "<<new2.first<<" "<<new2.second<<std::endl;
                
                //check that prospective edges don't exist
                if( indexPairs.count(new1) != 0 || indexPairs.count(new2) != 0)
                    continue;

                
                
                break;
                
                
            }
            
            //swap the edges
             std::swap(edgelist[n1].index2_, edgelist[n2].index2_);
             
            if(edgelist.getContext() == Context::undirected)
            {
                edgelist[n1].sort();
                edgelist[n2].sort();
            }
            
            //update existing pairs
            auto it1 = indexPairs.find(old1);
            auto it2 = indexPairs.find(old2);
            
            if(it1 != indexPairs.end())
            {
                indexPairs.erase(it1);
            }
//              else
//                  std::cout<<"o1 "<<i<<" "<<old1.first<<" "<<old1.second<<" not found"<<std::endl;
            if(it2 != indexPairs.end())
            {
                indexPairs.erase(it2);
            }
//             else
//                  std::cout<<"o2 "<<i<<" "<<old2.first<<" "<<old2.second<<" not found"<<std::endl;
            
            
//              std::cout<<new1.first<<" "<<new1.second<<" added"<<std::endl;
//             std::cout<<new2.first<<" "<<new2.second<<" added"<<std::endl;
            indexPairs.insert(new1);
            indexPairs.insert(new2);
        }   
    }
