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
        ViewCache(const VGraph<GT>& graph);
        
        
        IntegratedViewer<GT>& lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        
//         size_t generate_uid(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        std::string generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        
    private:
        
        const VGraph<GT>* graph_;
        std::map<std::string, IntegratedViewer<GT>> views_;
        std::vector< std::pair<uint32_t, time_t>> accessHeap_;
};

template<class GT>
ViewCache<GT>::ViewCache(const VGraph<GT>& graph)
{
    views_ = std::map<std::string, IntegratedViewer<GT>>();
    graph_= &graph;
}

template<class GT>
IntegratedViewer<GT>& ViewCache<GT>::lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
//     std::cout<<graph_->size()<<std::endl;
//     const IntegratedViewer<GT>&  
    //Check if the view exists
    std::string key= generate_key(versions, nodeLabels, edgeLabels);
//     std::cout<<"key "<<key<<std::endl;
    auto v = views_.find(key);
//     std::cout<<"find"<<std::endl;
    if(v != views_.end())
    {
//         std::cout<<"found"<<std::endl;
        return v->second;
    }
    else
    {
        IntegratedViewer<GT> view(*graph_); 
//          std::cout<<"cnstr"<<std::endl;
        view.buildView(versions, nodeLabels,edgeLabels);
//          std::cout<<"builtView"<<std::endl;
        auto nv = views_.insert(std::make_pair(key,view));
//          std::cout<<"inserted"<<std::endl;
        
        return nv.first->second;
    }
    
    
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

// template<class GT>
// size_t ViewCache<GT>::generate_uid(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
// {
//     std::string s;
//     for(const auto& e : versions)
//         s.append(std::to_string(e));
//     s.append(std::to_string(nodeLabels.getBits().to_ulong()));
//     s.append(std::to_string(edgeLabels.getBits().to_ulong()));
//     return std::hash<std::string>{}(s);
// }
