#pragma once

/** @file VGraph.h
 */

#include "ParseVector.h"
#include "DisjointIterator.h"
#include "VersionChanges.h"
#include "VectorIA.h"
#include "AugIA.h"
#include "VersionDataVector.h"
#include "VertexIdTable.h" 
#include "VertexController.h"
#include "VersionTagMap.h"
#include "LabelMap.h"

#include "BiMap.h"

//TODO: make loading the full id mapping structure not default

//TODO: COME UP WITH "UPDATE POLICY" SELECTION WHEN ATTEMPTING TO ADD AN EXISTING EDGE TO A VERSION
//TODO: Unify vertex,node, terminology
//NOTE: IMPORTANT: THE GRAPH WILL STORE REVERSE EDGES BUT ACCEPT AND RETURN CONTEXTUAL EDGELISTS (GRAPH CODE NEEDS TO HANDLE CORRECT BEHAVIOR WHEN REVERSE EDGES SHOULD BE USED)
//TODO: Reimplement edge deletion and re-weighting

template<class T> class VGraphIO;
template<class T> class Extractor;
template<class T> class Merger;


// enum class IndexType
// {
//     global,
//     view
// };
// 
// template <typename T, IndexType ID>
// class StrongType
// {
//     public:
//         StrongType(const StrongType&) = default;
//         
//         StrongType(StrongType&& value)
//         {
//             value_ = value.value_;
//         }
//         
//         
//         
//         StrongType& operator=(const StrongType&) = default;
//         StrongType& operator=(StrongType&& other)
//         {
//             if (this != &other)
//             {
//                 value_ = other.value_;
//             }
//             return *this;
//         }
//         StrongType(const T& value) : value_(value) {}
//         
//         
//         T get()const{return value_;}
//         
//         bool operator <( const StrongType<T,ID>& rhs )const
//         {
//             return value_ < rhs.value_;
//             
//         }
//         
//         StrongType<T,ID> operator+(const StrongType<T,ID>& rhs)const
//         {
//             return StrongType<T,ID>(value_ + rhs.value_);
//         }
//         StrongType<T,ID> operator+(const T& rhs)const
//         {
//             return StrongType<T,ID>(value_ + rhs);
//         }
//         StrongType<T,ID> operator/(const T& rhs)const
//         {
//             return StrongType<T,ID>(value_ / rhs);
//         }
//         
//         operator T()const{
//             return value_;
//         }
// 
//     private:
//         T value_; 
// };
// 
// template<class T>
// using ViewIndex = StrongType<typename T::Index, IndexType::view>;
// template<class T>
// using GlobalIndex = StrongType<typename T::Index, IndexType::global>;

// T (const ViewIndex<GT>& st): T(st.value_){};

//Used for compile time switching of the requested row data in template functions
//TODO: Organize this better
enum class Row
{
    A,
    JA,
    L,
    JAL,
    AJA
};


template<class T>
struct GraphSize
{
    typename T::Index nodes_;
    typename T::Index edges_;
    int versions_;
    Context context_;
    
    friend std::ostream& operator<<(std::ostream & out, const GraphSize & graphSize)
    {
        switch(graphSize.context_)
        {
            case Context::none : out<<"N "; break;
            case Context::undirected : out<<"U "; break;
            case Context::directed : out<<"D "; break;
        }
            
        out<<"Nodes: "<<graphSize.nodes_<<" Edges: "<<graphSize.edges_<<" Versions: "<<graphSize.versions_;
        return out;
    }
};

/** @class VGraph
 * 
 * Implementation of a CSR graph with versioning.
 */
template<class T>
class VGraph
{
    public:
        
        void temp_populate_IACache();
        
        using template_type = T;
        using Index = typename T::Index;
//         using Index = GlobalIndex<T>;
        using Value = typename T::Value;
        using VersionIndex = typename T::VersionIndex;
        

        
        
        friend class VGraphIO<T>; //So graphs can be read/write more efficiently
        friend class Extractor<T>;
        friend class Merger<T>;
       
        VGraph();
        
        VGraph(Context context);
        
        //Used to create a graph with a zero version of no edges but knowledge of all node indexes
        VGraph(Context context, Index nodes);
        
        int  addVertexLabel(std::string s);
        int  addEdgeLabel(std::string s);
        
//         std::pair<std::vector<std::string>, std::vector<std::string>> getLabels()const;
        std::vector<std::string> getVertexLabels()const;
        std::vector<std::string> getEdgeLabels()const;
        
        std::pair< VGraph<T>, std::map<Index,Index> > rebase(const  GraphList<VertexS<T>>& vertexlist)const;  
        
        void writeChildrenVersions(typename T::VersionIndex depth, typename T::VersionIndex versionIndex, const std::vector<std::vector<typename T::VersionIndex> >& childLists)const;
        void printVersionTree()const;
        
        void setEmptyInitialVersion();
        
        void addNode(const std::string& id, const VertexLabel<T>& labels);
        void addNodes(const std::string& filename, const VertexLabel<T>& labels);
        
        
        void popVersion();
        void clear();
        
        //TODO add copy consturctor, delete, clear
        Context getContext()const;
        GraphSize<T> size()const;
        GraphSize<T> size(typename T::VersionIndex version)const;     
        
        VersionTagMap<T>& getTags();
        const VersionTagMap<T>& getTags()const;
        
        std::string getID(Index index)const; //TODO deprecate
        auto lookupVertex(Index index)const;
        auto lookupVertex(const std::string& name)const;
        
        std::vector<std::vector<typename T::VersionIndex> > getVersionChildLists()const;
    
        EdgeList getEdgeList(typename T::VersionIndex version)const; 
        EdgeList getEdgeList(typename T::VersionIndex version, std::vector<std::string> labelNames, bool unionNames=true)const; 
        
        
        GraphList<VertexU<T>> getVertexList()const;
        
        Index getDegree(Index node, typename T::VersionIndex version)const;
        GraphList<VertexI<T>> getDegrees(typename T::VersionIndex version)const;
        
