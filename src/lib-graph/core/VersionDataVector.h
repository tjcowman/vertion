#pragma once

//begn and end IA are inclusive ranges for the IA segments in v[j]
template<class T>
struct VersionData
{
    typename T::VersionIndex parentVersion_;
    typename T::VersionIndex keyFrameVersion_;
    
    typename T::Index edges_;
    typename T::Index nodes_;
    
    typename T::Index beginAppendIndex_;

    //Used to construct the first version in a graph
    VersionData(typename T::Index edges, typename T::Index nodes)
    {
        parentVersion_ = -1; //Has no parent, is original version
        keyFrameVersion_ = 0; //Is its own keyframe
        edges_ = edges;
        nodes_ = nodes;
    }
    
    VersionData(typename T::Index parentVersion, typename T::Index keyFrameVersion,  typename T::Index edges, typename T::Index nodes, typename T::Index beginAppendIndex)//, VERTEX_INDEX_TYPE maxNodeIndexUsed)
    {
        parentVersion_ = parentVersion;
        keyFrameVersion_ = keyFrameVersion;
        edges_ = edges;
        nodes_ = nodes;
        beginAppendIndex_ = beginAppendIndex;
    }
    
    VersionData()
    {
        parentVersion_ = -1;
        keyFrameVersion_ = -1;
        edges_ = -1;
        nodes_ = -1;
    }
    
    static VersionData createSentry()
    {
        return VersionData(
            -2, //Is sentry, before even the first versionData
            -2,
            0,
            0,
            0
        );
    }
    
};
//using VersionData = VersionDataType<GraphIndex>;


template<class T>
class VersionDataVector
{
    public:
        VersionDataVector();
        VersionDataVector(typename T::Index Nodes);
        
        size_t size()const;
        
        void pop();
        
        //+1 because of sentry
        typename std::vector<VersionData<T>>::const_iterator begin()const{
            return versionsData_.begin()+1;
        }
        typename std::vector<VersionData<T>>::const_iterator end()const{
            return versionsData_.end();
        }
        const VersionData<T>& back()const{
            return versionsData_.back();
        }
        
        VersionData<T>& operator[](int version);
        const VersionData<T>& operator[](int version)const ;
        
        void push_back(const VersionData<T>& versionData);
        
        
        /*
         * Get a list of each version index's children
         */
        std::vector<std::vector<typename T::VersionIndex> > computeVersionChildren()const;
        
        //TODO: refactor to explicitly label as the methods for inputing and outputting binary data
        friend std::istream& operator>> (std::istream& is,  VersionDataVector& v )
        {
            typename T::Index tempLength;
            is.read(reinterpret_cast<char*>(&tempLength), sizeof(typename T::Index));            
            v.versionsData_.resize(tempLength);
            is.read(reinterpret_cast<char*>(&v.versionsData_[0]), tempLength*sizeof(VersionData<T>));

            return is;
        }
        
        friend std::ostream& operator<< (std::ostream& os, const VersionDataVector& v)
        {
            typename T::Index VDlength = v.versionsData_.size(); 
            os.write(reinterpret_cast<const char*>(&VDlength), sizeof(typename T::Index));
            os.write(reinterpret_cast<const char*>(&v.versionsData_[0]), VDlength*sizeof(VersionData<T>));
            return os;
        }
        
    private:
         std::vector<VersionData<T>> versionsData_;
};

template<class T>
size_t VersionDataVector<T>::size()const
{
    return versionsData_.size()-1;
}

template<class T>
void VersionDataVector<T>::pop()
{
    versionsData_.pop_back();
}

template<class T>
VersionDataVector<T>::VersionDataVector()
{
    versionsData_ = std::vector<VersionData<T>>{VersionData<T>::createSentry()};
}

template<class T>
VersionDataVector<T>::VersionDataVector(typename T::Index nodes)
{
    versionsData_ = std::vector<VersionData<T>>{VersionData<T>::createSentry()};
    versionsData_.push_back(VersionData<T>(0,nodes));
}

template<class T>
VersionData<T>& VersionDataVector<T>::operator [](int version)
{
    return versionsData_[version+1];
}

template<class T>
const VersionData<T>& VersionDataVector<T>::operator [](int version)const
{
    return versionsData_[version+1];
}

template<class T>
void VersionDataVector<T>::push_back(const VersionData<T>& versionData)
{
    versionsData_.push_back(versionData);
}

template<class T>
std::vector<std::vector<typename T::VersionIndex> > VersionDataVector<T>::computeVersionChildren()const
{
    std::vector<std::vector<typename T::VersionIndex>> retVal(size(),std::vector<typename T::VersionIndex>());
    //NOTE: uses *this and size() to handle the sentry node correctly

    for(typename T::VersionIndex i=1; i<(typename T::VersionIndex)size(); ++i)//0 has parent -1 which noes not exist so start at i=1
    {
//          std::cout<<(*this)[i].parentVersion_<<std::endl;
        retVal[(*this)[i].parentVersion_].push_back(i);
       // retVal[i].push_back((*this)[i].parentVersion_);
    }
        return retVal;
}
