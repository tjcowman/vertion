#pragma once

#include "AugIA.h"

#include <unordered_map>
#include <iostream> 
#include <pthread.h>

template<class T>
class VectorIA
{
    public:
       // typedef T::Index Index;
        

        
        VectorIA();
        VectorIA(const VectorIA& cpy);
        VectorIA(typename T::Index nodes);
        
        void clear();
        
        size_t size()const;
        
        VectorIA<T>& operator=(const VectorIA<T>& cpy);
        
        //Getters
        const std::vector<AugIA<T>> & getIA()const;
        const std::vector<AugIA<T>> & getIA(typename T::VersionIndex version)const; //NOTE: Cache implemented API, always use this
        typename T::Index getNextIndex()const;
        typename T::Index getEdgeVersionBegin(typename T::VersionIndex version)const;
        
        //Insertion
        void push_back(const AugIA<T>& e);
        void insertIA(const std::vector<AugIA<T>>& IA);
        bool insertCompressIA(const std::vector<AugIA<T>>& IA, typename T::VersionIndex fromVersion);
        
        std::vector<AugIA<T>> decompressIA(typename T::VersionIndex version)const;
        
        void pop();
        
        
        //Read/Write
        void read_serial(std::istream & stream);
        void write_serial(std::ostream & stream)const;
        
    private:
         
        
        static std::vector< typename T::Index > findAlignments(
            typename std::vector<AugIA<T>>::const_iterator begin1, typename std::vector<AugIA<T>>::const_iterator end1, 
            typename std::vector<AugIA<T>>::const_iterator begin2, typename std::vector<AugIA<T>>::const_iterator end2);
        
        std::vector<std::pair<typename T::Index, typename T::Index>> versionBounds_; //TODO: IS this index inclusive? I think it shouldnt be
        std::vector<AugIA<T>> IA_; /**< The index bounds in A_ and JA_ for outgoing edges in IA_[index].*/
        
         typename std::unordered_map<typename T::VersionIndex, std::vector<AugIA<T>> >::const_iterator cacheInsert(typename T::VersionIndex version)const;
        //These are mutable to allow caching from const access reads 
        mutable pthread_mutex_t lock;
        mutable std::unordered_map<typename T::VersionIndex, std::vector<AugIA<T>> > cacheIA_;
        mutable std::vector<typename T::VersionIndex> cacheReplacementOrder;
        mutable typename T::VersionIndex nextInsert;
};



template<class T>
VectorIA<T>::VectorIA()
{
    IA_ = std::vector<AugIA<T>>();
    cacheIA_ = std::unordered_map<typename T::VersionIndex, std::vector<AugIA<T>> >();
    cacheReplacementOrder = std::vector<typename T::VersionIndex>(INITIAL_CACHE_SIZE, -1);
    versionBounds_ = std::vector<std::pair<typename T::Index,typename T::Index>>();
    nextInsert=0; //nodes;
}

template<class T>
VectorIA<T>::VectorIA(const VectorIA& cpy)
{
    IA_ = cpy.IA_;
    versionBounds_ = cpy.versionBounds_;
    
    cacheIA_ = std::unordered_map<typename T::VersionIndex, std::vector<AugIA<T>> >();
    cacheReplacementOrder = std::vector<typename T::VersionIndex>(INITIAL_CACHE_SIZE, -1);
    nextInsert=0; //nodes;
}

template<class T>
VectorIA<T>::VectorIA(typename T::Index nodes)
{
    IA_ = std::vector<AugIA<T>>(nodes,AugIA<T>());

    cacheIA_ = std::unordered_map<typename T::VersionIndex, std::vector<AugIA<T>> >();
    cacheReplacementOrder = std::vector<typename T::VersionIndex>(INITIAL_CACHE_SIZE, -1);
    versionBounds_ = std::vector<std::pair<typename T::Index,typename T::Index>>{std::make_pair(0, nodes)};
    
    nextInsert=0; //nodes;
}

// template<class T>
// void VectorIA<T>::clear()
// {
//     IA_.clear();
//     cacheIA_.clear();
//     cacheReplacementOrder = std::vector<typename T::VersionIndex>(INITIAL_CACHE_SIZE, -1);
//     versionBounds_.clear();
//     nextInsert=0;
// }

