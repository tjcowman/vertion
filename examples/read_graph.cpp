#include "vertion.h"
#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex0.vgraph");
    
    for(int i=0; i<G.size().versions_; ++i)
    {
        std::cout<<G.getEdgeList(i)<<"\n";
    }
    return 0;
}
