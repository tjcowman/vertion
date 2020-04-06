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
    int entryIndex_;
    int numActive_;
    time_t lastUsed_;
    
    friend std::ostream& operator<<(std::ostream& os, const TrackerEntry& e)
    {
        os<<e.key_<<" : "<< e.entryIndex_<<" : "<<e.numActive_<<" : "<<e.lastUsed_<<"\n";
        return os;
    }
};


template<class GT>
struct ViewKey{
    
    ViewKey(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
    {
        versions_ = versions;
        nodeLabels_ = nodeLabels;
        edgeLabels_ = edgeLabels;
        key_ = generate_key(versions, nodeLabels,edgeLabels);
    }
    
    std::string generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
    {
        std::string s;
        auto tmp = versions_;
        std::sort(tmp.begin(),tmp.end());
        for(const auto& e : tmp)
            s.append(std::to_string(e));
        s.append(std::to_string(nodeLabels_.getBits().to_ulong()));
        s.append(std::to_string(edgeLabels_.getBits().to_ulong()));
        return s;   
    }
    
    
    std::string key_;
    std::vector<typename GT::VersionIndex> versions_;
    VertexLabel<GT> nodeLabels_;
    EdgeLabel<GT> edgeLabels_;
    
};


pthread_mutex_t lock;

//TODO: MAKE THIS THREAD SAFE
template<class GT>
class ViewCache
{
    public:
        ViewCache(const VGraph<GT>& graph,  int cacheSize=10, int sizeFactor=2);
        
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
        
        
//         IntegratedViewer<GT>& lookup(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        IntegratedViewer<GT>& lookup(const ViewKey<GT>& key);
        void finishLookup(const ViewKey<GT>& key);


        static std::string generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        int activeCount;
    private:
        
       
        int cacheSize_; //Should be the number of concurrent threads
        int sizeFactor_; //Multiplier for the cache size, determines number of non-purged versions during a cleanup: e,g, 1=all deleted, 2= half deleted
        
