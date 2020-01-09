#include "vertion.h"
#include "query/Components.h"
#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex0.vgraph");
    std::cout<<G.size()<<"\n";
    
    Components CMP(G);
    
    CMP.compute(2);
    std::cout<<CMP<<"\n";
}
