#include "vertion.h"
#include "motifs/Triangles.h"
#include "query/IntegratedViewer.h"
#include "query/RandomWalker.h"
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
   
   //Run the motif find on rwr topk subset
   RandomWalker RW(IV);
   auto topk = RW.walk(VertexListCalc()).sort(Sort::valueDec);
   
   std::cout<<topk<<std::endl;
   topk.resize(4);
   std::cout<<topk<<std::endl;
   
   Triangles TR2(IV);
   TR2.enumerateFiltered(topk);
    auto m2 = TR2.countMotifs();
    
   for(const auto& e : m2)
   {
       for(const auto& ee : e.first)
            std::cout<<ee<<" ";
       
       std::cout<<" :"<<e.second<<"\n";
   }
   
}