        const VGraph<GT>* graph_;

        
//         std::map<std::string, Entry<GT>> views_;
//         std::map<std::string, TrackerEntry> users_;
        
        
        std::map<std::string, TrackerEntry> viewMap_;
        std::set<int> emptySlots_;
        std::vector<IntegratedViewer<GT>> viewData_;
        

};

template<class GT>
ViewCache<GT>::ViewCache(const VGraph<GT>& graph, int cacheSize, int sizeFactor)
{
//     activeCount = 0;
    cacheSize_ = cacheSize;
    sizeFactor_ = sizeFactor;
    viewData_ = std::vector<IntegratedViewer<GT>>(cacheSize_*sizeFactor_, IntegratedViewer<GT>(graph));
    emptySlots_ = std::set<int>();
    for(int i=0; i<cacheSize_*sizeFactor_; ++i)
        emptySlots_.insert(emptySlots_.end(), i);
    
    
//     views_ = std::map<std::string, Entry<GT>>();
//     viewUsers_ = std::map<std::string, int>();
    graph_= &graph;
//     lock_ = lock;
}

template<class GT>
bool ViewCache<GT>::full()const
{
     return viewMap_.size() > (cacheSize_*(sizeFactor_-1));
}

template<class GT>
void ViewCache<GT>::clean()
{
// //     std::cout<<"SB "<<views_.size()<<std::endl;
    std::vector<TrackerEntry> viewsToRemove;
     pthread_mutex_lock(&lock);
//     
     
     for(const auto& e : viewMap_)
         std::cout<<e.first<<" "<<e.second<<std::endl;
     
    if(full())
    {
        for(const auto& e : viewMap_)
            viewsToRemove.push_back(e.second);
//         
        std::sort(viewsToRemove.begin(), viewsToRemove.end(), [](const auto& lhs, const auto& rhs){return lhs.lastUsed_<rhs.lastUsed_;});
//         
        int numToBlank = viewMap_.size()- (cacheSize_*(sizeFactor_-1));
        for(int i=0; i<numToBlank; ++i)
        {

//             int slotIndex = 
            std::cout<<"blanking "<<viewsToRemove[i].entryIndex_<<std::endl;
            
            emptySlots_.insert(viewsToRemove[i].entryIndex_);
            viewMap_.erase(viewsToRemove[i].key_);

        }
    }
    pthread_mutex_unlock(&lock);
}


// 
template<class GT>
IntegratedViewer<GT>& ViewCache<GT>::lookup(const ViewKey<GT>& key)
{
    pthread_mutex_lock(&lock);
    auto v = viewMap_.find(key.key_);
    
    if(v != viewMap_.end())
    {
        ++v->second.numActive_;
        v->second.lastUsed_ = time(NULL);
        pthread_mutex_unlock(&lock);
        return viewData_[v->second.entryIndex_];   
    }
    else
    {
        pthread_mutex_unlock(&lock);
    }

    
    
    //Generate VersionIndex
    IntegratedViewer<GT> newView(*graph_); 
    newView.buildView(key.versions_, key.nodeLabels_, key.edgeLabels_); 

    
    
    //lookup again
    pthread_mutex_lock(&lock);
    v = viewMap_.find(key.key_);
    
    if(v != viewMap_.end()) //another thread already added the view
    {
        ++v->second.numActive_;
        v->second.lastUsed_ = time(NULL);
        return viewData_[v->second.entryIndex_];   
    }
    else //insert the newly generated view in an available slot
    {
        auto lastE = (--emptySlots_.end());
        
        int viewIndex = (*lastE);
//         std::cout<<"VIN "<<viewIndex<<std::endl;
        emptySlots_.erase(lastE);
        
        //Note: only uses hint to use the non pair return signature
        v = viewMap_.insert(viewMap_.begin(),std::make_pair(key.key_, TrackerEntry{key.key_, viewIndex ,1, time(NULL) }));
        viewData_[viewIndex] = std::move(newView);
    }
    
    pthread_mutex_unlock(&lock);
    return viewData_[v->second.entryIndex_];  
     
     
}


template<class GT>
void ViewCache<GT>::finishLookup(const ViewKey<GT>& key)
{
    pthread_mutex_lock(&lock);
    auto v = viewMap_.at(key.key_);

    v.numActive_ -= 1;
    
    
    pthread_mutex_unlock(&lock);
}

/*template<class GT>
void ViewCache<GT>::lockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
{

     pthread_mutex_lock(&lock);
// //     #pragma omp critical
//     {
// //         std::cout<<"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"<<std::endl;
//         
//         std::string key= generate_key(versions, nodeLabels, edgeLabels);
//         auto v = users_.find(key);
//         
//         if(v == users_.end())
//         {
//             users_.insert(std::make_pair(key, TrackerEntry{key, 1,time(NULL)}));
//         }
//         else
//         {
//             users_[key] = {key, users_[key].numActive_+1, time(NULL)};
// //             ++v->second;
//         }
//         
//          
//     }
     pthread_mutex_unlock(&lock);
}*/

// template<class GT>
// void ViewCache<GT>::lockView(const std::string& key)
// {
//     pthread_mutex_lock(&lock);
//     
//     pthread_mutex_unlock(&lock);
// }

// template<class GT>
// void ViewCache<GT>::unlockView(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
// {
//      pthread_mutex_lock(&lock);
// // //     #pragma omp critical
// //     {
// // //         std::cout<<"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"<<std::endl;
// //         std::string key= generate_key(versions, nodeLabels, edgeLabels);
// //        auto v = users_.find(key);
// // //          auto v = viewUsers_.at(key);
// //          
// //          users_[key].numActive_-=1;
// // 
// //     }
//      pthread_mutex_unlock(&lock);
// }

/*
template<class GT>
void ViewCache<GT>::unlockView(const std::string& key)
{
    pthread_mutex_lock(&lock);
    pthread_mutex_unlock(&lock);
}*/

// template<class GT>
// std::string ViewCache<GT>::generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels)
// {
//     std::string s;
//     auto tmp = versions;
//     std::sort(tmp.begin(),tmp.end());
//     for(const auto& e : tmp)
//         s.append(std::to_string(e));
//     s.append(std::to_string(nodeLabels.getBits().to_ulong()));
//     s.append(std::to_string(edgeLabels.getBits().to_ulong()));
//     return s;
// }

