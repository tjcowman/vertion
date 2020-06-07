
#include "vertion.h"
#include "BiMap.h"
#include "KinasePaths.h"
#include "query/Traversal_View.h"
#include "query/RandomWalker.h"
#include "motifs/Triangles.h"
#include "KinasePaths.h"
#include <iostream>


struct Args{
  std::string phosFile="";
  std::string uniprotNames="";
  std::string graph="";
  std::vector<int> vs; //int v=0;
  std::string source ="";
  std::vector<std::string> sinks;
  std::string out ="tmp";
  
  float minSiteFold = 0;
};



//Compute the traveral from the provided sink id to the the provided sinks, note that the indexes should be given based on the global not integrated
void computeTraversal( IntegratedViewer<GraphType::GD> IV, typename GraphType::GD::Index sourceIndex, GraphList<VertexI<GraphType::GD>> sinks, std::string manualLabel, std::ofstream& OUT)
{
    auto source = IV.getViewIndex(sourceIndex);
    
    GraphList<VertexI<GraphType::GD>> viewSinks;
    for(auto& e : sinks)
    {
        auto viewIndex = IV.getViewIndex(e.index_);
        if(viewIndex !=  GraphType::GD::invalidIndex)
        {
            viewSinks.push_back( VertexI<GraphType::GD>(viewIndex,e.value_));
        }
    }
   std::cout<<"VS SIZE "<<viewSinks.size()<<std::endl;

   //Compute the restart vector
    
    //compute the rwr from sinks
    RandomWalker<GraphType::GD> RW(IV);
    typename RandomWalker<GraphType::GD>::Args_Walk args_walk{.15, 1e-8, GraphList<VertexS<GraphType::GD>>()};
    auto res = RW.walk(viewSinks, args_walk);
    
    //normalize the rwr by the node degree
    auto degrees = IV.getDegrees();
    
    for(size_t i=0; i< res.size(); ++i)
    {
        res[i].value_=res[i].value_/degrees[i].value_;
    }
    
    
    //map the new weights to the Integrated version
    for(GraphType::GD::Index row=0; row<IV.size().first; ++row)
    {
        typename GraphType::GD::Index lb = IV.IA_[row].s1();
        typename GraphType::GD::Index rb = IV.IA_[row].s1() + IV.IA_[row].s2();
        
        for(typename GraphType::GD::Index edge=lb; edge<rb; ++edge)
            IV.A_[edge] = -log((((res[row].value_ + res[IV.JA_[edge]].value_)/2)));
    }
    
//     std::cout<<"AFTER "<<std::endl;
    
    
    Traversal<GraphType::GD> T(IV);
    auto SP = T.shortestPathsWeighted(source, viewSinks);
    
    for(const auto& e : SP.getElements())
       OUT<<IV.graph_->getID(IV.getOriginalIndex(e.index1_))<<"\t"<<IV.graph_->getID(IV.getOriginalIndex(e.index2_))<<"\t"<<e.value_<<"\t"<<e.labels_.getBits().to_ulong()<<"\t"<<manualLabel<<"\n";
}

void computePaths(IntegratedViewer<GraphType::GD> IV, typename GraphType::GD::Index sourceIndex, GraphList<VertexI<GraphType::GD>> sinks, std::string manualLabel, std::ofstream& OUT)
{ 
    //Convert source and sinks to the viewIndexes
    auto source = IV.getViewIndex(sourceIndex);
    GraphList<VertexI<GraphType::GD>> viewSinks;
    for(auto& e : sinks)
    {
        auto viewIndex = IV.getViewIndex(e.index_);
        if(viewIndex !=  GraphType::GD::invalidIndex)
        {
            viewSinks.push_back( VertexI<GraphType::GD>(viewIndex,e.value_));
        }
    }
   std::cout<<"VS SIZE "<<viewSinks.size()<<std::endl;

    //map the new weights to the Integrated version (zero weight )
    for(GraphType::GD::Index row=0; row<IV.size().first; ++row)
    {
        typename GraphType::GD::Index lb = IV.IA_[row].s1();
        typename GraphType::GD::Index rb = IV.IA_[row].s1() + IV.IA_[row].s2();
        
        for(typename GraphType::GD::Index edge=lb; edge<rb; ++edge)
            if((IV.L_[edge].getBits() & std::bitset<GraphType::GD::LabelSize>(6)).any())
                IV.A_[edge] = .00001;
            //IV.A_[edge] = -log((((res[row].value_ + res[IV.JA_[edge]].value_)/2)));
    }
    
    Traversal<GraphType::GD> T(IV);
    auto SP = T.shortestPathsWeighted(source, viewSinks);
    
    
  /*  
    //expand and get triangles?
    Traversal NB(IV,edgeListToVertexList(SP));
    NB.expand();
    
    auto Tri =  Triangles(IV);
    Tri.enumerateFiltered(NB.getVertexList());
    auto motifs = Tri.countMotifs();
    
    for(const auto & e : motifs)
        std::cout<<e.first[0]<<" "<<e.first[1]<<" "<<e.first[2]<<" : "<<e.second<<std::endl;*/
    
    
    for(const auto& e : SP.getElements())
       OUT<<IV.graph_->getID(IV.getOriginalIndex(e.index1_))<<"\t"<<IV.graph_->getID(IV.getOriginalIndex(e.index2_))<<"\t"<<e.value_<<"\t"<<e.labels_.getBits().to_ulong()<<"\t"<<manualLabel<<"\n";
   
}

