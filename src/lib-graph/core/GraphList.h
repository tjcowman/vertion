#pragma once

#include <random>
#include <set>
#include <tuple>
#include <algorithm>
 
 
/** @struct Context
*  Used to specify during construction, the type of EdgeList or Graph to generate
*/
enum class Context : char
{
    directed,
    undirected,
    none //Probably temporary, for when GraphIO loading should set, or another function
};

 
//TODO: These namespace lambdas are terribly organized and inconsitent
//TODO: Reformat the element type names to use underscores for the "specializations"
//TODO: Implement the header functionality

//NOTE: All default ordering should be based on indexes

namespace EdgeReduce
{
    static const auto sum_p = [](auto e1,  auto e2){return e1 + e2.value_;};
    static const auto mean = [](auto it1, auto it2){return std::accumulate(it1, it2, 0.0, sum_p)/std::distance(it1,it2);};
    static const auto sum = [](auto it1, auto it2){return std::accumulate(it1, it2, 0.0, sum_p);};
}

namespace Reduce
{
     static const auto sub = [](auto e1, auto e2){return e1-e2.value_;};
     static const auto diff = [](auto it1, auto it2){return std::accumulate(it1, it2, 0.0, sub);};
     static const auto sum_p = [](auto e1,  auto e2){return e1 + e2.value_;};
    static const auto mean = [](auto it1, auto it2){return std::accumulate(it1, it2, 0.0, sum_p)/std::distance(it1,it2);};
}

namespace EdgeSort
{
     static const auto indexInc = [](const auto& lhs, const auto& rhs){return std::tie(lhs.index1_, lhs.index2_) < std::tie(rhs.index1_, rhs.index2_);};

}
namespace Sort
{
    static const auto valueInc = [](const auto& lhs, const auto& rhs){return lhs.value_ < rhs.value_;};
    static const auto valueDec = [](const auto& lhs, const auto& rhs){return lhs.value_ > rhs.value_;};
    static const auto indexInc = [](const auto& lhs, const auto& rhs){return lhs.index_ < rhs.index_;};
}

template<class T>
class GraphList
{
    public:
        
        typedef  decltype(T::value_) value_type;
        using graph_type = typename T::graph_type;
        
        
        //Setting up underlying iterators
        using container= std::vector<T>;
        using iterator=typename container::iterator;
        using const_iterator=typename container::const_iterator;
        iterator begin() { return elements_.begin(); }
        iterator end() { return elements_.end(); }
        const_iterator begin() const { return elements_.begin(); }
        const_iterator end() const { return elements_.end(); }
            
        template<class T2>
        GraphList(const GraphList<T2>& c );

        GraphList();
        GraphList(typename  T::Index numElements); //TODO make general
        GraphList(Context c);
        GraphList(T element);
        GraphList(T element, Context c);
        GraphList(const std::vector<T>& elements);
        GraphList(GraphList<T> list, typename T::graph_type::Index begin, typename T::graph_type::Index end);
        
        void operator=(const GraphList<T>& rhs);
        
        //Binary IO
        void readBinary(std::istream& stream);
        void writeBinary( std::ostream& stream);
        

        size_t size()const;
    
        //Access
        const std::vector<T>& getElements()const;
        std::vector<T>& getElements();
        auto getValues()const;
        std::vector<typename T::Index> getIndexes()const;
        const T& operator[](typename T::Index i)const;
        T& operator[](typename T::Index i);
        
        
        Context getContext()const;
        std::string getHeader()const;
        
        //Modifiers
        void setContext(Context context);
        void clear();
        void push_back(T element); 
        void push_back(const GraphList<T>& graphList);
       
        void resize(size_t i);
        
        void setElements(const std::vector<T>& elements);
        
        
        GraphList& setHeader(const std::string & header);

        
        template<typename F>
        GraphList& sort(F f);
        
        template<typename F>
        GraphList& elementApply(F f);
        
        //Generate new lists
        template<typename F>
        GraphList makeUnion(const GraphList<T>& graphList, F f)const; //NOTE: assumes sorted
        template<typename F>
        GraphList makeIntersection(const GraphList<T>& graphList, F f)const; //NOTE: assumes sorted
        GraphList makeDifference(const GraphList<T>& graphList)const; //NOTE: assumes sorted
        GraphList sample(size_t n)const;
        
