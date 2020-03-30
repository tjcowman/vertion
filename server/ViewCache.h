#pragma once

#include "vertion.h"
#include "query/IntegratedViewer.h"

#include <string>
#include <unordered_map>
#include <functional>

template<class GT>
struct Entry
{
    IntegratedViewer<GT> view_;
    int users_;
    time_t lastUsed_;
    
    void print()const
    {
        std::cout<<users_<<" : "<<lastUsed_<<std::endl;
    }
};

//TODO: MAKE THIS THREAD SAFE
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
        
        
        bool full()const;
        void clean();
        
        
        IntegratedViewer<GT>& lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        //TODO: Set up a better way to track number of users of version
        void lockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        void unlockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        

        std::string generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
         int activeCount;
//     private:
        
       
        
        int cacheSize_;
        const VGraph<GT>* graph_;
//         std::map<std::string, IntegratedViewer<GT>> views_;
        
        std::map<std::string, Entry<GT>> views_;
        std::map<std::string, int> viewUsers_;
        
        std::vector< std::pair<time_t, std::string>> accessHeap_;
};

template<class GT>
ViewCache<GT>::ViewCache(const VGraph<GT>& graph, int cacheSize)
{
    activeCount = 0;
    cacheSize_ = cacheSize;
    views_ = std::map<std::string, Entry<GT>>();
    viewUsers_ = std::map<std::string, int>();
    graph_= &graph;
}

template<class GT>
bool ViewCache<GT>::full()const
{
    return viewUsers_.size() >= cacheSize_;
}

template<class GT>
void ViewCache<GT>::clean()
{
//     sleep(10);
//     for(const auto& e : views_)
    for(auto it=views_.begin(); it!=views_.end() ;++it)
    {
        auto numUsers = viewUsers_.find(it->first);
        //if (it->second.users_ == 0)
        if(numUsers->second ==0)
        {
            views_.erase(it);
            viewUsers_.erase(numUsers);
        }
//             views_.erase(e);
    }
    
}

//Used when a version is queried while it exists, always increases the timestamp, thus can bubble up the larger of its children recursively after updating 
// bubbleDown( std::vector< std::pair<time_t, std::string>> accessHeap)
// {
//     
// }


//NOTE: LOOKUP SETS IN USE TO ONE, NEED TO REMEBER TO DECREMENT
template<class GT>
IntegratedViewer<GT>& ViewCache<GT>::lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{

    
    //Check if the view exists
    #pragma omp critical
    {
        std::string key= generate_key(versions, nodeLabels, edgeLabels);
        auto v = views_.find(key);

        

        if(v == views_.end())
        {
            IntegratedViewer<GT> view(*graph_); 
            view.buildView(versions, nodeLabels,edgeLabels);
            v = views_.insert(std::make_pair(key, Entry<GT>{view,1 ,time(NULL)})).first;

        }
        else
        {
            //Increment users count
//             ++v->second.users_;
        }

//             for(const auto& e : views_)
//         e.second.print();
        
        return v->second.view_;
    }
    
}

template<class GT>
void ViewCache<GT>::lockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
//     #pragma omp critical
    {
        std::string key= generate_key(versions, nodeLabels, edgeLabels);
        auto v = viewUsers_.find(key);
        
        if(v == viewUsers_.end())
        {
            viewUsers_.insert(std::make_pair(key, 1));
        }
        else
        {
            ++v->second;
        }
        
         
    }
}

template<class GT>
void ViewCache<GT>::unlockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
//     #pragma omp critical
    {
        std::string key= generate_key(versions, nodeLabels, edgeLabels);
        auto v = viewUsers_.find(key);
         
        
        --v->second;
        
        if(v->second == 0)
        {
//             viewUsers_.erase(v);
//             auto v = views_.find(key);
//             views_.erase(key);
        }
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