        const std::vector<AugIA<T> > & getIA(typename T::VersionIndex version)const; //NOTE: Cache implemented API, always use this
        const AugIA<T>& getNodeIA(Index node, typename T::VersionIndex version)const;
        
        
        EdgeList indexNewEdges(const std::string& filename)const;
        
        template<class iterableType, typename FL, typename FR, typename FW>
        EdgeList indexNewEdges(const iterableType& edges, FL fl, FR fr, FW setWeight)const;
        
        void insertEdges(const EdgeList& edges, typename T::VersionIndex fromVersion, std::vector<Tag> tags, Context asContext);
        
        //TODO: make this more extensible, maybe put in different class?
        /* Add as a series of versions based on breakpoints on the edge values
         * expects sorted values 
         */
        void insertEdges_valueThreshold(const EdgeList& edges, typename T::VersionIndex fromVersion, std::vector<Tag> tags, Context asContext, typename T::Value width);
        void insertEdges_quantileThreshold(const EdgeList& edges, typename T::VersionIndex fromVersion, std::vector<Tag> tags, Context asContext, typename T::Value width);
        
        void addVersion(const VersionChanges<T> & versionChanges, typename T::VersionIndex fromVersion);

        const std::string& getServerProps()const;
            
        //Access row bounds for a given node

        auto getOutgoingNodes(Index node, typename T::VersionIndex version)const;
        
        //Low level access for more optimized querying
        const std::vector<Value> & getA()const;
        const std::vector<Index> & getJA()const;    
        const VectorIA<T> & getIA()const;
        
        const VertexController<T>& getVertexData()const;
        
        const auto & getVersionsData()const;
        
        /*
         * Used to get the correct, ordered row version from decompression and rebuilding based on IA Range
         */
        template<Row row>
        constexpr  auto getRowVersion(Index index, typename T::VersionIndex version)const;
        template<Row row>
        constexpr auto getSplitRowSegment1(Index index, typename T::VersionIndex version)const;
        template<Row row>
        constexpr auto getSplitRowSegment2(Index index, typename T::VersionIndex version)const;
        
        /* returns the rows sort order in the form of a pair <Outogoing node index, Original order>
         * 
         */
        std::vector<std::pair<Index, Index> > getSortedRowOrder(Index index, typename T::VersionIndex version)const;
        std::tuple<std::vector<Index>, std::vector<Value>, std::vector<EdgeLabel<T>>> getRowData(Index index, typename T::VersionIndex version)const;
        std::vector<std::tuple<typename T::Index, typename T::Value, EdgeLabel<T>>> getRowDataZipped(Index index, typename T::VersionIndex version)const;

        
        //Error Checking
        bool checkNodeValid(Index node, typename T::VersionIndex version)const;
        bool checkVersionValid(typename T::VersionIndex version)const;
       
        
        
        BiMap<typename T::Index, std::string> alternateMapping_; //TODO: fully integrate
    private:
        
        //Used to store configuration properties if the graph is going to be used in the vertion front end, formatted as json object
        std::string serverProps_;
        
        Context context_;

        
        LabelMap<T> LMap_; //String value of edge labels 
        std::vector<EdgeLabel<T>> L_; //Edge labels
        
        std::vector<Value> A_; /**< The values of non-zero edges in the graph.*/
        std::vector<Index> JA_; /**< The outgoing node/column index of the edges.*/
        VectorIA<T> IA_; /**< The index bounds in A_ and JA_ for outgoing edges in IA_[index].*/
        
        VersionDataVector<T> versionsData_;/**< Ancillary data about each version, such as parent version, compression keyframe, and edges.*/ 
        VersionTagMap<T> versionTags_;
       
        VertexController<T> vertexData_;
       
        //TODO: THIS IS VERY SLOW TO COMPUTE, REWRITE
//         std::vector<std::pair<VertexLabel<T>, EdgeLabel<T>>> labelsUsed_; //Stores which labels are used in which versions by looking at the final edgelist
        
        
        Index aggregate(std::vector<std::tuple<Index,Value, EdgeLabel<T>>>& tmpJAA, Index row, typename T::VersionIndex fromVersion /*FUNCTION*/);
        
        //Gets the sorted IA and JA vectors for a row based on whether they come from a split or regular row
        template<RangeFlags F>
        constexpr std::vector<std::pair<Index, Value> > getSortedSegments(const AugIA<T>& range)const;
        
        template<RangeFlags F>
        constexpr std::vector<std::pair<Index, EdgeLabel<T>> > getSortedSegmentsLabels(const AugIA<T>& range)const;
};

template<class T>
void VGraph<T>::temp_populate_IACache()
{
    IA_.populateCache();
}

template<class T>
VGraph<T>::VGraph()
{
    context_ = Context::undirected;
    A_ = std::vector<Value>();
    JA_ = std::vector<Index>();
    IA_ = VectorIA<T>();
    
    versionsData_ = VersionDataVector<T>();
    
}

template<class T>
VGraph<T>::VGraph(Context context, Index nodes)
{
    context_ = context;
    A_ = std::vector<Value>();
    JA_ = std::vector<Index>();
    IA_ = VectorIA<T>(nodes);
    
    versionsData_ = VersionDataVector<T>(nodes);
}

template<class T>
VGraph<T>::VGraph(Context context)
{
    context_ = context;
    A_ = std::vector<Value>();
    JA_ = std::vector<Index>();
    IA_ = VectorIA<T>();
    
    versionsData_ = VersionDataVector<T>();
}

template<class T>
void VGraph<T>::setEmptyInitialVersion()
{
    A_.clear();
    JA_.clear();
    L_.clear();
    IA_ = VectorIA<T>(vertexData_.size());
    versionsData_ = VersionDataVector<T>(vertexData_.size());
    versionTags_.addTag(0, "Empty");
//     labelsUsed_ = std::vector<std::pair<VertexLabel<T>, EdgeLabel<T>>>(1);
}

//name_ also intended to be sort of a primary key
template<class T>
void VGraph<T>::addNodes(const std::string& filename, const VertexLabel<T>& labels)
{
    vertexData_.insert(filename, labels);
}