        void makeUniqueIndex();
        
        GraphList normalize()const;
        
        template<typename F>
        GraphList select(F f)const;
        
        template<typename F>
        std::pair<GraphList, std::vector<typename T::Index> > selectRank(F f)const;
        
        
        template<class Tp>
        friend std::ostream& operator<< (std::ostream & out, const GraphList<Tp>& graphlist);

        
        //Type specific functions
        /*---------------*/
        
        const auto lookupIndex(typename T::Index index)const; //Assumes sorted
        
        //modify the vertexList by applying the provided funtion to equivalent indexes
        template<typename F>
        GraphList<T>& reduce(F f);
        
        template<typename F>
        GraphList<T>& makeValid(F f);
        
        void addExplicitReverseEdges();
        GraphList<T> expand(typename  T::Index indexes)const;
        
        void labelEdges(int labelIndex);
        
                
    private:
        
        std::string header_;
        Context context_;
        std::vector<T> elements_;

};

//TODO: Fill out and move somewhere more organized
//Conversions 
//template<class T>
template<class T, class F>
static GraphList<VertexS<T>> make_VertexList(const std::vector<typename T::Index>& indexes, F f)
{
    GraphList<VertexS<T>> retVal;
    for(const auto& e : indexes)
        retVal.push_back(VertexS<T>(e, f()));
    return retVal;
}

template<class T>
void GraphList<T>::resize(size_t i)
{
    elements_.resize(i);
}

template<class T, class F>
std::set<typename T::Index> make_VertexIndexLookup(GraphList<VertexS<T>> vertexList)
{
    std::set<typename T::Index> retVal;
    
    for(const auto& e : vertexList.getElements())
        retVal.insert(e.index_);
    
    return retVal;
}

//Enables trivial conversions between graphList types
template<class T>
template<class T2>
GraphList<T>::GraphList(const GraphList<T2>& c)
{
    header_ = c.getHeader();
    context_ = c.getContext();
    
    for(const auto& e : c.getElements())
        elements_.push_back(e);
}


/*Implementation*/
template<class T>
GraphList<T>::GraphList()
{
    context_ = Context::undirected;   
}

template<class T>
GraphList<T>::GraphList(typename T::Index numElements)
{
    elements_ = std::vector<T>(numElements);
    for(typename T::Index i=0; i<elements_.size(); ++i)
        elements_[i].index_ = i;
    context_ = Context::undirected;   
}

template<class T>
GraphList<T>::GraphList(Context c)
{
    context_ = c;
}

template<class T>
GraphList<T>::GraphList(T element, Context c)
{
    elements_.push_back(element);
    context_ = c;
}

template<class T>
GraphList<T>::GraphList(T element)
{
    elements_.push_back(element);
    context_ = Context::undirected;
}

template<class T>
GraphList<T>::GraphList(const std::vector<T>& elements)
{
    elements_.insert(elements_.end(),elements.begin(), elements.end());
    context_ = Context::undirected;
}

template<class T>
GraphList<T>::GraphList(GraphList<T> list, typename T::graph_type::Index begin, typename T::graph_type::Index end)
{
//     std::cout<<list.size()<<std::endl;
    context_ = list.getContext();
    elements_.insert( elements_.end(), list.elements_.begin()+begin, list.elements_.begin()+end);
}

template<class T>
void GraphList<T>::operator=(const GraphList<T>& rhs)
{
    header_ = rhs.header_;
    context_ = rhs.context_;
    elements_ = rhs.elements_;
}

template<class T>
void GraphList<T>::writeBinary( std::ostream& stream)
{
    typename T::Index numElements = elements_.size();
    
    stream.write(reinterpret_cast<const char*>(&numElements), sizeof(typename T::IndexGraphIndex));
    stream.write(reinterpret_cast<const char*>(&elements_[0]), numElements*sizeof(T));
}

