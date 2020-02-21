#include "vertion.h"
#include "motifs/Triangles.h"
#include "query/IntegratedViewer.h"
#include <iostream>

int main()
{
    Graph G(Context::undirected);
    GraphIO IO(G);

    IO.read_serial("input/graph/ex2.vgraph");
    std::cout<<G.size()<<"\n";
    
    IntegratedViewer IV(G);
    IV.viewUnion({2});
    
    Triangles TR(IV);
   
   
   TR.enumerate();
   auto m = TR.countMotifs();
    
   for(const auto& e : m)
   {
       for(const auto& ee : e.first)
            std::cout<<ee<<" ";
       
       std::cout<<" :"<<e.second<<"\n";
   }
    
}
