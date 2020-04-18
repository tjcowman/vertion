#pragma once

#include "vertion.h"
#include "query/IntegratedViewer.h"

#include <string>
#include <unordered_map>
#include <functional>
// #include <pthread.h>
#include <thread>
#include <mutex>

#include <nlohmann/json.hpp>
using json = nlohmann::json;



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
        os<<e.key_<<" : "<< e.entryIndex_<<" : "<<e.numActive_<<" : "<<e.lastUsed_;
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
        s.append("-");
        s.append(std::to_string(nodeLabels_.getBits().to_ulong()));
        s.append("-");
        s.append(std::to_string(edgeLabels_.getBits().to_ulong()));
        return s;   
    }
    
    
    std::string key_;
    std::vector<typename GT::VersionIndex> versions_;
    VertexLabel<GT> nodeLabels_;
    EdgeLabel<GT> edgeLabels_;
    
};

template<class GT>
class ViewSummary{
    
    public:
        ViewSummary(){}
        
        void compute(const IntegratedViewer<GT>& view)
        {
            std::tie(numNodes_, numEdges_) = view.size(); 
            numVertexLabels_ = view.countVertexLabels();
            numEdgeLabels_ = view.countEdgeLabels();
        }
        


        friend void to_json(json& j, const ViewSummary<GT>& vs)
        {
//             j= json{{"nodes", vs.numNodes_}, {"edges", vs.numEdges_}};
            
            j= {{"nodes",json::array()}, {"edges",json::array()}};
             
            for(const auto& e : vs.numVertexLabels_)
                j["nodes"].push_back({
                    {"labels", e.first.getBits().to_ulong()},
                    {"count", e.second}
                });
            for(const auto& e : vs.numEdgeLabels_)
                j["edges"].push_back({
                    {"labels",e.first.getBits().to_ulong()},
                    {"count", e.second}
                    
                });
                
        }
            
    private:
        typename GT::Index numNodes_;
        typename GT::Index numEdges_;
        
        std::map<VertexLabel<GT>, typename GT::Index> numVertexLabels_;
        std::map<EdgeLabel<GT>, typename GT::Index> numEdgeLabels_;
};




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
        
        
        json getViewSummary(const std::string& key);
        
        IntegratedViewer<GT>& lookup(const ViewKey<GT>& key);
        void finishLookup(const ViewKey<GT>& key);


        static std::string generate_key(const std::vector<typename GT::VersionIndex>& versions, const VertexLabel<GT>& nodeLabels, const EdgeLabel<GT>& edgeLabels);
        int activeCount;
    private:
        std::mutex lock;
        
       
        int cacheSize_; //Should be the number of concurrent threads
        int sizeFactor_; //Multiplier for the cache size, determines number of non-purged versions during a cleanup: e,g, 1=all deleted, 2= half deleted
        
        const VGraph<GT>* graph_;

        //store various view summary statistics (Note these are not purged upon a view cleanup)
        std::map<std::string, ViewSummary<GT>> viewSummaries_;
        
        std::map<std::string, TrackerEntry> viewMap_;
        std::set<int> emptySlots_;
        std::vector<IntegratedViewer<GT>> viewData_;
        

};

template<class GT>
ViewCache<GT>::ViewCache(const VGraph<GT>& graph, int cacheSize, int sizeFactor)
{
    cacheSize_ = cacheSize;
    sizeFactor_ = sizeFactor;
    viewData_ = std::vector<IntegratedViewer<GT>>(cacheSize_*sizeFactor_, IntegratedViewer<GT>(graph));
    emptySlots_ = std::set<int>();
    for(int i=0; i<cacheSize_*sizeFactor_; ++i)
        emptySlots_.insert(emptySlots_.end(), i);
    
    graph_= &graph;
}

template<class GT>
bool ViewCache<GT>::full()const
{
     return viewMap_.size() > (cacheSize_*(sizeFactor_-1));
}

template<class GT>
void ViewCache<GT>::clean()
{
     if(full()) //if another thread already cleaned up
     {
        std::vector<TrackerEntry> viewsToRemove;

        lock.lock();
    //     
        
//         for(const auto& e : viewMap_)
//             std::cout<<e.first<<" "<<e.second<<std::endl;

        for(const auto& e : viewMap_)
            viewsToRemove.push_back(e.second);
    //         
        std::sort(viewsToRemove.begin(), viewsToRemove.end(), [](const auto& lhs, const auto& rhs){return lhs.lastUsed_<rhs.lastUsed_;});
//         
        int numToBlank = viewMap_.size()- (cacheSize_*(sizeFactor_-1));
        for(int i=0; i<viewsToRemove.size(); ++i)
        {
            if(viewsToRemove[i].numActive_ <=0)
            {
                --numToBlank;
                //             int slotIndex = 
//             std::cout<<"blanking "<<viewsToRemove[i].entryIndex_<<std::endl;
            
                emptySlots_.insert(viewsToRemove[i].entryIndex_);
                viewMap_.erase(viewsToRemove[i].key_);
            }



            if(numToBlank <= 0)
                break;
        }
        lock.unlock();
    }
}

template<class GT>
json ViewCache<GT>::getViewSummary(const std::string& key)
{
    return json(viewSummaries_.at(key));
}

// 
template<class GT>
IntegratedViewer<GT>& ViewCache<GT>::lookup(const ViewKey<GT>& key)
{
    //The summary existence also needs to be checked in the lock, but need to be able to compute it in the non blocking portion
    bool summaryExists = false;
    
    lock.lock();
    
    if (viewSummaries_.count(key.key_) != 0)
        summaryExists = true;
    
    auto v = viewMap_.find(key.key_);
    
    if(v != viewMap_.end())
    {
        ++v->second.numActive_;
        v->second.lastUsed_ = time(NULL);
        
        lock.unlock();
        return viewData_[v->second.entryIndex_];   
    }
    else
    {
         lock.unlock();
    }

    //Generate VersionIndex (Doesn't block other threads)
    IntegratedViewer<GT> newView(*graph_); 
    newView.buildView(key.versions_, key.nodeLabels_, key.edgeLabels_); 
    
    //If summary stats don't exist, compute them as well
    ViewSummary<GT> newSummary;
    if(!summaryExists)
       newSummary.compute(newView);
    
    //lookup again
    lock.lock();
    v = viewMap_.find(key.key_);
    
    if(v != viewMap_.end()) //another thread already added the view
    {
        ++v->second.numActive_;
        v->second.lastUsed_ = time(NULL);

        lock.unlock();
        return viewData_[v->second.entryIndex_];   
    }
    else //insert the newly generated view in an available slot
    {
        auto lastE = (--emptySlots_.end());
        int viewIndex = (*lastE);

        emptySlots_.erase(lastE);
        
        //Note: only uses hint to use the non pair return signature
        v = viewMap_.insert(viewMap_.begin(),std::make_pair(key.key_, TrackerEntry{key.key_, viewIndex ,1, time(NULL) }));
        viewData_[viewIndex] = std::move(newView);
    }
    
    if (viewSummaries_.count(key.key_) == 0)
        viewSummaries_.insert(std::make_pair(key.key_, std::move(newSummary)));
    
    lock.unlock();
    return viewData_[v->second.entryIndex_];  
}


template<class GT>
void ViewCache<GT>::finishLookup(const ViewKey<GT>& key)
{
    lock.lock();

    //NOTE: map.at does not decrment the value, not sure why
    auto v = viewMap_.find(key.key_);
    
    std::cout<<v->second.numActive_<<std::endl;
    v->second.numActive_ -=1;
    std::cout<<v->second.numActive_<<std::endl;
    
    lock.unlock();
}
