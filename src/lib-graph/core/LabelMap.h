#pragma once

#include<vector>
#include<string>
#include<map>

template<class GT>
class LabelMap
{
    public:
        
        int addLabel(const std::string& s);
        
        std::vector<std::string> getLabels()const;
       
        size_t size()const;
       
        LabelMap<GT> merge(const LabelMap<GT>& rhs)const;
        std::map<typename GT::Index, typename GT::Index> reIndex(const LabelMap<GT>& rhs)const;
        
        template<class K>
        auto lookup(const K& key)const;
        
        
    
        void read_serial(std::istream& is);
        void write_serial(std::ostream& os)const;
        
    private:
        
        std::map<typename GT::Index, std::string>  poss_;
        std::map<std::string, typename GT::Index>  labels_;
};

template<class GT>
int LabelMap<GT>::addLabel(const std::string& s)
{
//     for(const auto& e : poss_)
//         std::cout<<e.first<<" : "<< e.second<<std::endl;
    
    if(poss_.size() < GT::LabelSize)
    {
        poss_.insert({poss_.size(),s});
        labels_.insert({s,poss_.size()-1}); //-1 as poss incremented at this point
    }
    else
    {
        std::cerr<<"[error] labels full"<<std::endl;
        return 1;
    }
    return 0;
}

template<class GT>
std::vector<std::string> LabelMap<GT>::getLabels()const
{
    std::vector<std::string> retVal(size());
    for(const auto& e : poss_)
        retVal[e.first] = e.second;
    return retVal;
}

template<class GT>
size_t LabelMap<GT>::size()const
{
    return poss_.size();
}

template<typename GT> 
LabelMap<GT> LabelMap<GT>::merge(const LabelMap<GT>& rhs) const
{
    LabelMap<GT> retVal;
    
    for(const auto& e : labels_)
       retVal.addLabel(e.first);
    for(const auto& e : rhs.labels_)
       retVal.addLabel(e.first);
    
    if(retVal.size()>GT::LabelSize)
    {
        std::cerr<<"[ERROR] not enough edge label slots to perform merge"<<std::endl;
        std::cerr<<"[INFO] ";
        for(const auto& e : retVal.labels_)
            std::cerr<<e.first<<" ";
        std::cerr<<std::endl;
    }
    return retVal;
}

template<typename GT> 
std::map<typename GT::Index, typename GT::Index> LabelMap<GT>::reIndex(const LabelMap<GT>& rhs) const
{
    std::map<typename GT::Index, typename GT::Index> retVal;

    for(const auto& e : labels_)
        retVal[e.second] = rhs.lookup(e.first);
 
    return retVal;
}


template<class GT>
template<class K>
auto LabelMap<GT>::lookup(const K& key)const
{
    if constexpr (std::is_same<K, std::string>::value)
    {
        const auto& pos = labels_.find(key);
        if(pos == labels_.end())
        {
            std::cerr<<"[WARN] label key <"<<key<<"> not found"<<std::endl;
            return -1;
        }
        else
            return(pos->second);
            
    }
    else  if constexpr (std::is_same<K, int>::value)
    {    
        const auto& label = poss_.find(key);
        if(label == poss_.end())
        {
            std::cerr<<"[WARN] label pos <"<<key<<"> not found"<<std::endl;
            return std::string();
        }
        else
            return(std::vector<std::string>(label->second));
            
    }   

}

template<class GT>
void LabelMap<GT>::read_serial(std::istream& is)
{
    int slotsUsed;
    is>>slotsUsed;
    
    //read labelNames 
    for(size_t i=0; i < slotsUsed; ++i)
    {
        std::string name;
        is>>name;
        addLabel(name);
    }
}

template<class GT>
void LabelMap<GT>::write_serial(std::ostream& os)const
{
    os<<size()<<"\n";
    
    auto ordered = getLabels();
    
    //write labelNames 
    for(const auto& e : ordered)
        os<<e<<"\n";
}