template<class T>
size_t VectorIA<T>::size()const
{
    return IA_.size();
}

template<class T>
VectorIA<T>& VectorIA<T>::operator=(const VectorIA<T>& cpy)
{
    IA_ = cpy.IA_;
    versionBounds_ = cpy.versionBounds_;
    
    cacheIA_ = cpy.cacheIA_;
    cacheReplacementOrder = cpy.cacheReplacementOrder;
    nextInsert= cpy.nextInsert; //nodes;
    return *this;
}

template<class T>
const std::vector<AugIA<T>> & VectorIA<T>::getIA()const
{
    return IA_;
}

template<class T>
const std::vector<AugIA<T>> & VectorIA<T>::getIA(typename T::VersionIndex version)const
{
  //  std::cout<<"GET IA "<<version<<std::endl;
    pthread_mutex_lock(&lock);
    auto it = cacheIA_.find(version);
    if(it != cacheIA_.end())
    {
        pthread_mutex_unlock(&lock);
         return it->second;
    }
    else
    {
        cacheInsert(version);
        it = cacheIA_.find(version);
        
        pthread_mutex_unlock(&lock);
        return it->second;
    }
    
    //return cacheInsert(version);
}

template<class T>
typename T::Index VectorIA<T>::getNextIndex()const
{
    return versionBounds_.back().second;
}

template<class T> //TODO: STORE A, JA, etc bounds loation somewhere to improve (not need to iterate) //BUG: THIS DOES NOT WORK
typename T::Index VectorIA<T>::getEdgeVersionBegin(typename T::VersionIndex version)const 
{
    typename T::Index index = std::numeric_limits<typename T::Index>::max();
    
    //iterate over the compressed IA, look for indexes referenced by uncompressed elements
    for(auto it=IA_.cbegin()+versionBounds_[version].first; it!=IA_.cbegin() + versionBounds_[version].second; ++it)
        if(!it->isCompressed())
        {
            std::cout<<index<<std::endl;
            index = std::min(index, it->s1() );
            if(it->isSplitRow())
                index = std::min(index, it->s3() );
            
        }
    //return versionBounds_[version];
    return index;
    
}

template<class T>
void VectorIA<T>::push_back(const AugIA<T>& e)
{
    IA_.push_back(e);
}

template<class T>
void VectorIA<T>::insertIA(const std::vector<AugIA<T>>& IA)
{
    IA_.insert(IA_.end(), IA.begin(), IA.end());
    versionBounds_.push_back(std::make_pair(versionBounds_.back().second, IA_.size()));
}

template<class T>
bool VectorIA<T>::insertCompressIA(const std::vector<AugIA<T>>& IA, typename T::VersionIndex fromVersion)
{
    typename T::Index i1 = versionBounds_[fromVersion].first;
    typename T::Index i2 = versionBounds_[fromVersion].second;

    std::vector<typename T::Index> alignments =  findAlignments(IA_.begin()+i1, IA_.begin()+i2, IA.begin(), IA.end());
    
    typename T::Index baseOffset = i1;

    typename T::Index preCompressSize = IA.size();
    typename T::Index postCompressSize = alignments.size();

    double compressionRatio = postCompressSize/(double)preCompressSize;
   // std::cout<<"compression: "<< postCompressSize<<" "<<preCompressSize<<" "<< compressionRatio<<std::endl;
    
    if(compressionRatio <.75)
    {
        typename T::Index current = 0;
        for(const auto& e : alignments)
        {
            if(current > IA.size())
                break;

            if(e > 1)
            {    
                IA_.push_back(AugIA<T>(baseOffset+current, e, COMPRESSED));
                current += e;
            }
            else //Wasn't part of an aligned section
            {
                IA_.push_back(IA[current]);
                ++current;
            }
           

        }
        
         versionBounds_.push_back(std::make_pair(versionBounds_.back().second, IA_.size()));
         return true;
    }
    else //if not compressed enough, don't actually compress, return  that it didn't compress and should be made into a keyframe
    {
        insertIA(IA);
        return false;
    }
}

