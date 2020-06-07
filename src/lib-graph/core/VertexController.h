#pragma once

#include "LabelMap.h"

#include <fstream>


template<class GT>
std::map<typename GT::Index, typename GT::Index> reIndex(std::map<std::string, typename GT::Index> oldOrder, std::map<std::string, typename GT::Index> newOrder)
{
    std::map<typename GT::Index, typename GT::Index> retVal;
    
    for(const auto& e : oldOrder)
        retVal[e.second] = newOrder[e.first];

    return retVal;
}

template<class GT>
class VertexController
{
    using VertexId = typename GT::VertexInternal;
    using Index = typename GT::Index;
    
    public:
        size_t size()const;
        
        bool contains(const std::string& id)const;
        
        int  addLabel(std::string s);
        std::vector<std::string> getLabels()const;
        
        auto lookup(const std::string& id)const;
        auto lookup(Index index)const;
        std::string lookupURL(Index index)const;
        
        const VertexLabel<GT>& lookupLabels(Index index)const;
        
        //Calls insert with VertexId through parseFromStream
        void insert(const std::string& filename, const VertexLabel<GT>& labels);
        
        void insert(const VertexId& vertex, const VertexLabel<GT>& labels);
       

        std::tuple<VertexController<GT>, std::map<typename GT::Index, typename GT::Index>, std::map<typename GT::Index, typename GT::Index>> merge(const VertexController<GT>& rhs)const;  
        
        auto select(const GraphList<VertexU<GT>>& vertexlist)const;
        
        void flushMissingIds(std::ostream& os)const;
        
        void read_serial(std::istream& is);
        void write_serial(std::ostream& os)const;
        
   
        const static typename GT::Index invalidIndex = std::numeric_limits<typename GT::Index>::max(); //TODO: Find appropriate place for this
    private:
        
        void parseFromStream(std::istream& is, const VertexLabel<GT>& labels);
        void insert_merge(const VertexId& vertex, const VertexLabel<GT>& labels);
        
        LabelMap<GT> labelNames_;

        
        std::vector<std::pair<VertexId, VertexLabel<GT> > > ids_; //Stores the data associated with each node [index] [vertexStruct] [Labels]
        std::map<std::string, Index> mappings_; //NOTE: the string is functionally the vertexInternal name

        
        //Stores ids that were requested by ex: an indexEdgeList operation and were not found;
        mutable std::set<std::string> missingIds_;
};

template<class GT>
bool VertexController<GT>::contains(const std::string& id)const
{
     return (mappings_.find(id) != mappings_.end());
}

template<class GT>
size_t VertexController<GT>::size()const
{
    return ids_.size();
}

template<class GT>
int  VertexController<GT>::addLabel(std::string s)
{
    return labelNames_.addLabel(s);
}

template<class GT>
std::vector<std::string> VertexController<GT>::getLabels()const
{
    return labelNames_.getLabels();
}

template<class GT>
auto VertexController<GT>::lookup(const std::string& id)const
{
    auto it = mappings_.find(id);
    
    if(it != mappings_.end())
        return it->second;
    else
    {
        missingIds_.insert(id);
        return invalidIndex;
    }
}

template<class GT>
auto VertexController<GT>::lookup(Index index)const
{
    return ids_[index].first.name_;
}

template<class GT>
const VertexLabel<GT>& VertexController<GT>::lookupLabels(Index index)const
{
    return ids_[index].second;
}

template<class GT>
std::string VertexController<GT>::lookupURL(Index index)const
{
    return labelNames_.getExternalURL(index);
}

template<class GT>
void VertexController<GT>::insert(const VertexId& vertex, const VertexLabel<GT>& labels)
{
    //check existance
    if (contains(vertex.name_) )
    {
        std::cerr<<"[WARN] "<<vertex.name_<<" exists\n";
        return;
    }
        
    //add to the keyMap (names)
    mappings_.insert(std::make_pair(vertex.name_, ids_.size()));
    
    
    //add to the node structure
    ids_.push_back(std::make_pair(vertex,labels));
}

