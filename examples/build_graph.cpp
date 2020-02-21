#include "vertion.h"
#include <iostream>

int main()
{
    //Graph 0
    Graph G(Context::undirected);
    GraphIO IO(G);
    
    G.addEdgeLabel("EL0");
    G.addVertexLabel("NL0");

     
    G.addNodes("input/text/ex0.nodelist", VertexLab(0));
    
    G.setEmptyInitialVersion();

    
    EdgeList edges1 = G.indexNewEdges("input/text/ex0_0.edgelist");
    edges1.labelEdges(0);
    G.insertEdges(edges1, 0, {"name:v1"}, Context::undirected );

   
    EdgeList edges2 = G.indexNewEdges("input/text/ex0_1.edgelist");
    edges2.labelEdges(0);
    G.insertEdges(edges2, 1, {"name:v2"}, Context::undirected );
    

    IO.write_serial("input/graph/ex0.vgraph");
    
    
    //Graph 1
    Graph G2(Context::undirected);
    GraphIO IO2(G2);

    G2.addEdgeLabel("EL1");
    G2.addVertexLabel("NL1");
    G2.addNodes("input/text/ex1.nodelist", VertexLab(0));
    G2.setEmptyInitialVersion();
    EdgeList edges1_2 = G2.indexNewEdges("input/text/ex1_0.edgelist");
    edges1_2.labelEdges(0);
    G2.insertEdges(edges1_2, 0, {"name:v1"}, Context::undirected );
    IO2.write_serial("input/graph/ex1.vgraph");
    
    
    //Graph2
    Graph G3(Context::undirected);
    GraphIO IO3(G3);
    G3.addEdgeLabel("EL1");
    G3.addEdgeLabel("EL2");
    G3.addVertexLabel("NL1");
    G3.addNodes("input/text/ex2.nodelist", VertexLab(0));
    G3.setEmptyInitialVersion();
    EdgeList edges2_1 = G3.indexNewEdges("input/text/ex2_0.edgelist");
    edges2_1.labelEdges(0);
    G3.insertEdges(edges2_1, 0, {"name:v1"}, Context::undirected );
    
    EdgeList edges2_2 = G3.indexNewEdges("input/text/ex2_1.edgelist");
    edges2_2.labelEdges(1);
    G3.insertEdges(edges2_2, 1, {"name:v2"}, Context::undirected );
    
    IO3.write_serial("input/graph/ex2.vgraph");
    
    return 0;
}
