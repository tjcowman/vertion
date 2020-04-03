#pragma once

#include "vertion.h"
#include "query/IntegratedViewer.h"

#include <string>
#include <unordered_map>
#include <functional>
#include <pthread.h>

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

struct TrackerEntry
{
    std::string key_;
    int numActive_;
    time_t lastUsed_;
};


pthread_mutex_t lock;

//TODO: MAKE THIS THREAD SAFE
template<class GT>
class ViewCache
{
    public:
        ViewCache(const VGraph<GT>& graph,  int cacheSize=10);
        
//         friend std::ostream& operator<<(std::ostream& os, const ViewCache& viewCache)
//         {
//             for(const auto e : viewCache.accessHeap_)
//             {
//                 os<<e.first<<"\t"<<e.second<<"\n";
//             }
//             
//             return os;
//         }
        
        
        bool full()const;
        void clean();
        
        
       auto lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        //TODO: Set up a better way to track number of users of version
        void lockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        void unlockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        

        std::string generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
         int activeCount;
    private:
        
       
//         pthread_mutex_t lock_;
        
        int cacheSize_;
        const VGraph<GT>* graph_;
//         std::map<std::string, IntegratedViewer<GT>> views_;
        
        std::map<std::string, Entry<GT>> views_;
        std::map<std::string, TrackerEntry> users_;
        
//         std::map<std::string, int> viewUsers_;
        
//         std::vector< std::pair<time_t, std::string>> accessHeap_;
};

template<class GT>
ViewCache<GT>::ViewCache(const VGraph<GT>& graph, int cacheSize)
{
    activeCount = 0;
    cacheSize_ = cacheSize;
    views_ = std::map<std::string, Entry<GT>>();
//     viewUsers_ = std::map<std::string, int>();
    graph_= &graph;
//     lock_ = lock;
}

template<class GT>
bool ViewCache<GT>::full()const
{
//     return viewUsers_.size() >= cacheSize_;
}

template<class GT>
void ViewCache<GT>::clean()
{
//     std::cout<<"SB "<<views_.size()<<std::endl;
    std::vector<TrackerEntry> viewsToRemove;
     pthread_mutex_lock(&lock);
    
    if(views_.size()>cacheSize_)
    {
        for(const auto& e : users_)
            viewsToRemove.push_back(e.second);
        
        std::sort(viewsToRemove.begin(), viewsToRemove.end(), [](const auto& lhs, const auto& rhs){return lhs.lastUsed_<rhs.lastUsed_;});
        
        for(int i=0; i<viewsToRemove.size()/2; ++i)
        {
            if(viewsToRemove[i].numActive_==0)
            {
                users_.erase(viewsToRemove[i].key_);
                views_.erase(viewsToRemove[i].key_);
            }
        }
    }
    pthread_mutex_unlock(&lock);
}


//NOTE: attempt at fater lookup mutex //return iterator not &???????
template<class GT>
auto ViewCache<GT>::lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
    std::string key= generate_key(versions, nodeLabels, edgeLabels);
    IntegratedViewer<GT> viewProspective(*graph_); 
    
    pthread_mutex_lock(&lock);
    auto v = views_.find(key);
    pthread_mutex_unlock(&lock);
    
    
    if(v == views_.end())
        viewProspective.buildView(versions, nodeLabels,edgeLabels); 
            
    
    //Check if the view exists
    pthread_mutex_lock(&lock);

        auto v2 = views_.find(key);


        if(v2 == views_.end())
        {
//             IntegratedViewer<GT> view(*graph_); 
//             view.buildView(versions, nodeLabels,edgeLabels); 
            {
                v2 = views_.insert(std::make_pair(key, Entry<GT>{viewProspective,1 ,time(NULL)})).first;
            }
        }

    pthread_mutex_unlock(&lock);
    
    return v2;
}

// template<class GT>
// IntegratedViewer<GT>& ViewCache<GT>::lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
// {
//     std::string key= generate_key(versions, nodeLabels, edgeLabels);
//     
//     //Check if the view exists
//     pthread_mutex_lock(&lock_);
// 
//         auto v = views_.find(key);
// 
// 
//         if(v == views_.end())
//         {
//             IntegratedViewer<GT> view(*graph_); 
//             view.buildView(versions, nodeLabels,edgeLabels); 
//             {
//                 v = views_.insert(std::make_pair(key, Entry<GT>{view,1 ,time(NULL)})).first;
//             }
//         }
// 
//     pthread_mutex_unlock(&lock_);
//     
//     return v->second.view_;
// }

template<class GT>
void ViewCache<GT>::lockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{

     pthread_mutex_lock(&lock);
//     #pragma omp critical
    {
//         std::cout<<"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"<<std::endl;
        
        std::string key= generate_key(versions, nodeLabels, edgeLabels);
        auto v = users_.find(key);
        
        if(v == users_.end())
        {
            users_.insert(std::make_pair(key, TrackerEntry{key, 1,time(NULL)}));
        }
        else
        {
            users_[key] = {key, users_[key].numActive_+1, time(NULL)};
//             ++v->second;
        }
        
         
    }
     pthread_mutex_unlock(&lock);
}

template<class GT>
void ViewCache<GT>::unlockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
     pthread_mutex_lock(&lock);
//     #pragma omp critical
    {
//         std::cout<<"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"<<std::endl;
        std::string key= generate_key(versions, nodeLabels, edgeLabels);
       auto v = users_.find(key);
//          auto v = viewUsers_.at(key);
         
         users_[key].numActive_-=1;
        //--v->second;
        
//         if(v->second == 0)
//         {
// //             viewUsers_.erase(v);
// //             auto v = views_.find(key);
// //             views_.erase(key);
//         }
    }
     pthread_mutex_unlock(&lock);
}


template<class GT>
std::string ViewCache<GT>::generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{
    std::string s;
    auto tmp = versions;
    std::sort(tmp.begin(),tmp.end());
    for(const auto& e : tmp)
        s.append(std::to_string(e));
    s.append(std::to_string(nodeLabels.getBits().to_ulong()));
    s.append(std::to_string(edgeLabels.getBits().to_ulong()));
    return s;
}

