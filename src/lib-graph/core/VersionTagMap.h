#pragma once

#include <map>

using Tag = std::string;


//WARNING: DO NOT USE SPACES IN TAGS, TODO: EITHER CHECK FOR SPACES OR REFACTOR TO ALLOW
//TODO: Allow getversion/tag etc to take funtion based intersection or union for consistancy



template<class T>
struct MatchSet 
{
    typename T::VersionIndex index_;
    std::vector<Tag> tags_;
    
    MatchSet(typename T::VersionIndex index, std::vector<Tag> tags)
    {
        index_ = index;
        tags_ = tags;
    }
};

enum class Lookup
{
    set_intersection,
    set_union
};



template<class T>
class VersionTagMap
{
    public:
        
        //overloads to be used with the lookup functions
        
        static constexpr auto version_intersection = std::set_intersection<typename  std::vector<typename T::VersionIndex>::iterator, typename  std::vector<typename T::VersionIndex>::iterator,  std::back_insert_iterator<std::vector<typename T::VersionIndex> > >;
        static constexpr auto version_union = std::set_union<typename  std::vector<typename T::VersionIndex>::iterator, typename  std::vector<typename T::VersionIndex>::iterator,  std::back_insert_iterator<std::vector<typename T::VersionIndex> > >;
        static constexpr auto tag_intersection = std::set_intersection<typename  std::vector<Tag>::iterator, typename  std::vector<Tag>::iterator,  std::back_insert_iterator<std::vector<Tag> > >;
        static constexpr auto tag_union = std::set_union<typename  std::vector<Tag>::iterator, typename  std::vector<Tag>::iterator,  std::back_insert_iterator<std::vector<Tag> > >;
        
        
        void addTag(typename T::VersionIndex version, Tag tag);
        void addTags(typename T::VersionIndex version, std::vector<Tag> tags);
        
        void setName(typename T::VersionIndex version, const std::string& name);
        const std::string& getName(typename T::VersionIndex version)const;
        
        //Removes the tagging data related to a version
        void eraseVersion(typename T::VersionIndex version);
        
        //NOTE Return values should be sorted as they come from a set
        template<class K>
        auto lookup(const K& key)const;
        
        template <Lookup F, class K>
        auto lookupF(const std::vector<K>& keys)const ;
        
        typename T::VersionIndex versionLookupInteractive( std::vector<Tag> tags )const;
        
        void printTagsByVersion()const;
        
        template<class Tp>
        friend std::ostream& operator<< (std::ostream & out, const VersionTagMap<Tp>& m);
        template<class Tp>
        friend std::istream& operator>> (std::istream & in,  VersionTagMap<Tp>& m);
        
    private:
        
        
        std::map<typename T::VersionIndex, std::string> displayNames_; //Stores a plaintext name for each version
        
        std::map<Tag, std::set<typename T::VersionIndex>> tagVersionMap_;
    
        std::map<typename T::VersionIndex, std::set<Tag>> versionTagMap_;
};



template<class T>
void VersionTagMap<T>::addTag(typename T::VersionIndex version, Tag tag)
{
    tagVersionMap_[tag].insert(version);
    versionTagMap_[version].insert(tag);
}

template<class T>
void VersionTagMap<T>::addTags(typename T::VersionIndex version, std::vector<Tag> tags)
{
    for (const auto& e : tags)
        addTag(version, e);
}

template<class T>
void VersionTagMap<T>::setName(typename T::VersionIndex version, const std::string& name)
{
    displayNames_[version] = name; 
}

template<class T>
const std::string& VersionTagMap<T>::getName(typename T::VersionIndex version)const
{
    static const std::string empty ="";
    auto res =  displayNames_.find(version);
    if(res==displayNames_.end())
        return empty;
    else
        return res->second;
}

template<class T>
void VersionTagMap<T>::eraseVersion(typename T::VersionIndex version)
{
    versionTagMap_.erase(version);
    for(auto& el : tagVersionMap_)
    {
        //for(auto& e : el.second)
            el.second.erase(version);
    }
}

template<class T>
template<class K>
auto VersionTagMap<T>::lookup(const K& key)const
{
    if constexpr (std::is_same<K, Tag>::value)
    {
        const auto& versions = tagVersionMap_.find(key);
        if(versions == tagVersionMap_.end())
        {
            std::cerr<<"[WARN] version key <"<<key<<"> not found"<<std::endl;
            return std::vector<typename T::VersionIndex>();
        }
        else
            return(std::vector<typename T::VersionIndex>(versions->second.begin(), versions->second.end()));
    }
    else  if constexpr (std::is_same<K, typename T::VersionIndex>::value)
    {    
        const auto& tags = versionTagMap_.find(key);
        if(tags == versionTagMap_.end())
        {
            return std::vector<Tag>();
        }
        else
            return(std::vector<Tag>(tags->second.begin(), tags->second.end()));
    }   

}