template<class T>
void VGraph<T>::addNode(const std::string& id, const VertexLabel<T>& labels)
{
    vertexData_.insert(id, labels);
}

template <class T>
int  VGraph<T>::addVertexLabel(std::string s)
{
    return vertexData_.addLabel(s);
}

template <class T>
int  VGraph<T>::addEdgeLabel(std::string s)
{
    return LMap_.addLabel(s);
}

template <class T>
const std::string& VGraph<T>::getServerProps()const
{
    return serverProps_;
}

// template<class T>
// std::pair<std::vector<std::string>, std::vector<std::string>> getLabels()const
// {
//     std::vec
// }

template<class T>
std::vector<std::string> VGraph<T>::getVertexLabels()const
{
    return vertexData_.getLabels();
}

template<class T>
std::vector<std::string> VGraph<T>::getEdgeLabels()const
{
    return LMap_.getLabels();
}

template<class T>
void  VGraph<T>::writeChildrenVersions(typename T::VersionIndex depth, typename T::VersionIndex versionIndex, const std::vector<std::vector<typename T::VersionIndex> >& childLists)const
{
    //Print depth indentation
    for(typename T::VersionIndex i=0; i<depth; ++i)
        std::cout<<"  ";

    std::cout<<versionIndex<<": ";
    auto tags = versionTags_.lookup(versionIndex);
    for(const auto& e : tags)
        std::cout<<e<<" ";
    std::cout<<std::endl;

    //if not, leaf recurse
    if(versionIndex<childLists.size())
    for(const auto& e : childLists[versionIndex])
    {
        writeChildrenVersions(depth+1, e, childLists);
    }
}


template<class T>
void VGraph<T>::printVersionTree()const
{
    std::vector<std::vector<typename T::VersionIndex> > childLists = getVersionChildLists();
    writeChildrenVersions(0, 0, childLists);
}


template<class T>
void VGraph<T>::popVersion()
{
     typename T::VersionIndex version = size().versions_-1;
     auto versionBound = versionsData_[version].beginAppendIndex_;//IA_.getEdgeVersionBegin(version);
     //std::cout<<versionBound<<std::endl;
     
    //Remove L
    L_.erase(L_.begin()+versionBound, L_.end());
     //Remove A
    A_.erase(A_.begin()+versionBound, A_.end());
     //Remove JA
    JA_.erase(JA_.begin()+versionBound, JA_.end());

     //Remove IA
    IA_.pop();

    versionsData_.pop();     
}

template<class T>
void VGraph<T>::clear()
{
    A_ = std::vector<Value>();
    JA_ = std::vector<Index>();
    IA_ = VectorIA<T>();
    
    versionsData_ = VersionDataVector<T>();
}

template<class T>
Context VGraph<T>::getContext()const
{
    return context_;
}

template<class T>
VersionTagMap<T>& VGraph<T>::getTags()
{
    return versionTags_;
}

template<class T>
const VersionTagMap<T>& VGraph<T>::getTags()const
{
    return versionTags_;
}

template<class T>
std::string VGraph<T>::getID(Index index) const
{
    return vertexData_.lookup(index);
}

template<class T>
auto VGraph<T>::lookupVertex(Index index)const
{
    return vertexData_.lookup(index);
}

template<class T>
auto VGraph<T>::lookupVertex(const std::string& name)const
{
    return vertexData_.lookup(name);
}

template<class T>
GraphSize<T> VGraph<T>::size()const
{
    //Gets the upper IA_ range from the index before th estart of the second version
    Index edges = std::accumulate(versionsData_.begin(), versionsData_.end(), (Index)0, [](Index a, const VersionData<T>&  b){return a + b.edges_ ;});
    Index nodes = std::accumulate(versionsData_.begin(), versionsData_.end(), (Index)0, [](Index a, const VersionData<T>&  b){return a + b.nodes_ ;});
    
    return (context_ == Context::undirected) ? 
        GraphSize<T>{nodes, edges/2, (typename T::VersionIndex)versionsData_.size(), context_} :
        GraphSize<T>{nodes, edges, (typename T::VersionIndex)versionsData_.size(),context_} ;
}

template<class T>
GraphSize<T> VGraph<T>::size(typename T::VersionIndex version)const
{
    if(version >= size().versions_ || version < 0)
        return GraphSize<T>{0, 0, 0, Context::none};
    
    return (context_ == Context::undirected) ? 
        GraphSize<T>{versionsData_[version].nodes_, versionsData_[version].edges_/2, 1, context_} :
        GraphSize<T>{versionsData_[version].nodes_, versionsData_[version].edges_, 1, context_} ;
}

template<class T>
std::vector<std::vector<typename T::VersionIndex> > VGraph<T>::getVersionChildLists()const
{
    return versionsData_.computeVersionChildren();
}

template<class T>
EdgeList VGraph<T>::getEdgeList(typename T::VersionIndex version)const
{
    EdgeList retVal(context_);
    
    for(Index i=0; i<size(version).nodes_; ++i)
    {
        //TODO: optimize to not need to do the sorting, etc for A and L seperately
        auto [Asegment, JAsegment] = getRowVersion<Row::AJA>(i,version);
        auto Lsegment = getRowVersion<Row::L>(i,version);
        
        if(context_ == Context::directed)
        {
            for(Index j=0; j<Asegment.size(); ++j)
                retVal.push_back(EdgeElement<T>{ i, JAsegment[j], Asegment[j], Lsegment[j] });
        }
        else
        {
            for(Index j=0; j<Asegment.size(); ++j)
                 if(i <  JAsegment[j])
                    retVal.push_back(EdgeElement<T>{ i, JAsegment[j], Asegment[j], Lsegment[j] });
        }
    }
    
    return retVal;
}