template<class T>
GraphList<T> GraphList<T>::expand(typename T::Index indexes)const
{
    GraphList<T> vl;
    
    vl.elements_.resize(indexes);
    
    for(typename T::Index i=0; i< vl.elements_.size(); ++i)
        vl.elements_[i].index_ = i;
    
    for(auto v : elements_)
        vl.elements_[v.index_].value_ = v.value_;

    return vl;
}

template<class T>
size_t GraphList<T>::size()const
{
    return elements_.size();
}

template<class T>
const std::vector<T>& GraphList<T>::getElements()const
{
    return elements_;
}

template<class T>
std::vector<T>& GraphList<T>::getElements()
{
    return elements_;
}

template<class T>
auto GraphList<T>::getValues()const
{
    std::vector<value_type> retVal;
    for(const T& e : elements_)
        retVal.push_back(e.value_);
    
    return retVal;
}

template<class T>
std::vector<typename T::Index> GraphList<T>::getIndexes()const
{
    std::vector<typename T::Index> retVal;
    for(const T& e : elements_)
        retVal.push_back(e.index_);
    
    return retVal;
}

template<class T>
const T& GraphList<T>::operator[](typename T::Index i)const
{
    return elements_[i];
}

template<class T>
T& GraphList<T>::operator[](typename T::Index i)
{
    return elements_[i];
}

template<class T>
Context GraphList<T>::getContext()const
{
    return context_;
}

template<class T>
std::string GraphList<T>::getHeader()const
{
    return header_;
}

template<class T>
void GraphList<T>::setContext(Context context)
{
    context_ = context;
}

template<class T>
void GraphList<T>::clear()
{
    header_ = "";
    elements_.clear();
}

template<class T>
void GraphList<T>::push_back(T element)
{
    elements_.push_back(element);
}

template<class T>
void GraphList<T>::push_back(const GraphList<T>& graphList)
{
    elements_.insert(elements_.end(), graphList.elements_.begin(), graphList.elements_.end());
}

template<class T>
void GraphList<T>::setElements(const std::vector<T>& elements)
{
    elements_ = elements;
}

template<class T>
GraphList<T>& GraphList<T>::setHeader(const std::string & header)
{
    header_ = header;
    return *this;
}

template<class T>
template<typename F>
GraphList<T>& GraphList<T>::sort(F f)
{
    std::sort(elements_.begin(), elements_.end(), f);
    return *this;
}

template<class T>
template<typename F>
GraphList<T>& GraphList<T>::elementApply(F f)
{
    for(auto &e : elements_)
        f(e);
    
    return *this;
}

template<class T>
template<typename F>
GraphList<T> GraphList<T>::makeUnion(const GraphList<T>& graphList, F f)const
{
    GraphList<T> retVal;
    
    auto it1 = elements_.begin();
    auto it2 = graphList.elements_.begin();
    
    //Loop while either list has elements remaining
    //NOTE: order is important, logic short circuit prevents dereferencing end iterator
    while( it1 != elements_.end() || it2 != graphList.elements_.end())
    {
        if( (it1 != elements_.end() && it2 != graphList.elements_.end())  && it1->equalIndex(*it2))
        {
            retVal.push_back(*it1); //Push back copy of one, indexes are equal
            retVal.elements_.back().value_ = f(it1->value_, it2->value_) ;//Set value to function applied to both values
            ++it1;
            ++it2;
        }
        else if( (it2 == graphList.elements_.end() || *it1 < *it2 ) && it1!= elements_.end())
        {
            retVal.push_back(*it1);
            ++it1;
        }
        else if( (it1 == elements_.end() || *it2 < *it1  ) && it2!=graphList.elements_.end() )
        {
            retVal.push_back(*it2);
            ++it2;
        }
    
    }

    return retVal;
}

template<class T>
template<typename F>
GraphList<T> GraphList<T>::makeIntersection(const GraphList<T>& graphList, F f)const 
{
    GraphList<T> retVal;
    
    auto it1 = elements_.begin();
    auto it2 = graphList.elements_.begin();
    
    //Loop while either list has elements remaining
    //NOTE: order is important, logic short circuit prevents dereferencing end iterator
    while( it1 != elements_.end() || it2 != graphList.elements_.end())
    {
        if( (it1 != elements_.end() && it2 != graphList.elements_.end())  && it1->equalIndex(*it2))
        {
            retVal.push_back(*it1); //Push back copy of one, indexes are equal
            retVal.elements_.back().value_ = f(it1->value_, it2->value_) ;//Set value to function applied to both values
            ++it1;
            ++it2;
        }
        else if( (it2 == graphList.elements_.end() || *it1 < *it2 ) && it1!= elements_.end())
            ++it1;
        else if( (it1 == elements_.end() || *it2 < *it1  ) && it2!=graphList.elements_.end() )
            ++it2;
    }

    return retVal;
}