template<class T>
std::vector<AugIA<T>> VectorIA<T>::decompressIA(typename T::VersionIndex version)const
{
    std::vector<AugIA<T>> retVal;
    
    for(typename T::VersionIndex i=versionBounds_[version].first; i<versionBounds_[version].second; ++i)
    {
        if(!IA_[i].isCompressed())
        {
            retVal.push_back(IA_[i]);
        }
        else
        {
            for(typename T::Index j=IA_[i].s1(); j<IA_[i].s1()+IA_[i].s2(); ++j)
            {
                retVal.push_back(IA_[j]);
            }
        }
    }

    return retVal;
}

template<class T>
void VectorIA<T>::pop()
{
    versionBounds_.pop_back();
    IA_.pop_back();
}

template<class T>
typename std::unordered_map<typename T::VersionIndex, std::vector<AugIA<T>> >::const_iterator VectorIA<T>::cacheInsert(typename T::VersionIndex version)const
{
    //Check if already in cache
    auto it = cacheIA_.find(version);

    if (it == cacheIA_.end())
    {
        //If not, remove oldest cached, add to cache and move marker for next insert
//         #pragma omp critical
        {
            if(cacheIA_.size()>INITIAL_CACHE_SIZE)
                cacheIA_.erase(cacheReplacementOrder[nextInsert]);
            
            it = cacheIA_.insert(std::make_pair(version,  decompressIA(version))).first;

            cacheReplacementOrder[nextInsert] = version;

            nextInsert = (nextInsert + 1) % INITIAL_CACHE_SIZE;
        }
    }
    return it;
}

template<class T>
void VectorIA<T>::read_serial(std::istream & stream)
{
    //read versionbounds
    typename T::Index tempLength;
    
    stream.read(reinterpret_cast<char*>(&tempLength), sizeof(typename T::Index));

    versionBounds_.resize(tempLength);
    stream.read(reinterpret_cast<char*>(&versionBounds_[0]), tempLength*sizeof(std::pair<typename T::Index, typename T::Index>));

    stream.read(reinterpret_cast<char*>(&tempLength), sizeof(typename T::Index));
    IA_.resize(tempLength);
    stream.read(reinterpret_cast<char*>(&IA_[0]), tempLength*sizeof(AugIA<T>));
}

template<class T>
void VectorIA<T>::write_serial(std::ostream & stream)const
{
    //write versionbounds
    typename T::Index VBlength = versionBounds_.size();
    stream.write(reinterpret_cast<const char*>(&VBlength), sizeof(typename T::Index));
    stream.write(reinterpret_cast<const char*>(&versionBounds_[0]), VBlength*sizeof(std::pair<typename T::Index, typename T::Index>));
    
    typename T::Index IAlength = IA_.size();
    stream.write(reinterpret_cast<const char*>(&IAlength), sizeof(typename T::Index));
    
    stream.write(reinterpret_cast<const char*>(&IA_[0]), IAlength*sizeof(AugIA<T>)); //PROBLEM
}

template<class T>  
std::vector<typename T::Index> VectorIA<T>::findAlignments(typename std::vector<AugIA<T>>::const_iterator begin1, typename std::vector<AugIA<T>>::const_iterator end1, typename std::vector<AugIA<T>>::const_iterator begin2, typename std::vector<AugIA<T>>::const_iterator end2)
{
    std::vector<typename T::Index> retVal;

    std::vector<int> areEqual;
    std::transform(begin1, end1, begin2,  std::back_inserter(areEqual), [](const auto& e1, const auto& e2){return (e1 == e2);});
    
    typename T::Index equalCount=0;
    for(const auto& e : areEqual)
    {
        if(e == 1)
            equalCount++;
        else //was not equal
        {
            if(equalCount>0)
                retVal.push_back(typename T::Index{equalCount}); //push the numequal if exists
            
            retVal.push_back(typename T::Index{0}); //push this unequal
            
            equalCount = 0;
        }
    }
    if(equalCount>0)
        retVal.push_back(typename T::Index{equalCount}); //push the remaining equal if exist
    
    return retVal;
}
