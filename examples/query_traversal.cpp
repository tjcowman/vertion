#include "vertion.h"
#include "query/Traversal.h"
#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex0.vgraph");
    std::cout<<G.size()<<"\n";
    
    Traversal TR(G, VertexListInt(VertexInt(3)));
    
    TR.traverse(2);
    
    std::cout<<TR.getVertexList()<<"\n";
} 