template<class T>
EdgeList VGraph<T>::getEdgeList(typename T::VersionIndex version, std::vector<std::string> labelNames, bool unionNames)const
{
    EdgeList retVal(context_);
    
    std::vector<int> labelIndexes;
    //std::transform(labelNames.begin(), labelNames.end(), std::back_inserter(labelIndexes), [&, this](const auto& e){return labelMappings_.at(e);});
    std::transform(labelNames.begin(), labelNames.end(), std::back_inserter(labelIndexes), [&, this](const auto& e){return LMap_.lookup(e);});
    
    if(unionNames)
    {
    
        for(Index i=0; i<size(version).nodes_; ++i)
        {
            auto [JA, A, L] = getRowData(i, version);
            
            if(context_ == Context::directed)
            {
                for(Index j=0; j<A.size(); ++j)
                {
                    if(L[j].testAny(labelIndexes))
                        retVal.push_back(EdgeElement<T>{ i, JA[j], A[j], L[j] });
                }
            }
            else
            {
                for(Index j=0; j<A.size(); ++j)
                    if(i <  JA[j])
                        if(L[j].testAny(labelIndexes))
                            retVal.push_back(EdgeElement<T>{ i, JA[j], A[j], L[j] });
            }
        }
    }
    else
    {
        for(Index i=0; i<size(version).nodes_; ++i)
        {
            auto [JA, A, L] = getRowData(i, version);
            
            if(context_ == Context::directed)
            {
                for(Index j=0; j<A.size(); ++j)
                {
                    if(L[j].testAll(labelIndexes))
                        retVal.push_back(EdgeElement<T>{ i, JA[j], A[j], L[j] });
                }
            }
            else
            {
                for(Index j=0; j<A.size(); ++j)
                    if(i <  JA[j])
                        if(L[j].testAll(labelIndexes))
                            retVal.push_back(EdgeElement<T>{ i, JA[j], A[j], L[j] });
            }
        }
    }
    
    
    return retVal;
}

template<class T>
GraphList<VertexU<T>> VGraph<T>::getVertexList()const
{
    GraphList<VertexU<T>> retVal;
    
    for(Index i=0; i<vertexData_.size(); ++i)
        retVal.push_back(VertexU<T>(i,true, vertexData_.lookupLabels(i)));
    
    return retVal;
}

template<class T>
typename VGraph<T>::Index VGraph<T>::getDegree(Index node, typename T::VersionIndex version)const
{
    auto row = getIA(version)[node];

    //This is written so the if branch doesn't need to happen, if the row is not split then
    //the s4 length is multiplied by 0 and effectively ignored
    return row.s2() + (row.isSplitRow())*row.s4();
}

template<class T>
GraphList<VertexI<T>> VGraph<T>::getDegrees(typename T::VersionIndex version)const
{
    GraphList<VertexI<T>> degrees;
    for(Index i=0; i<size(version).nodes_; ++i)
        degrees.push_back(VertexI<T>{i,getDegree(i, version)});
    
    return degrees;
}

template<class T>
const AugIA<T>& VGraph<T>::getNodeIA(Index node, typename T::VersionIndex version)const
{
    return getIA(version)[node];
}

template<class T>
EdgeList VGraph<T>::indexNewEdges(const std::string& filename)const
{
    ParseVector<std::pair<std::string, std::string>> names(filename);
    
    auto w1 = [](const auto& e){return 1.0;};
    auto lname = [](const auto& e){return e.first;};
    auto rname = [](const auto& e){return e.second;};
    
    
    
    return indexNewEdges(names.elements_, lname, rname, w1);
}

template<class T>
template<class iterableType, typename FL, typename FR, typename FW>
EdgeList VGraph<T>::indexNewEdges(const iterableType& edges, FL fl, FR fr, FW setWeight)const
{
     EdgeList newEdges(context_);
     

    for(const auto& e : edges)
    {
        auto index1 = vertexData_.lookup(fl(e));
        auto index2 = vertexData_.lookup(fr(e));

        //std::cout<<"lu "<<index1<<":"<<fl(e)<<":::"<<index2<<":"<<fr(e)<<"\n";
        
        if(index1 != T::invalidIndex && index2 !=T::invalidIndex)
            newEdges.push_back(EdgeElement<T>(index1, index2, setWeight(e), EdgeLabel<T>()));
                
    }
    vertexData_.flushMissingIds(std::cerr);
    
    return newEdges;
}

template<class T>
void VGraph<T>::insertEdges(const EdgeList& edges, typename T::VersionIndex fromVersion, std::vector<Tag> tags, Context asContext)
{
    //Overiding the default graph context
    if(asContext != Context::none && asContext != context_)
    {
        std::cerr<<"[WARN] insert edgelist context overidden"<<std::endl;
        auto edgesCpy = edges;
        edgesCpy.setContext(asContext);
        
        VersionChanges<T> vc(edgesCpy, Change::add);
        addVersion(vc, fromVersion);
        versionTags_.addTags(size().versions_-1, tags);
        
    }
    else
    {
        VersionChanges<T> vc(edges, Change::add);
        addVersion(vc, fromVersion);
        versionTags_.addTags(size().versions_-1, tags);
    }
}

template<class T>
void VGraph<T>::insertEdges_valueThreshold(const EdgeList& edges, typename T::VersionIndex fromVersion, std::vector<Tag> tags, Context asContext, typename T::Value width)
{
    bool FIRST = true;
    
    //Overiding the default graph context
    if(asContext != Context::none && asContext != context_)
    {
        std::cerr<<"[ERROR] insert edgelist context wrong"<<std::endl;
    }
    else
    {
        typename T::Value initMin = edges[edges.size()-1].value_ - width;
        typename T::Value finalMin =  edges[0].value_; 
        
        std::cout<<"init "<<initMin<<" final "<<finalMin<<"\n";
        
        while(true)
        {
            std::cout<<initMin<<" "<<finalMin<<std::endl;
            
            auto edgesSubset = edges.select([initMin, width](const auto& e){return e.value_ >= initMin && e.value_<initMin+width;});    
            
            if(edgesSubset.size()>0)
            {
                VersionChanges<T> vc(edgesSubset, Change::add);
                if(FIRST)
                {
                    addVersion(vc, fromVersion);
                    versionTags_.addTags(size().versions_-1, tags);
                    versionTags_.addTags(size().versions_-1, {std::to_string(initMin)});
                    FIRST = false;
                }
                else
                {
                    addVersion(vc, size().versions_-1);
                    versionTags_.addTags(size().versions_-1, tags);
                    versionTags_.addTags(size().versions_-1, {std::to_string(initMin)});
                }
            }
            std::cout<<size(size().versions_-1)<<"\n";
            
            if(initMin < finalMin)
                break;
            
            initMin-=width;
        }
    }
}