template<class T>
GraphList<T> GraphList<T>::makeDifference(const GraphList<T>& graphList)const 
{
    GraphList<T> retVal;
    
    auto it1 = elements_.begin();
    auto it2 = graphList.elements_.begin();
    
    //Loop while either list has elements remaining
    //NOTE: order is important, logic short circuit prevents dereferencing end iterator
    while( it1 != elements_.end() || it2 != graphList.elements_.end())
    {
        if( (it1 != elements_.end() && it2 != graphList.elements_.end())  && it1->equalIndex(*it2))
        {
            ++it1;
            ++it2;
        }
        else if( (it2 == graphList.elements_.end() || *it1 < *it2 ) && it1!= elements_.end())
        {
            retVal.push_back(*it1);
            ++it1;
        }
        else if( (it1 == elements_.end() || *it2 < *it1  ) && it2!=graphList.elements_.end() )
        {
            retVal.push_back(*it2);
            ++it2;
        }
    }

    return retVal;
}

template<class T>
GraphList<T> GraphList<T>::sample(size_t n)const
{
     GraphList<T> retVal(context_);
     
     std::sample(elements_.begin(), elements_.end(), std::back_inserter(retVal.elements_), n,std::mt19937{std::random_device{}()});
     
     return retVal;
}


template<class T>
void GraphList<T>::makeUniqueIndex()
{
    sort(Sort::indexInc);
    elements_.erase(std::unique(elements_.begin(), elements_.end(), [](const auto& e1, const auto& e2){return e1.equalIndex(e2);}), elements_.end());
}

template<class T>
GraphList<T> GraphList<T>::normalize()const
{
    GraphList<T> retVal(*this);
    size_t numElements = retVal.size();
    typename T::Value sum = std::accumulate(elements_.begin(), elements_.end(), 0.0, [](typename T::Value sum, const T curr){return sum + curr.value_;} );
    
    if (sum == 0) 
        std::for_each(retVal.elements_.begin(), retVal.elements_.end(), [numElements](auto& e){e.value_ = 1.0/numElements;}) ;
    else
        std::for_each(retVal.elements_.begin(), retVal.elements_.end(), [sum](auto& e){e.value_ = e.value_ / sum;}) ;

    return retVal;
}

template<class T>
template<typename F>
GraphList<T> GraphList<T>::select(F f)const
{
    GraphList<T> retVal;
    retVal.header_ = header_;
    for(const auto & e : elements_)
        if(f(e))
            retVal.push_back(e);
    return retVal;
}

template<class T>
template<typename F>
std::pair<GraphList<T>, std::vector<typename T::Index> >  GraphList<T>::selectRank(F f)const
{
    std::vector<typename T::Index> ranks;
    GraphList<T> elements;
    
    typename T::Index i=0;
    for(const auto & e : elements_)
    {
        if(f(e))
        {
            ranks.push_back(i);
            elements.push_back(e);
        }
        ++i;
    }   
    return std::make_pair(elements,ranks);
}

template<class Tp>
std::ostream& operator<< (std::ostream & out, const GraphList<Tp>& graphlist)
{
    out<<"Header: "<<graphlist.header_<<std::endl<<
    "-----------"<<std::endl;
    for(const Tp& e : graphlist.elements_)
    {
        out<<e<<std::endl;
    }
    out<<"-----------";
    
    return out;
}


