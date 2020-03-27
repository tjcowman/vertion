#pragma once

#include "vertion.h"
#include "query/IntegratedViewer.h"

#include <string>
#include <unordered_map>
#include <functional>

template<class GT>
class ViewCache
{
    public:
        ViewCache(const VGraph<GT>& graph, int cacheSize=10);
        
        friend std::ostream& operator<<(std::ostream& os, const ViewCache& viewCache)
        {
            for(const auto e : viewCache.accessHeap_)
            {
                os<<e.first<<"\t"<<e.second<<"\n";
            }
            
            return os;
        }
        
        
        IntegratedViewer<GT>& lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        

        std::string generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        
    private:
        
        int cacheSize_;
        const VGraph<GT>* graph_;
        std::map<std::string, IntegratedViewer<GT>> views_;
        std::vector< std::pair<time_t, std::string>> accessHeap_;
};

template<class GT>
ViewCache<GT>::ViewCache(const VGraph<GT>& graph, int cacheSize)
{
    cacheSize_ = cacheSize;
    views_ = std::map<std::string, IntegratedViewer<GT>>();
    graph_= &graph;
}


//Used when a version is queried while it exists, always increases the timestamp, thus can bubble up the larger of its children recursively after updating 
// bubbleDown( std::vector< std::pair<time_t, std::string>> accessHeap)
// {
//     
// }

template<class GT>
IntegratedViewer<GT>& ViewCache<GT>::lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
    //Check if the view exists
    std::string key= generate_key(versions, nodeLabels, edgeLabels);
    auto v = views_.find(key);

    

    if(v == views_.end())
    {
        IntegratedViewer<GT> view(*graph_); 
        view.buildView(versions, nodeLabels,edgeLabels);
        v = views_.insert(std::make_pair(key,view)).first;
    
    
        //update accessHeap
        accessHeap_.push_back(std::make_pair(time(NULL), key)); 
        std::push_heap(accessHeap_.begin(), accessHeap_.end(), [](const auto& lhs, const auto& rhs){return lhs.first > rhs.first;});
        
        //if cache full, remove oldest
        std::cout<<views_.size()<<" : "<<cacheSize_<<std::endl;
        if(views_.size() > cacheSize_)
        {
            std::string removeKey = accessHeap_.front().second;
            std::pop_heap(accessHeap_.begin(), accessHeap_.end(), [](const auto& lhs, const auto& rhs){return lhs.first > rhs.first;});
            accessHeap_.pop_back();
            views_.erase(views_.find(removeKey));
        }
    }
    //TODO: If already in heap, need to update the access time 
    else{
        //Currently just removes the oldest added, ie NOT LRU
    }
    
    
//     std::cout<<*this<<std::endl;
    return v->second;
    
    
}

template<class GT>
std::string ViewCache<GT>::generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
    std::string s;
    for(const auto& e : versions)
        s.append(std::to_string(e));
    s.append(std::to_string(nodeLabels.getBits().to_ulong()));
    s.append(std::to_string(edgeLabels.getBits().to_ulong()));
    return s;
}

