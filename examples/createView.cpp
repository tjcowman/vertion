#include "vertion.h"
#include "query/IntegratedViewer.h"

#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex2.vgraph");
    std::cout<<G.size()<<"\n";
    
    IntegratedViewer IV(G);
    IV.buildView(std::vector<Index>({2}), VertexLab(), EdgeLab());
    IV.describe(std::cout);
    
    IV.buildView(std::vector<Index>({2}), VertexLab(), EdgeLab(1));
    IV.describe(std::cout);
    
//     IV.viewUnion({2});
    
 
   
}