template<class T>
template <Lookup F, class K>
auto  VersionTagMap<T>::lookupF(const std::vector<K>& keys)const 
{
    if constexpr (std::is_same<K, Tag>::value)
    {
        if(keys.size() == 0)
        {
            std::cerr<<"keys empty"<<std::endl;
            return std::vector<typename T::VersionIndex>();
        }
        std::vector<typename T::VersionIndex> retVal = lookup(keys[0]);
        
        for(typename T::VersionIndex i=1; i<keys.size(); ++i)
        {
            std::vector<typename T::VersionIndex> tmpSet;
            std::vector<typename T::VersionIndex> nextSet = lookup(keys[i]);
            if constexpr(F == Lookup::set_intersection)
                std::set_intersection(retVal.begin(), retVal.end(), nextSet.begin(), nextSet.end(), std::back_inserter(tmpSet));
            else if constexpr(F == Lookup::set_union)
                std::set_union(retVal.begin(), retVal.end(), nextSet.begin(), nextSet.end(), std::back_inserter(tmpSet));
            retVal = tmpSet;
        }
        return retVal;
    }
    else  if constexpr (std::is_same<K, typename T::VersionIndex>::value)
    {    
        if(keys.size() == 0)
        {
            std::cerr<<"keys empty"<<std::endl;
            return std::vector<Tag>();
        }
        
        std::vector<Tag> retVal = lookup(keys[0]);
        
        for(size_t i=1; i<keys.size(); ++i)
        {
            std::vector<Tag> tmpSet;
            std::vector<Tag> nextSet = lookup(keys[i]);
            
            if constexpr(F == Lookup::set_intersection)
                std::set_intersection(retVal.begin(), retVal.end(), nextSet.begin(), nextSet.end(), std::back_inserter(tmpSet));
            else if constexpr(F == Lookup::set_union)
                std::set_union(retVal.begin(), retVal.end(), nextSet.begin(), nextSet.end(), std::back_inserter(tmpSet));
            
            retVal = tmpSet;
        }
        return retVal;
        
    }   
}

template<class T>
typename T::VersionIndex VersionTagMap<T>::versionLookupInteractive(std::vector<Tag> tags)const
{
    std::vector<typename T::VersionIndex> matchingVersions = lookupF<Lookup::set_intersection>(tags);
   // lookup(tags, VersionTagMap::version_intersection);
   //  std::vector<typename T::VersionIndex> matchingVersions = tagsLookup(tags, std::set_intersection);
    
    if(matchingVersions.size() == 0)
    {
       matchingVersions = std::vector<typename T::VersionIndex>(versionTagMap_.size());
       std::iota(matchingVersions.begin(), matchingVersions.end(), 0);
    }
    
    //Sort by number of tags, list valid, then prompt for choice if > 1
    if(matchingVersions.size() > 1 )
    {
        std::vector<MatchSet<T>> matchSets;
        for(const auto& e : matchingVersions)
             matchSets.push_back(MatchSet<T>(e, lookupF<Lookup::set_union>( std::vector<typename T::VersionIndex>{e})));
        
        std::sort(matchSets.begin(), matchSets.end(), [](const auto& lhs, const auto& rhs){return lhs.tags_.size() < rhs.tags_.size();});
        
        for(size_t i=0; i< matchSets.size(); ++i)
        {
            std::cout<<"["<<i<<"] ";
            for(const auto& t : matchSets[i].tags_)
                std::cout<<t<<" ";
            std::cout<<"\n";
        }
        std::cout<<"tags not unique, choose input\n>>";
        
        
        //prompt for choice to continue
        size_t choice =0;
        std::cin>>choice;
        if(choice< matchSets.size())
            return matchSets[choice].index_;
        else
            return 1;
        
    }
    else
        return matchingVersions[0];
       

}

template<class T>
void VersionTagMap<T>::printTagsByVersion()const
{
    for(const auto& e : versionTagMap_)
    {
        std::cout<<e.first<<" : ";
        for(const auto& ee : e.second)
            std::cout<<ee<<" ";
        std::cout<<"\n";
    }
}

template<class Tp>
std::ostream& operator<< (std::ostream & out, const VersionTagMap<Tp>& m)
{
    out<<m.tagVersionMap_.size()<<std::endl;
    
    for(const auto& e : m.tagVersionMap_)
    {
        out<<e.first<<" "<<e.second.size()<<std::endl;
        for(const auto& ee : e.second)
            out<<ee<<" ";
        out<<"\n";
    }
        
    //write the name map
    out<<m.displayNames_.size()<<"\n";
    for(size_t i=0; i<m.displayNames_.size(); ++i)
    {
        out<<i<<"\t"<<m.displayNames_.at(i)<<"\n";
    }
        
    
    return out;
}

template<class Tp>
std::istream& operator>> (std::istream & in,  VersionTagMap<Tp>& m)
{
    size_t numberOfTags;
    in>>numberOfTags;
    
    for(size_t i=0; i<numberOfTags; ++i)
    {
        Tag tagName;
        size_t versionsWithTag;
        in>>tagName>>versionsWithTag;
        for(size_t j=0; j<versionsWithTag; ++j)
        {
            typename Tp::VersionIndex version;
            in>>version;
            m.addTag(version,tagName);
        }
    }
    
    //read the name map
    size_t numNames;
    in>>numNames;
    for(size_t i=0; i<numNames; ++i)
    {
        std::string name;
        typename Tp::VersionIndex version;
        in>>version>>name;
        m.displayNames_.insert(std::make_pair(version,name));
    }
    return in;
}