template<class T>
void VGraph<T>::insertEdges_quantileThreshold(const EdgeList& edges, typename T::VersionIndex fromVersion, std::vector<Tag> tags, Context asContext, typename T::Value width)
{
     bool FIRST = true;
    
    //Overiding the default graph context
    if(asContext != Context::none && asContext != context_)
    {
        std::cerr<<"[ERROR] insert edgelist context wrong"<<std::endl;
    }
    else
    {
        double quant =width;
        Index vStep = edges.size()*width;
        Index from=0;
        Index to=vStep;
        
        
        while(true)
        {
            std::cout<<from<<" "<<to<<std::endl;
            
            auto edgesSubset = GraphList<EdgeElement<T>>(edges, from, to);
            std::cout<<edgesSubset.size()<<std::endl;
            
            if(edgesSubset.size()>0)
            {
                VersionChanges<T> vc(edgesSubset, Change::add);
                if(FIRST)
                {
                    addVersion(vc, fromVersion);
                    versionTags_.addTags(size().versions_-1, tags);
                    versionTags_.addTags(size().versions_-1, {std::to_string(quant)});
                    FIRST = false;
                }
                else
                {
                    addVersion(vc, size().versions_-1);
                    versionTags_.addTags(size().versions_-1, tags);
                    versionTags_.addTags(size().versions_-1, {std::to_string(quant)});
                }
            }
            std::cout<<size(size().versions_-1)<<std::endl;
            quant += width;
            from=to;
            
              if(from >= edges.size())
                break;
            to = std::min((size_t)to+vStep, edges.size());
            
            //to+=vStep;
            
            
          

        }
    }
}


template<class T>
void VGraph<T>::addVersion(const VersionChanges<T> & versionChanges, typename T::VersionIndex fromVersion)
{
    long NUM_TOSPLIT=0;
    long NUM_REJOIN=0;
    long NUM_STAYSPLIT=0;
    long NUM_ROWSWCHANGE=0;
    
    if(versionChanges.empty())
    {
        std::cerr<<"no changes in provided new version"<<std::endl;
        return;
    }
    
    Index newVersionNodes = std::max(versionChanges.getLargestAddedNodeIndex()+1, versionsData_.back().nodes_ );
    Index beginAppendIndex = A_.size();

    //Append a copy of the orginal graph's row indices (also handle case in which graph is empty, getting first version)
    std::vector<AugIA<T>> IAU;

    IAU = IA_.decompressIA(fromVersion);
    IAU.resize( newVersionNodes, AugIA<T>()); 
    


    //Define a lambda for use with the equal range Edges algorithm
    auto rangeCmp = [](const EdgeElement<T>& lhs, const EdgeElement<T>& rhs){return lhs.index1_< rhs.index1_;};
   
    //Keep track of how many edges were really added or removed, ex: removing a non-existant edge doens't actually do anything
    //Need to compare post aggregation
    Index realEdgeDeltaCorrection =0;
    
    //Iterate over each node(row in matrix) looking for changes to apply in new version
    for( Index i=0; i<newVersionNodes; ++i)
    {    
        auto addBounds = std::equal_range(versionChanges.additions_.getElements().begin(), versionChanges.additions_.getElements().end(), EdgeElement<T>(i,-1,-1, EdgeLabel<T>()), rangeCmp );
        if(addBounds.first == addBounds.second)
            continue;
        
        //std::cout<<"Changes in : "<<i<<std::endl;
        ++NUM_ROWSWCHANGE;
        
        //Temporary so as to allow aggregation before adding to the main Graph
        //std::vector<std::pair<Index, Value> > tmpJAA;
        std::vector<std::tuple<Index, Value, EdgeLabel<T> > > tmpJAAL;
 
        Index newRowOffsetbegin = A_.size();
    
        //Add additions
        for(auto it=addBounds.first; it!=addBounds.second; ++it)
        {
            //tmpJAA.push_back(std::make_pair(it->index2_, it->value_));
            tmpJAAL.push_back(std::make_tuple(it->index2_, it->value_, it->labels_));
        }
        
        if(tmpJAAL.size()>0)
        {
            aggregate(tmpJAAL, i, fromVersion);
            if(tmpJAAL.size()==0)
                continue;
            
            if(IAU[i].isSplitRow())
            {
                Index preAggSize = tmpJAAL.size();
 
                // from segment2
                //NOTE: IMPORTANT THESE NEED TO BE ADDED AFTER AGGREGATION OTHERWISE THEY WILL BE LOST
                for(Index j = IAU[i].s3(); j< IAU[i].s3() + IAU[i].s4(); ++j)
                {
                    tmpJAAL.push_back(std::make_tuple(JA_[j], A_[j], L_[j]));
                }
                
                  
                Index postAggSize = tmpJAAL.size();
                realEdgeDeltaCorrection += (postAggSize - preAggSize );
                
                //Remain a SplitRow
                if(tmpJAAL.size()+IAU[i].s4() < IAU[i].s2() )
                {   
                     ++NUM_STAYSPLIT;
                    //IA_[newValueOffset+i ] = Range(IAU[i].s1(), IAU[i].s2(), newRowOffsetbegin, postAggSize, SPLITROW);
                    IAU[i] = AugIA<T>(IAU[i].s1(), IAU[i].s2(), newRowOffsetbegin, postAggSize, SPLITROW);
                }
                else //Rejoin the new row segments
                {
                    ++NUM_REJOIN;
                    //Add the segment one edges back to tmpJAA
                    for(Index j = IAU[i].s1(); j< IAU[i].s1() + IAU[i].s2(); ++j)
                    {
                        tmpJAAL.push_back(std::make_tuple(JA_[j], A_[j], L_[j]));
                    }
                    std::sort(tmpJAAL.begin(), tmpJAAL.end());
                    
                    
                    
                    //IA_[newValueOffset+i ] = Range(newRowOffsetbegin, tmpJAA.size());
                    IAU[i] = AugIA<T>(newRowOffsetbegin, tmpJAAL.size());
                }
                
            }
            else//Row is not a split row
            {
                Index preAggSize = tmpJAAL.size();

                Index postAggSize = tmpJAAL.size();
                realEdgeDeltaCorrection += (postAggSize - preAggSize );
     
                if(IAU[i].s2() == 0)//1st time row added to not split to not split
                {   
                    //IA_[newValueOffset+i ] = Range(newRowOffsetbegin, postAggSize);
                    IAU[i] = AugIA<T>(newRowOffsetbegin, postAggSize); 
                }
                else//not split to split
                {
                    ++NUM_TOSPLIT;
                   // IA_[newValueOffset+i ] = Range(IAU[i].s1(), IAU[i].s2(), newRowOffsetbegin, postAggSize, SPLITROW);
                    IAU[i] = AugIA<T>(IAU[i].s1(), IAU[i].s2(), newRowOffsetbegin, postAggSize, SPLITROW);
                }
            }
           
        //Appends the now aggregated new A and JA vectors to A_ and JA_
        std::transform(tmpJAAL.begin(), tmpJAAL.end(), std::insert_iterator<std::vector<Value> >(A_, A_.end()), [](const auto&e){return std::get<1>(e);});
        std::transform(tmpJAAL.begin(), tmpJAAL.end(), std::insert_iterator<std::vector<EdgeLabel<T>> >(L_, L_.end()), [](const auto&e){return std::get<2>(e);});
        std::transform(tmpJAAL.begin(), tmpJAAL.end(), std::insert_iterator<std::vector<Index> >(JA_, JA_.end()), [](const auto&e){return std::get<0>(e);});
        }
        
    }

    Index prevKeyFrame =  versionsData_[fromVersion].keyFrameVersion_;
    bool successfulCompress = IA_.insertCompressIA(IAU, prevKeyFrame);

    Index newKeyFrame = size().versions_;
    if(successfulCompress)
        newKeyFrame = prevKeyFrame; 
    
    Index newVersionEdges = versionsData_[fromVersion].edges_ + versionChanges.additions_.size()  + realEdgeDeltaCorrection;

    
    versionsData_.push_back(
        VersionData<T>(
            fromVersion, 
            newKeyFrame, 
            newVersionEdges,
            newVersionNodes,//, 
            beginAppendIndex
        )
    );
    
    //TODO: THIS IS VERY INEFFICIENT TEMP SOLUTION TO GET USED LABELS, REWRITE
    //Compute the used labels
    auto lastI = size().versions_-1;
//     labelsUsed_.push_back(std::pair<VertexLabel<T>, EdgeLabel<T>>());
    auto edges = getEdgeList(lastI);
        
    VertexLabel<T> vus;
    EdgeLabel<T> eus;
    
    for(const auto& e: edges.getElements())
    {
        eus = eus.makeUnion(e.labels_); 
        vus = vus.makeUnion( getVertexData().lookupLabels( e.index1_));
        vus = vus.makeUnion( getVertexData().lookupLabels( e.index2_));
    }
    versionsData_.setLabelsUsed(lastI, vus, eus);
    
    
}

