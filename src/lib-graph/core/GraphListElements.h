#pragma once

#include <tuple>

//TODO make an unvalued vertexlist, for representing just node indexes
//TODO split into weighted, labeled... etc variants
template<class GT>
struct EdgeElement
{
    using graph_type = GT;
    using label_type = EdgeLabel<GT>;
    
   // static sortIndex = [](){;}
    
    typedef typename GT::Index Index;
    
    typename GT::Index index1_;
    typename GT::Index index2_;
    typename GT::Value value_;
    EdgeLabel<GT> labels_;
    
    EdgeElement()
    {
        index1_ = -1;
        index2_ = -1;
        value_ = 0;
        labels_ = EdgeLabel<GT>();
    }
    
    EdgeElement(typename GT::Index index1, typename GT::Index index2, typename GT::Value value,  EdgeLabel<GT> labels)
    {
        index1_ = index1;
        index2_= index2;
        value_ = value;
        labels_ = labels;
    }
    
    EdgeElement(typename GT::Index index1, typename GT::Index index2)
    {
        index1_ = index1;
        index2_= index2;
        value_ = 0;
        labels_ = EdgeLabel<GT>();
    }
    
    EdgeElement(typename GT::Index index1, typename GT::Index index2, typename GT::Value value)
    {
        index1_ = index1;
        index2_= index2;
        value_ = value;
        labels_ = EdgeLabel<GT>();
    }
    
    bool operator<(const EdgeElement & rhs)const
    {
         return std::tie(index1_, index2_) < std::tie(rhs.index1_, rhs.index2_);
    }
    
    static bool equalIndex(const EdgeElement& rhs, const EdgeElement& lhs)
    {
        return std::tie(lhs.index1_, lhs.index2_) == std::tie(rhs.index1_, rhs.index2_);
    }
    
    bool operator ==(const EdgeElement & rhs)const 
    {
        return (index1_==rhs.index1_ && index2_==rhs.index2_ && value_==rhs.value_ && labels_ == rhs.labels_);
    }
     
    void sort()
    {
        if(index1_ > index2_)
            std::swap(index1_, index2_);
    }
     
    friend std::ostream& operator<<(std::ostream & out, const EdgeElement & edge)
    {
        out<<edge.index1_<<" "<<edge.index2_<<" "<<edge.value_<<" "<<edge.labels_;
        return out;
    }
    
};


template<class T, class GT> struct VertexElement
{
    using graph_type = GT;
    using label_type = VertexLabel<GT>;
    using Index = typename GT::Index;
    using Value = T;
    
    
    Index index_;
    Value value_;
    VertexLabel<GT> labels_;

    //Allow, casting unweighted VertexElements to the others
    VertexElement( const  VertexElement<bool, GT>& u)
    {
        index_ = u.index_;
        labels_ = u.labels_;
        value_ = static_cast<T>(u.value_);
    }
    
    //Allow casting  to high precision value type
    template<class T2>
    VertexElement<typename GT::Calc, GT>( const  VertexElement<T2, GT>& u)
    {
        index_ = u.index_;
        labels_ = u.labels_;
        value_ = static_cast<typename GT::Calc>(u.value_);
    }
    
    VertexElement( Index index=-1, Value value=0, VertexLabel<GT> labels=VertexLabel<GT>()): index_(index), value_(value), labels_(labels)
    {}


    
    bool operator<(const VertexElement& rhs)const
    {
        return index_ < rhs.index_;
    }
    
    static bool equalIndex(const VertexElement& rhs, const VertexElement& lhs)
    {
        return lhs.index_ == rhs.index_;
    }
    
    friend std::ostream & operator<<(std::ostream & out, const VertexElement & e)
    {
        out<<e.index_<<"\t"<<e.value_;
        return out;
    }
};

template<class GT>
using VertexS = VertexElement<typename GT::Value, GT>;
template<class GT>
using VertexI = VertexElement<typename GT::Index, GT>;
template<class GT>
using VertexHP = VertexElement<typename GT::Calc, GT>;

template<class GT>
using VertexU = VertexElement<bool, GT>;


/*
template<class T, class GT>
VertexElement<T, GT>::VertexElement( const  VertexElement<bool, GT>& u)
{
    index_ = u.index_;
    labels_ = u.labels_;
}*/
