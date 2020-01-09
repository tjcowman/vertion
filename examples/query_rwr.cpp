#include "vertion.h"
#include "query/RandomWalker.h"
#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex0.vgraph");
    std::cout<<G.size()<<"\n";
    
    RandomWalker RWR(G);
    std::cout<<RWR.walk(VertexListCalc(), 0)<<"\n";
    std::cout<<RWR.walk(VertexListCalc(), 1)<<"\n";
    std::cout<<RWR.walk(VertexListCalc(), 2)<<"\n";
    
}