template<class T>
std::vector<std::pair<typename VGraph<T>::Index, typename VGraph<T>::Index> > VGraph<T>::getSortedRowOrder(Index index, typename T::VersionIndex version)const
{
    auto range = IA_.getIA(version)[index];
    
    std::vector<std::pair<Index, Index> > JA;   
    
    for(Index i = range.s1(); i< range.s1()+range.s2(); ++i)
    {
        JA.push_back({JA_[i],i});
    }
    if(range.isSplitRow())
    {
        for(Index i = range.s3(); i< range.s3()+range.s4(); ++i)
        {
            JA.push_back({JA_[i],i});
        }
    }
    
    std::sort(JA.begin(), JA.end(), [](const auto& lhs, const auto& rhs){return lhs.first < rhs.first;});
    return JA;
}

template<class T>
std::tuple<std::vector<typename VGraph<T>::Index>, std::vector<typename T::Value>, std::vector<EdgeLabel<T>>>  VGraph<T>::getRowData(Index index, typename T::VersionIndex version)const
{
    auto JA_o = getSortedRowOrder(index, version);
    std::vector<typename T::Index> JA;
    std::vector<typename T::Value> A;
    std::vector<EdgeLabel<T>> L;
    
    std::transform(JA_o.begin(), JA_o.end(), std::inserter(A, A.end()), [&,this](const auto& e){return A_[e.second];});
    std::transform(JA_o.begin(), JA_o.end(), std::inserter(L, L.end()), [&,this](const auto& e){return L_[e.second];});
    std::transform(JA_o.begin(), JA_o.end(), std::inserter(JA, JA.end()), [](const auto& e){return e.first;});
    //ext.begin(), ext.end(), std::insert_iterator<std::vector<EdgeLabel<T>> >(retVal, retVal.end()), [](const auto&e){return e.second;}
    return std::make_tuple(JA, A, L);
}

template<class T>
std::vector<std::tuple<typename T::Index, typename T::Value, EdgeLabel<T>>> VGraph<T>::getRowDataZipped(Index index, typename T::VersionIndex version)const
{
     auto JA_o = getSortedRowOrder(index, version);
     std::vector<std::tuple<typename T::Index, typename T::Value, EdgeLabel<T>>> ret;
     
     std::transform(JA_o.begin(), JA_o.end(), std::inserter(ret, ret.end()), [&,this](const auto& e){return std::make_tuple(e.first, A_[e.second], L_[e.second]);});
     return ret;
     
}

