#pragma once

//TODO: Move these to a seperate namespace with a more descriptive name

/**
 *  @return An Index Sorted VertexList of all indexes referenced in the passed edgeList
 */
template<class GT>
GraphList<VertexS<GT>> edgeListToVertexList(const EdgeList & edgeList);

/*
 * Restrictive being true means both indexes in the edge have to appear in the vertexlist rather than only one
 */
template<class GT>
EdgeList mapVertexListToEdgeList(const VGraph<GT>& graph, int version, const GraphList<VertexU<GT>>& vertexList, bool restrictive=true);

template<class GT>
EdgeList mapVertexListToEdgeList(const VGraph<GT> & graph, const std::vector<int>& versions, const GraphList<VertexU<GT>>& vertexList, bool restrictive=true);

template<class GT>
std::pair<std::vector<typename GT::Index>, std::vector<typename GT::Index> > indexPartitionOverlap(const VGraph<GT> & G, std::vector<int> versions);


template<class GT>
GraphList<VertexS<GT>> edgeListToVertexList(const EdgeList & edgeList)
{
    GraphList<VertexS<GT>> retVal;
    
    std::vector<typename GT::Index> nodes;
    
    for(auto e : edgeList.getElements())
    {
        nodes.push_back(e.index1_);
        nodes.push_back(e.index2_);
    }
    std::sort(nodes.begin(), nodes.end());
    auto itend = std::unique(nodes.begin(), nodes.end());

    for(auto it=nodes.begin(); it!=itend; ++it)
    {
        retVal.push_back(VertexS<GT>(*it, 0));
    }
    
    
    return retVal;
}

//TODO: Optimize to include labels better
template<class GT>
EdgeList mapVertexListToEdgeList(const VGraph<GT>& graph, int version, const GraphList<VertexU<GT>>& vertexList, bool restrictive)
{    
    EdgeList retVal(graph.getContext());

    std::set<typename GT::Index> nodesUsed;
    for(const auto& e : vertexList.getElements())
        nodesUsed.insert(e.index_);
    
    for(auto e : vertexList.getElements())
    {
        
        auto AJA = graph.template getRowVersion<Row::AJA>(e.index_, version);
        auto L = graph.template getRowVersion<Row::L>(e.index_, version);
        
        auto itPair = std::make_pair(AJA.second.begin(), AJA.second.end()); //graph.getOutgoingNodes(e.index_, version);
        auto itPairVal =  AJA.first.begin(); //graph.getOutgoingValues(e.index_, version).first;
        auto itPairLabel = L.begin();
        
        
        for(auto it=itPair.first; it!=itPair.second; ++it)
        {
            if(!restrictive || nodesUsed.find(*it)!=nodesUsed.end())
                retVal.push_back(EdgeElement<GT>{e.index_,*it, *itPairVal, *itPairLabel});
            ++itPairVal;
            ++itPairLabel;
        }
    }
    //std::cout<<retVal<<std::endl;
    return retVal;
}

//TODO BUG: MAKE THIS SO IT CAN TAKE INTERSECTIO NOF EDGES OR UNION ALSO REWRITE 
template<class GT>
GraphList<EdgeElement<GT>> mapVertexListToEdgeList(const VGraph<GT> & graph, const std::vector<typename GT::VersionIndex>& versions, const GraphList<VertexU<GT>>& vertexList, bool restrictive)
{
    GraphList<EdgeElement<GT>> retVal(graph.getContext());
    
    std::set<typename GT::Index> nodesUsed;
    for(const auto& e : vertexList.getElements())
        nodesUsed.insert(e.index_);
    
    auto par = indexPartitionOverlap(graph, versions);
    
    for(const auto& e : par.first)
    {
        auto AJA =  graph.template getRowVersion<Row::AJA>(e, versions[0]);
        

        auto itPair = std::make_pair(AJA.second.begin(), AJA.second.end()); //graph.getOutgoingNodes(e.index_, version);
        auto itPairVal =  AJA.first.begin(); //graph.getOutgoingValues(e.index_, version).first;
        
        
        for(auto it=itPair.first; it!=itPair.second; ++it)
        {
            if(!restrictive || (nodesUsed.find(*it)!=nodesUsed.end()))
            {
                //std::cout<<"IT"<<std::endl;
                retVal.push_back(Edge{e,*it, *itPairVal});
            }
            ++itPairVal;
        }
    }

    for(const auto& e : par.second)
    {
        for(const auto& version : versions)
        {
            auto AJA = graph.template  getRowVersion<Row::AJA>(e, version);
            
            auto itPair = std::make_pair(AJA.second.begin(), AJA.second.end()); //graph.getOutgoingNodes(e.index_, version);
            auto itPairVal =  AJA.first.begin(); //graph.getOutgoingValues(e.index_, version).first;
        
            
            
            for(auto it=itPair.first; it!=itPair.second; ++it)
            {
                if(!restrictive || (nodesUsed.find(*it)!=nodesUsed.end()))
                {
                   // std::cout<<"IB"<<std::endl;
                    retVal.push_back(Edge{e,*it, *itPairVal});
                }
                ++itPairVal;
            }
        }
    }

     return retVal;
}

template<class GT>
std::pair<std::vector<typename GT::Index>, std::vector<typename GT::Index> > indexPartitionOverlap(const VGraph<GT> & G, std::vector<int> versions)
{
    std::vector<typename GT::Index> overlap;
    std::vector<typename GT::Index> notOverlap;

    typename GT::Index numNodes =  G.size(0).nodes_; //NOTE: For some reason this is recalculated every iteration if set inside for loop
    for( typename GT::Index i=0; i<numNodes; ++i)
    {
        //cout<<i<<endl;
        auto v1 = G.getIA(versions[0])[i];
        bool allEqual=true;
        for(int j=1; j<versions.size(); ++j)
        {
            if(G.getIA(versions[j])[i] != v1)
            {
                allEqual=false;
                break;
            }
        }
        if(allEqual)
            overlap.push_back(i);
        else
            notOverlap.push_back(i);
    }
    
    return std::make_pair(overlap, notOverlap);
}
