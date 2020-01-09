#pragma once

#include <vector>


//NOTE: Adaptor that will explicity contain reverse edges in the case of an undirected context of its edgeLists
//TODO: This class just needs a lot of work in general

enum class Change
{
    add,
    remove
};

template<class T>
class VersionChanges
{
    public:
        using Index = typename T::Index;
        using Value = typename T::Value;
    
        friend std::ostream& operator<<(std::ostream & out, VersionChanges versionChanges)
        {
            out<<"ADD"<<std::endl;  
                out<<versionChanges.additions_<<std::endl;     
            out<<"REM"<<std::endl;
                out<<versionChanges.removals_<<std::endl; 
            out<<"REW"<<std::endl;
                out<<versionChanges.weights_<<std::endl;
            
            return out;
        }
        
        VersionChanges();
        VersionChanges(const EdgeList & edgelist, Change change);
        
        //NOTE: Expects valid edgelist input
        VersionChanges(const EdgeList& additions, const EdgeList& removals, const EdgeList& weights);
        
        
        
        bool empty()const;
        
        Index getMaxReferencedNodeIndex()const;
        Index getLargestAddedNodeIndex()const;

        
        EdgeList additions_;
        EdgeList removals_;
        EdgeList weights_;
        
        
    private:
        void parseEdgeList(EdgeList& list, const EdgeList& from);
};

template<class T>
void VersionChanges<T>::parseEdgeList(EdgeList& list, const EdgeList& from)
{
    if(from.getContext() == Context::none)
    {
        std::cerr<<"No context for VersionChange Edgelist"<<std::endl;
    }
    
    list = from;
    if(list.size() > 0)
    {
        list.makeValid(EdgeReduce::mean);
        
        if(from.getContext() == Context::undirected)
        {
            list.addExplicitReverseEdges();
            list.sort(EdgeSort::indexInc);
        }
    }
}

template<class T>
VersionChanges<T>::VersionChanges() : additions_(Context::none), removals_(Context::none), weights_(Context::none)
{

}

template<class T>
VersionChanges<T>::VersionChanges(const EdgeList& edgelist, Change change) : additions_(Context::none), removals_(Context::none), weights_(Context::none)
{
    if(change == Change::add)
    {
        parseEdgeList(additions_, edgelist);
    }
    else if (change == Change::remove)
    {
        parseEdgeList(removals_, edgelist);
    }
}

template<class T>
VersionChanges<T>::VersionChanges(const EdgeList & additions, const EdgeList & removals, const EdgeList & weights)
{
    parseEdgeList(additions_, additions);
    parseEdgeList(removals_, removals);
    parseEdgeList(weights_, weights);
}

template<class T>
bool VersionChanges<T>::empty()const
{
     return additions_.size() == 0 && removals_.size() == 0 && weights_.size() == 0;
}

//TODO: not efficient
template<class T>
typename  T::Index VersionChanges<T>::getMaxReferencedNodeIndex()const
{
    Index maxIndex = -1;
    
    for(auto e : additions_.getElements())
    {
        maxIndex = std::max(std::max(e.index1_, e.index2_),maxIndex);
    }
            
    for(auto e : removals_.getElements())
    {
        maxIndex = std::max(std::max(e.index1_, e.index2_),maxIndex);
    }
    
    
    return maxIndex;
}

template<class T>
typename  T::Index VersionChanges<T>::getLargestAddedNodeIndex()const
{
    Index maxIndex = -1;
    
    for(auto e : additions_.getElements())
    {
       // cout<<e.vertex1_<<" "<<e.vertex2_<<endl;
        maxIndex = std::max(std::max(e.index1_, e.index2_),maxIndex);
    }
    
     return maxIndex;
}
