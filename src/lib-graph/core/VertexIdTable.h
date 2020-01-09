#pragma once

#include <map>


template <class GT>
class VertexIdTable
{
    using Index = typename GT::Index;
    
    public:
         
        void insert(std::string key, Index i);
        
        void addMapping(std::istream& stream );

        auto find(std::string id)const; 
        bool contains(std::string id)const;
        
        auto end()const;
        
    private:
        std::map<std::string , Index> map_;
};

template <class GT>
void VertexIdTable<GT>::insert(std::string key, Index i)
{
    map_.insert({key,i});
}

template <class GT>
void VertexIdTable<GT>::addMapping(std::istream& stream)
{
    while(true)
    {
        std::string s1;
        std::string s2;
        stream >> s1 >> s2;
        
        if(stream.eof())
            break;
    }
}

template <class GT>
auto VertexIdTable<GT>::find(std::string id)const
{
  
    return map_.find(id);
}

template <class GT>
bool VertexIdTable<GT>::contains(std::string id)const
{
    return map_.count(id) == 1;
}

template <class GT>
auto VertexIdTable<GT>::end()const
{
    return map_.end();
}