/*---------------------------*/
template<class T>
template<typename F>
GraphList<T>& GraphList<T>::makeValid(F f)
{
    switch(context_)
    {
        case Context::undirected : //NOTE: THE CASE FALL THROUGH IS INTENTIONAL HERE
        {
            //Make all edges go from low index to high index (reverse edges refer to same real edge)
            elementApply([](auto & e){if(e.index1_ > e.index2_)std::swap(e.index1_,e.index2_);});
        }
        case Context::directed :
        {
            //remove self edges
            elements_.erase(std::remove_if(elements_.begin(), elements_.end(), [](const auto& e){return e.index1_ == e.index2_;}), elements_.end());
            
            //Put identical edges together (default is to sort on vertex indexes)
            sort(EdgeSort::indexInc);
            
           // std::cout<<*this<<std::endl;
            
            //Look for the first group
            auto groupIt = elements_.begin(); 
            //equal range uses < operator, elements do not take weight into account for default
            while(groupIt != elements_.end())
            {
                auto rangePair = std::equal_range(groupIt, elements_.end(), *groupIt); //Need to only consider node indexes

                auto aggValue =  rangePair.first;
                //Apply the passed function to each range
                aggValue->value_ = f(rangePair.first, rangePair.second);
                
                aggValue->labels_ = std::accumulate(rangePair.first, rangePair.second, EdgeLabel<typename T::graph_type>(), [](const auto& e1, const auto& e2){return e1.makeUnion(e2.labels_);});

                groupIt = rangePair.second;
            }
            //Make each edge unique by removing all but the first instance (which now has the aggregated value)
            auto newEnd = std::unique(elements_.begin(), elements_.end(), [](auto e1, auto e2){return e1.index1_ == e2.index1_ && e1.index2_ == e2.index2_;});
            elements_.resize(std::distance(elements_.begin(), newEnd) );
            
            break;
        }
        default :
            std::cerr<<"[WARN] making no context list valid"<<std::endl;
    }
    
    return *this;
}

template<class T>
void GraphList<T>::addExplicitReverseEdges()
{
    elements_.insert(elements_.end(), elements_.begin(), elements_.end());
    std::for_each(elements_.begin()+ elements_.size()/2, elements_.end(),  []( auto& e){std::swap(e.index1_, e.index2_);});
}

template<class T>
void GraphList<T>::readBinary(std::istream& stream)
{
    typename T::Index numElements = 0;
    stream.read(reinterpret_cast<char*>(&numElements), sizeof(typename T::Index));

    elements_.resize(numElements);

    stream.read(reinterpret_cast<char*>(&elements_[0]), numElements*sizeof(T));
}

template<class T>
void GraphList<T>::labelEdges(int labelIndex)
{
    for(auto& e : elements_)
        e.labels_.add(labelIndex);
}

template<class T>
template<typename F>
GraphList<T>& GraphList<T>::reduce(F f)
{
    //Put identical vertexes together 
   //sort();
    std::sort(elements_.begin(), elements_.end());
    
    auto groupIt = elements_.begin(); 
    //equal range uses < operator, elements do not take weight into account for default
    while(groupIt != elements_.end())
    {
        auto rangePair = std::equal_range(groupIt, elements_.end(), *groupIt); //Need to only consider node indexes

        auto aggValue =  rangePair.first;
        //Apply the passed function to each range
        aggValue->value_ = f(rangePair.first, rangePair.second);
        
        //aggValue->labels_ = std::accumulate(rangePair.first, rangePair.second, VertexLabel<typename T::graph_type>(), [](const auto& e1, const auto& e2){return e1.makeUnion(e2.labels_);});
aggValue->labels_ = std::accumulate(rangePair.first, rangePair.second, typename T::label_type(), [](const auto& e1, const auto& e2){return e1.makeUnion(e2.labels_);});
        
        
        groupIt = rangePair.second;
    }
    //Make each edge unique by removing all but the first instance (which now has the aggregated value)
    //auto newEnd = std::unique(elements_.begin(), elements_.end(), [](auto e1, auto e2){return e1.index_ == e2.index_;});
    auto newEnd = std::unique(elements_.begin(), elements_.end(), T::equalIndex);
    elements_.resize(std::distance(elements_.begin(), newEnd) );
    
    return *this;
}

template<class T>
const auto GraphList<T>::lookupIndex(typename T::Index index)const
{
    return std::lower_bound(elements_.begin(), elements_.end(), index, [](const auto& e, const auto& v){return e.index_<v;});
}