//Gets the sorted IA and JA vectors for a row based on whether they come from a split or regular row
template<class T>
template<RangeFlags F>
constexpr std::vector<std::pair<typename VGraph<T>::Index, typename T::Value> > VGraph<T>::getSortedSegments(const AugIA<T>& range)const
{
        std::vector<std::pair<Index, Value> > ext;
        
        std::vector<Value> unsorted;
        unsorted.insert(unsorted.end(), A_.begin()+range.s1(), A_.begin()+range.s1()+range.s2());
        if constexpr(F == SPLITROW)
            unsorted.insert(unsorted.end(), A_.begin()+range.s3(), A_.begin()+range.s3()+range.s4());
        
        //sort based on JA
        std::vector<Index> JAtmp;
        JAtmp.insert(JAtmp.end(), JA_.begin()+range.s1(), JA_.begin()+range.s1()+range.s2());
        if constexpr(F ==  SPLITROW)
            JAtmp.insert(JAtmp.end(), JA_.begin()+range.s3(), JA_.begin()+range.s3()+range.s4());
        
        for(Index i=0; i< unsorted.size(); ++i)
            ext.push_back(std::make_pair(JAtmp[i], unsorted[i]));

        std::sort(ext.begin(), ext.end());
        return ext;
};
    

template<class T>
template<RangeFlags F>
constexpr std::vector<std::pair<typename VGraph<T>::Index, EdgeLabel<T>> > VGraph<T>::getSortedSegmentsLabels(const AugIA<T>& range)const
{
        std::vector<std::pair<Index, EdgeLabel<T>> > ext;
        
        std::vector<EdgeLabel<T>> unsorted;
        unsorted.insert(unsorted.end(), L_.begin()+range.s1(), L_.begin()+range.s1()+range.s2());
        if constexpr(F == SPLITROW)
            unsorted.insert(unsorted.end(), L_.begin()+range.s3(), L_.begin()+range.s3()+range.s4());
        
        //sort based on JA
        std::vector<Index> JAtmp;
        JAtmp.insert(JAtmp.end(), JA_.begin()+range.s1(), JA_.begin()+range.s1()+range.s2());
        if constexpr(F ==  SPLITROW)
            JAtmp.insert(JAtmp.end(), JA_.begin()+range.s3(), JA_.begin()+range.s3()+range.s4());
        
        for(Index i=0; i< unsorted.size(); ++i)
            ext.push_back(std::make_pair(JAtmp[i], unsorted[i]));

        std::sort(ext.begin(), ext.end());
        return ext;
}//TODO: generalize for  A, JA ,etc



//TODO: Clean this up
//TODO: Change the <>JA versions to return a pair of < <>, JA >
template<class T>
template<Row row>
constexpr auto VGraph<T>::getRowVersion(Index index, typename T::VersionIndex version)const
{
    #ifdef SAFETY
    if (!checkNodeValid(index, version))
    {
        if constexpr(row == Row::A)
            return std::vector<Value>();
         else if constexpr(row == Row::JA)
            return std::vector<Index>();
    }
    #endif

    auto r = IA_.getIA(version)[index];
    
    //NOTE: IMPORTANT: EVEN IF ROW NOT SPLIT IN TWO, WHEN ADDING 2nd EDGE, MIGHT BE OUT OF ORDER
    if(!r.isSplitRow())//If the row sequences are not split in two
    {
        if constexpr(row == Row::A)
        {
            std::vector<std::pair<Index, Value> > ext = getSortedSegments<NORMAL>(r);
            
            std::vector<Value> retVal;
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<Value> >(retVal, retVal.end()), [](const auto&e){return e.second;});
            
            return retVal;
        }
        else if constexpr(row == Row::L)
        {
            std::vector<std::pair<Index, EdgeLabel<T>> > ext = getSortedSegmentsLabels<NORMAL>(r);
            std::vector<EdgeLabel<T>> retVal;
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<EdgeLabel<T>> >(retVal, retVal.end()), [](const auto&e){return e.second;});
            
            return retVal;
        }
        else if constexpr(row == Row::JA)
        {
            std::vector<Index> retVal( JA_.begin()+r.s1(), JA_.begin()+r.s1()+r.s2());

            return retVal;
        }
        else if constexpr(row == Row::AJA)
        {
            std::vector<std::pair<Index, Value> > ext = getSortedSegments<NORMAL>(r);
            
            std::pair<std::vector<Value>, std::vector<Index> > retVal;
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<Value> >(retVal.first, retVal.first.end()), [](const auto&e){return e.second;});
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<Index> >(retVal.second, retVal.second.end()), [](const auto&e){return e.first;});
            
            return retVal;
        }
        else if constexpr(row == Row::JAL)
        {
            return  getSortedSegmentsLabels<NORMAL>(r);

        }
    }
    else
    {
        if constexpr(row == Row::A)
        {
            std::vector<std::pair<Index, Value> > ext = getSortedSegments<SPLITROW>(r);
            
            std::vector<Value> retVal;
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<Value> >(retVal, retVal.end()), [](const auto&e){return e.second;});
            
            return retVal;
        }
        else if constexpr(row == Row::L)
        {
            std::vector<std::pair<Index, EdgeLabel<T>> > ext = getSortedSegmentsLabels<SPLITROW>(r);
            std::vector<EdgeLabel<T>> retVal;
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<EdgeLabel<T>> >(retVal, retVal.end()), [](const auto&e){return e.second;});
            
            return retVal;
        }
        else if constexpr(row == Row::JA) //Note the first portion of a split row will be sorted, but the second wont necessarily
        {
            std::vector<Index> retVal;
            retVal.reserve(r.s2()+r.s4());

            std::vector<Index> part2(JA_.begin()+r.s3(),JA_.begin()+r.s3()+r.s4());
            
            std::merge( JA_.begin()+r.s1(), JA_.begin()+r.s1()+r.s2(), part2.begin(), part2.end(), std::back_inserter(retVal));
            
            return retVal;
        }
        else if constexpr(row == Row::AJA)
        {
            std::vector<std::pair<Index, Value> > ext = getSortedSegments<SPLITROW>(r);
            
            std::pair<std::vector<Value>, std::vector<Index> > retVal;
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<Value> >(retVal.first, retVal.first.end()), [](const auto&e){return e.second;});
            std::transform(ext.begin(), ext.end(), std::insert_iterator<std::vector<Index> >(retVal.second, retVal.second.end()), [](const auto&e){return e.first;});
                    
            return retVal;
        }
        else if constexpr(row == Row::JAL)
        {
            return  getSortedSegmentsLabels<SPLITROW>(r);
        }
        
    }
}