template<class GT>
void VertexController<GT>::insert_merge(const VertexId& vertex, const VertexLabel<GT>& labels)
{
    //check existance
    if (contains(vertex.name_) )
    {
         ids_[mappings_[vertex.name_]].second = ids_[mappings_[vertex.name_]].second.makeUnion(labels);
    }
    else
    {
        //add to the keyMap (names)
        mappings_.insert(std::make_pair(vertex.name_, ids_.size()));
        
        
        //add to the node structure
        ids_.push_back(std::make_pair(vertex,labels));
    }
}

template<class GT>
void VertexController<GT>::insert(const std::string& filename, const VertexLabel<GT>& labels)
{
    std::ifstream IF(filename);
    if(!IF.is_open())
    {
        std::cerr<<"[ERROR] file <"<<filename<<"> not found"<<std::endl;
        return;
    }
    parseFromStream(IF,labels);
}

template<class GT>
std::tuple<VertexController<GT>, std::map<typename GT::Index, typename GT::Index>, std::map<typename GT::Index, typename GT::Index>> VertexController<GT>::merge(const VertexController<GT>& rhs)const
{
    LabelMap<GT> mergedNames = labelNames_.merge(rhs.labelNames_);
    
    auto lm1 = labelNames_.reIndex(mergedNames);
    auto lm2 = rhs.labelNames_.reIndex(mergedNames);

    
    VertexController<GT> merged;
    
    
    std::map<std::string, typename GT::Index> nodeIds;
    for(const auto& e : ids_)
    {
        nodeIds.insert({e.first.name_, nodeIds.size()});
        merged.insert_merge({e.first}, e.second.recode(lm1));
    }
    for(const auto& e : rhs.ids_)
    {
        nodeIds.insert({e.first.name_, nodeIds.size()});
        merged.insert_merge({e.first}, e.second.recode(lm2));
    }

    //Gets the old -> new id mapping for each graphs nodes
    auto idMap1 = reIndex<GT>(mappings_,nodeIds);
    auto idMap2 = reIndex<GT>(rhs.mappings_,nodeIds);

    
    return std::tie(merged, idMap1, idMap2);
}

template<class GT>
auto  VertexController<GT>::select(const  GraphList<VertexU<GT>>& vertexlist)const
{
    //std::pair< VertexController<GT>  std::vector <Index>>  //, std::map<Index, Index> > 
    
    VertexController<GT> selected;
    std::vector<Index> prevMapping(ids_.size(), invalidIndex);
    
    Index count=0;
    for(const auto& e : vertexlist)
    {
        selected.insert(ids_[e.index_].first, ids_[e.index_].second);
        //prevMapping.push_back(ids_[e.index_].first);
        prevMapping[e.index_] = count;
        ++count;
    }
    return std::make_pair(selected, prevMapping);
}

template<class GT>
void VertexController<GT>::flushMissingIds(std::ostream& os)const
{
    if(missingIds_.size()>0)
    {
        os<<"missing ids...\n";
        for(const auto& e : missingIds_)
            os<<e<<"\n";
    }
    missingIds_.clear();
}

template<class GT>
void VertexController<GT>::read_serial(std::istream& is)
{ 
    labelNames_.read_serial(is);
    
    while(true)
    {
        VertexId v; 
        is >> v;  
        VertexLabel<GT> l; 
        l.read_serial(is);
        //is >> l;
        
        if(is.eof())
            break;
        
        insert(v,l);
    }
}

template<class GT>
void VertexController<GT>::write_serial(std::ostream& os)const
{
    //write vertexLabelNames_
    labelNames_.write_serial(os);
    
    for(const auto& e : ids_)
    {
        os<<e.first<<'\t';
        e.second.write_serial(os)<<'\n';
    }
}

template<class GT>
void VertexController<GT>::parseFromStream(std::istream& is, const VertexLabel<GT>& labels)
{
    //Check the format of the first line to make sure it parses correctly
    VertexId val; is >> val;  
    if(is.peek() != '\n')
    {
        std::cerr<<"[ERROR] element not formatted correctly"<<std::endl;
        return;
    }
    
    insert(val, labels);
    
    while(true)
    {
        VertexId val; is >> val;  
        if(is.eof())
            break;
        
        insert(val, labels);

    }
    
}
