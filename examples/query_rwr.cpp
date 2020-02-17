#include "vertion.h"
#include "query/RandomWalker.h"
#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex0.vgraph");
    std::cout<<G.size()<<"\n";
    
    IntegratedViewer IV(G);
    
    RandomWalker RWR(IV);
    IV.viewUnion({1});
    std::cout<<RWR.walk(VertexListCalc(), 0)<<"\n";
    IV.viewUnion({2});
    std::cout<<RWR.walk(VertexListCalc(), 0)<<"\n";
    IV.viewUnion({1,2});
    std::cout<<RWR.walk(VertexListCalc(), 0)<<"\n";
 
    
}