auto getProteinVectors( const ParseVector<Phos>& parsedFile)
{
  std::vector<std::string> sinksPos;
  std::vector<std::string> sinksNeg;

  for(const auto& e : parsedFile)
  {
    if(e.score>0)
    sinksPos.push_back(e.name);
    else
      sinksNeg.push_back(e.name);
  }
  std::sort(sinksPos.begin(),sinksPos.end());
  auto last = std::unique(sinksPos.begin(), sinksPos.end());
  sinksPos.erase(last,sinksPos.end());

  std::sort(sinksNeg.begin(),sinksNeg.end());
  last = std::unique(sinksNeg.begin(), sinksNeg.end());
  sinksNeg.erase(last,sinksNeg.end());

  return std::make_pair(sinksPos,sinksNeg);
}

GraphList<VertexI<GraphType::GD>> convertNamesToVertexList(const IntegratedViewer<GraphType::GD>& IV, const std::vector<std::string>& names)
{
  GraphList<VertexI<GraphType::GD>> ids;
  for(const auto& e : names)
  {
    auto graphIndex = IV.graph_->lookupVertex(e);
    if(graphIndex != GraphType::GD::invalidIndex)
    {
     // auto viewIndex = IV.getViewIndex(graphIndex);
      //if(viewIndex !=  GraphType::GD::invalidIndex)
      {
         ids.push_back( VertexI<GraphType::GD>(graphIndex));
      }
    }
  }
  return ids;

}

int main(int argc, char* argv[])
{
    ARGLOOP(,
      ARG(phosFile,)
      ARG(graph,)
      ARG(uniprotNames,)
      ARG(source,)
      ARG(vs,stringToIntegerVector<int>)
      ARG(sinks, stringToStringVector)
      ARG(out, )
      ARG(minSiteFold, stof)
    );

    //Load the graph file and generate the requested integrated view
    Graph G(Context::undirected);
    GraphIO IO(G);
    IO.read_serial(args.graph); //(uniprot, Name)
   // std::cout<<G.size()<<"\n";
    IntegratedViewer<GraphType::GD> IV(G);
    IV.buildView(args.vs,  VertexLabel<GraphType::GD>::maskAll(),  EdgeLabel<GraphType::GD>::maskAll());

    //Convert the source protein name to a graph node Index
    BiMap uniprotNames(args.uniprotNames);
    auto sourceIndex = G.lookupVertex(uniprotNames.findr(args.source)->second);

    //Get the protein uniprot names as a vector
    ParseVector<Phos> phos(args.phosFile);
    
    GraphList<VertexS<GraphType::GD>> sinkList;
    std::set<typename GraphType::GD::Index> usedIndexes;
    for(const auto& e : phos)
    {
        auto graphIndex = G.lookupVertex(e.name);
        if(graphIndex != GraphType::GD::invalidIndex)
        {
            sinkList.push_back(VertexS<GraphType::GD>(graphIndex, e.score));
            usedIndexes.insert(graphIndex);
        }
    }
    
    
    KinasePaths KP(IV);
    KP.arg_minWeight_ = args.minSiteFold;
    
    sinkList.sort(Sort::indexInc);
    KP.compute(VertexI<GraphType::GD>(sourceIndex), sinkList);
    //KP.printPathEdgeLists(std::cout);
    KP.printPathJson(std::cout);
    exit(0);
    
    
    
    
    /*
    auto sPos =  sinkList.select([args](const auto& e ){return e.value_ > args.minSiteFold;}).reduce(Reduce::mean);
    //std::cout<<sPos<<std::endl;
    
    
    
    
    auto sNeg =  sinkList.select([args](const auto& e ){return e.value_ < -args.minSiteFold;});
    
    sNeg.elementApply([](auto& e ){e.value_= std::abs(e.value_);}).reduce(Reduce::mean);
    

    */
    
    sinkList = sinkList.select([args](const auto& e ){return std::abs(e.value_) > args.minSiteFold;}).reduce(Reduce::mean);
   
    
    std::ofstream out(args.out+".txt");
     out<<"source"<<"\t"<<"target"<<"\t"<<"paths"<<"\t"<<"labels"<<"\t"<<"extra"<<std::endl;
    computePaths(IV, sourceIndex, sinkList, "pathTest", out);
    
    
    //makes the nodelist for sinks
//     std::ofstream nout(args.out+".txt.nodes");
//     nout<<"name\tposWeight\tnegWeight\tmaxWeight\tprimary\n";
//     for(const auto& e : usedIndexes)
//     {
//         auto pw = sPos.lookupIndex(e)->value_;
//         auto nw = sNeg.lookupIndex(e)->value_;
//         nout<<G.getID(e)<<"\t"<<pw<<"\t"<<nw<<"\t"<<std::max(pw,nw)<<"\t";
//         
//         if(pw>nw)
//             nout<<"pos";
//         else
//             nout<<"neg";
//         
//         nout<<"\n";
//     }
//     
    
    
//     std::cout<<"SL :"<<sinkList.size()<<" POS: "<<sPos.size()<<" NEG: "<<sNeg.size()<<std::endl;
//    // std::cout<<sPos<<std::endl;
//      
// 
//     std::ofstream out(args.out+".txt");
//      out<<"source"<<"\t"<<"target"<<"\t"<<"paths"<<"\t"<<"labels"<<"\t"<<"phosDirection"<<std::endl;
//      computePaths(IV, sourceIndex, sPos, "pos", out);
//      computePaths(IV, sourceIndex, sNeg, "neg", out);
//     
// 
// //     
//     out<<"source"<<"\t"<<"target"<<"\t"<<"paths"<<"\t"<<"labels"<<"\t"<<"phosDirection"<<std::endl;
//     computeTraversal(IV, sourceIndex, sPos, "pos", out);    
//     computeTraversal(IV, sourceIndex, sNeg, "neg", out);    
//     


}
