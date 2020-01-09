#pragma once

/*Sets the max number of uncompressed IA vectors to store in cache. Resizing is not implemented yet. */
//TODO: Move to a Graph Input Parameter
#define INITIAL_CACHE_SIZE 100


struct VertexType
{
    friend std::istream& operator>>(std::istream & is, VertexType& e)
    {
        is>>e.name_;
        return is;   
    }
    
    friend std::ostream& operator<<(std::ostream & os, const VertexType& e)
    {
        os<<e.name_;
        return os;   
    }
    
    std::string name_;
};

/* Definitions for different initial graph parameters
 * 
 */
namespace GraphType
{
    class GD 
    {
        public:
            static const int LabelSize = 8;
            using Calc = double;
            
            
            using VersionIndex = int;
            using Index=int32_t;
            using Value=float;
            using VertexInternal= VertexType;
    };
}

using Index = GraphType::GD::Index;
using VersionIndex = GraphType::GD::VersionIndex;

#include "core/Labels.h"
using VertexLab = VertexLabel<GraphType::GD>;
using EdgeLab = EdgeLabel<GraphType::GD>;

#include "core/GraphListElements.h"
using Edge = EdgeElement<GraphType::GD>; 
using Vertex = VertexS<GraphType::GD>;
using VertexInt = VertexI<GraphType::GD>;
using VertexCalc = VertexHP<GraphType::GD>;
using VertexUnw = VertexU<GraphType::GD>;

#include "core/GraphList.h"
using EdgeList = GraphList<Edge>;
//using VertexList = GraphList<Vertex>;
using VertexListInt = GraphList<VertexInt>;
using VertexListUnw = GraphList<VertexUnw>;
using VertexListCalc = GraphList<VertexCalc>;

#include "core/VGraph.h"
using Graph = VGraph<GraphType::GD>;

#include "core/GraphLists.h" //Needs more accurate name


/*Graph input output and querying*/
#include "core/VGraphIO.h"
using GraphIO = VGraphIO<GraphType::GD>;
