#include "vertion.h"
#include "query/Extractor.h"
#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex1.vgraph");
    std::cout<<G.size()<<"\n";
    
    Extractor EX(G);
    
    auto [G2, indexMap] = EX.extractVersion(2);
    
    std::cout<<G2.size()<<"\n";
}
