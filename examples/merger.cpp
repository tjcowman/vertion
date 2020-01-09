#include "vertion.h"
#include "Merger.h"
#include <iostream>

int main()
{
    Graph G0(Context::undirected);
    Graph G1(Context::undirected);
    GraphIO IO0(G0);
    GraphIO IO1(G1);

    IO0.read_serial("input/graph/ex0.vgraph");
    IO1.read_serial("input/graph/ex1.vgraph");
    std::cout<<G0.size()<<"\n";
    std::cout<<G1.size()<<"\n";

    Merger M(G0,G1);
    
    auto G3 = M.merge();
    std::cout<<G3.size()<<"\n";
    
//     for(const auto& e : G3.edgeLabelNames_)
//         std::cout<<e<<std::endl;
    for(int i=0; i<G3.size().versions_; ++i)
        std::cout<<G3.getEdgeList(i);
    
}