//TODO: CURRENTLY ONLY USE FOR GETTING 1st SEGMENT OF SPLIT OR NORMAL JA VECTOR
template<class T>
template<Row row>
constexpr auto VGraph<T>::getSplitRowSegment1(Index index, typename T::VersionIndex version)const
{
        #ifdef SAFETY
    if (!checkNodeValid(index, version))
    {
        if constexpr(row == Row::A)
            return std::vector<Value>();
         else if constexpr(row == Row::JA)
            return std::vector<Index>();
    }
    #endif
    
     auto r = IA_.getIA(version)[index];
    
    if constexpr(row == Row::A)
    {
        return std::vector<Value>();
    }
    else if constexpr(row == Row::JA)
    {
        return(std::make_pair(JA_.begin()+r.s1(),JA_.begin()+r.s1()+r.s2()));
    }
    else if constexpr(row == Row::AJA)
    {
        return std::vector<std::pair<Index, Value> >();
    }
}

//TODO: CURRENTLY ONLY USE FOR GETTING SECOND SEGMENT OF SPLIT JA VECTOR
template<class T>
template<Row row>
constexpr auto VGraph<T>::getSplitRowSegment2(Index index, typename T::VersionIndex version)const
{
        #ifdef SAFETY
    if (!checkNodeValid(index, version))
    {
        if constexpr(row == Row::A)
            return std::vector<Value>();
         else if constexpr(row == Row::JA)
            return std::vector<Index>();
    }
    #endif

        auto r = IA_.getIA(version)[index];

        if constexpr(row == Row::A)
        {
            std::vector<Value> retVal;

            return retVal;
        }
        else if constexpr(row == Row::JA) //Note the first portion of a split row will be sorted, but the second wont necessarily
        {
            return std::make_pair(JA_.begin()+r.s3(),JA_.begin()+r.s3()+r.s4());
        }
        else if constexpr(row == Row::AJA)
        {
            std::pair<std::vector<Value>, std::vector<Index> > retVal;

            return retVal;
        }
}

template<class T>
auto VGraph<T>::getOutgoingNodes(Index node, typename T::VersionIndex version)const
{
    #ifdef SAFETY
    if (!checkNodeValid(node, version))
        return make_pair( DisjointIterator<Index>(JA_.end(),JA_.end(),JA_.end() ), JA_.end());
    #endif
    
    auto r = IA_.getIA(version)[node];

    if(!r.isSplitRow()) //If the row sequences are not split in two
    {
        return make_pair(
            DisjointIterator<Index>(JA_.begin() + r.s1(), JA_.begin() + r.s1() + r.s2(), JA_.begin() + r.s1() + r.s2()),
            JA_.begin() + r.s1() + r.s2()
        );
    }
    else
    {
        return make_pair(
            DisjointIterator<Index>(JA_.begin() + r.s1(), JA_.begin() + r.s1() + r.s2(), JA_.begin() + r.s3()),
             JA_.begin() + r.s3() + r.s4()
        );
    }

}

template<class T>
const std::vector<typename T::Value> & VGraph<T>::getA()const
{
    return A_;
}

template<class T>
const std::vector<typename VGraph<T>::Index> & VGraph<T>::getJA()const
{
    return JA_;
}

template<class T>
const VectorIA<T> & VGraph<T>::getIA()const
{
    return IA_;
}

template<class T>
const VertexController<T>& VGraph<T>::getVertexData()const
{
    return vertexData_;
}

template<class T>
const std::vector<AugIA<T>> & VGraph<T>::getIA(typename T::VersionIndex version)const
{
    return IA_.getIA(version);
}

//TODO: IMPORVE EFFICIENY 
//Expects v2_indices to be ordered, all from one row so v1_ will be eqqual i nrange
template<class T>
typename VGraph<T>::Index VGraph<T>::aggregate(std::vector<std::tuple<Index,Value, EdgeLabel<T>>>& tmpJAAL, Index row, typename T::VersionIndex fromVersion /*FUNCTION*/)
{
   std::vector<std::tuple<Index,Value, EdgeLabel<T>>> aggJAAL;

    auto oldOutV = getRowVersion<Row::JA>(row, fromVersion);
    auto oldOut = std::make_pair(oldOutV.begin(), oldOutV.end());
    
    for(Index i=0; i< tmpJAAL.size(); ++i)
    {
       bool dup = false;
        for(auto it=oldOut.first; it!=oldOut.second; ++it)
        {
            //if(*it == tmpJAAL[i].first)
            if(*it == std::get<0>(tmpJAAL[i]))
            {   
                dup=true;
                break;
            }
        }
        if(!dup)
        {
            aggJAAL.push_back(tmpJAAL[i]);
        }
    }
    
    tmpJAAL = aggJAAL;

    return 0;
}

template<class T>
bool VGraph<T>::checkNodeValid(Index node, typename T::VersionIndex version)const
{
    if(node >= size(version).nodes_)
    {
        std::cerr<<"error: node "<<node<<" does not exist in v "<<version<<std::endl;
        return false;
    }
    else return true;
}

template<class T>
bool VGraph<T>::checkVersionValid(typename T::VersionIndex version)const
{
    if(version >= size().versions_)
    {
        std::cerr<<"error: version "<<version<<" does not exist"<<std::endl;
        return false;
    }
    else return true;
}

template<class T>
const auto & VGraph<T>::getVersionsData()const
{
    return versionsData_;
}
