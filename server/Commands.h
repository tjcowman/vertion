#pragma once
#include "vertion.h"
#include "ViewCache.h"

#include <nlohmann/json.hpp>

#include <algorithm>
#include <chrono>
using json = nlohmann::json;

template<class GT>
ViewKey<GT> viewKeyFromArgs(const json& args)
{
    try
    {
        std::vector<typename GT::VersionIndex> versions = args.at("versions").get<std::vector<typename GT::VersionIndex>>();
        std::vector<typename GT::Index> vertexLabels = args.at("vertexLabels").get<std::vector<typename GT::Index>>();
        std::vector<typename GT::Index> edgeLabels = args.at("edgeLabels").get<std::vector<typename GT::Index>>();
        return(ViewKey<GT>(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)));
    }
    catch (json::exception& e)
    {
     
        return ViewKey<GT>();
    }
    
    
    
}

/* 
 * Gets a vertex list from an array of passed indexes 
 */
template<class GT> 
GraphList<VertexS<GT>> getVertexList(const std::string& key, const json& j )
{
    GraphList<VertexS<GT>> L;
    auto indexes = j[key].template get<std::vector<typename GT::Index>>();
    
    for(const auto& e : indexes)
        L.push_back(VertexS<GT>(e));
    
    return L;
}


namespace Commands
{
//TODO: send labels
    //Takes an array of string identifiers and returns the correpsonding index or not found
    template<class GT>
    json lkpn(const VGraph<GT>& graph, const json& args)
    {
        std::vector<std::string> names = args["names"].get<std::vector<std::string>>();

        json ret;

        for(const auto& e : names)
        {
            auto id = graph.lookupVertex(e);
            if(id != GT::invalidIndex)
                ret.push_back({{"id",id},{"l", graph.getVertexData().lookupLabels(id).getBits().to_ulong()}});
            else
                  ret.push_back({{"id",-1}});

        }
        return ret;
    }

    template<class GT>
    json lkpi(const VGraph<GT>& graph, const json& args)
    {
        std::vector<typename GT::Index> ids = args["ids"].get<std::vector<typename GT::Index>>();
// std::cout<<"l1"<<std::endl;
        json ret;
        for(const auto& id : ids)
        {
            auto alternateMapping = graph.alternateMapping_.findf(id);
            std::string aMap = alternateMapping != graph.alternateMapping_.end() ?  alternateMapping->second : "";
            
            ret.push_back({
                {"name", graph.lookupVertex(id)},
                {"pname", aMap}, // graph.alternateMapping_.findf(id)->second}, 
                {"l", graph.getVertexData().lookupLabels(id).getBits().to_ulong()} 
                
            });
        }
        
        return ret;
    }

    template<class GT>
    json ls(const VGraph<GT>& graph, const json& args)
    {
        json ret;

        auto jsArr = json::array();


        //Version data
        for(typename GT::VersionIndex i=0; i< graph.size().versions_; ++i)
        {
            json js;
            js["index"] = i;
            js["tags"] = (graph.getTags().lookup(i));
            js["name"] = graph.getTags().getName(i);

            jsArr.push_back(js);
        }

        //labels
        json labels;
        labels["vertex"]["names"] = graph.getVertexLabels();
        for(int i=0; i<labels["vertex"]["names"].size(); ++i)
            labels["vertex"]["url"].push_back( graph.getVertexData().lookupURL(i));//"test";


        labels["edge"] = graph.getEdgeLabels();

        //Need form [{"id":0, "name":"...", "labels":[0,1,1] }]
        auto vertexData=json::array();

        //Consolidating
        ret["nodes"] = graph.size(0).nodes_;
//         ret["vertexData"] = vertexData;
        ret["versions"] = jsArr ;
//         ret["tree"] = jsArr2;
        ret["labels"] = labels;
        ret["vertexData"];

        ret["serverProps"] = graph.getServerProps();

        //for(const auto& e : graph.getVersionsData())
        for(typename GT::VersionIndex i=0; i<graph.getVersionsData().size(); ++i)
        {
            ret["labelsUsed"]["nodes"].push_back( graph.getVersionsData()[i].vertexLabelsUsed_.getBits().to_ulong());
            ret["labelsUsed"]["edges"].push_back( graph.getVersionsData()[i].edgeLabelsUsed_.getBits().to_ulong());
        }

// //         std::cout<<ret<<std::endl;
        return ret;
    }


    template<class GT>
    json rwr2(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        json retVal;


        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        
        
        auto start = std::chrono::high_resolution_clock::now();

        IntegratedViewer<GT> IV = viewCache.lookup(key);
//         std::cout<<IV.getEdgelist()<<std::endl;
        

       auto source  = GraphList<VertexS<GT>>(  std::vector<VertexS<GT>>(args.at("source")) );
        //Convert the globalIndex to the viewIndexes
        for(auto& e : source.getElements())
            e.index_ = IV.getViewIndex(e.index_);

        source = source.select([](const auto& e){return e.index_ != GT::invalidIndex;});




        auto duration = std::chrono::high_resolution_clock::now() - start;
        long long tIntegrateUs = std::chrono::duration_cast<std::chrono::microseconds>(duration).count();

        std::cout<<"finished lookup"<<std::endl;
//         retVal["viewHash"] = viewCache.generate_uid(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels));

        RandomWalker<GT> RW(IV);

        typename RandomWalker<GT>::Args_Walk args_walk{args.at("alpha"), args.at("epsilon"), GraphList<VertexS<GT>>()};

        start = std::chrono::high_resolution_clock::now();
//         auto res = Walk<GT>().setHeader("{}");//RW.walk(GraphList<VertexS<GT>>(source), args_walk); //TODO reen
        auto res = RW.walk(source, args_walk);
        std::cout<<"Walked"<<std::endl;
        duration = std::chrono::high_resolution_clock::now() - start;
        long long tcomputeUs = std::chrono::duration_cast<std::chrono::microseconds>(duration).count();

        viewCache.finishLookup(key);

        res.sort(Sort::valueDec);
        res.resize(std::min(size_t(args.at("topk")), res.size()));

// std::cout<<"res size "<<res.size()<<std::endl;
// std::cout<<res<<std::endl;
        
        if(args.at("mode") == "nl")
        {
             retVal["nodes"] = json::array();

            for(size_t i=0; i<std::min(size_t(args.at("topk")), res.size()); ++i)
            {
                retVal["nodes"] +=  {{"id",  IV.getOriginalIndex(res[i].index_)}, {"value", res[i].value_}};
            }
        }
        else if(args.at("mode") == "el")
        {
            retVal["nodes"] = json::array();
            retVal["edges"] = json::array();

            GraphList<EdgeElement<GT>> edges = IV.mapVertexes(res);
            for(size_t i=0; i<res.size(); ++i)
            {
                retVal["nodes"] +=  {{"id",  IV.getOriginalIndex(res[i].index_)}, {"value", res[i].value_}};
            }
            for(const auto& e : edges)
            {
                retVal["edges"] += {{"id1", IV.getOriginalIndex(e.index1_)}, {"id2", IV.getOriginalIndex(e.index2_)}, {"value",e.value_}, {"labels",e.labels_.getBits().to_ulong()}};
            }
        }

//         viewCache.lookupDone(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)) ;
//         std::cout<<args<<"Query Finished"<<std::endl;

        //Populate the debug info
        retVal["debug"]["rwr"] = json::parse(res.getHeader()); //Json formatted string
        retVal["debug"]["timing"] = {{"integrate",tIntegrateUs}, {"compute",tcomputeUs}};

        auto viewSize = IV.size();
        retVal["debug"]["rwr"]["nodes"] = viewSize.first;
        retVal["debug"]["rwr"]["edges"] = viewSize.second;


        return retVal;
    }

    template<class GT>
    json lsv(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        json retVal;

        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        if(!key.valid())
            retVal =   json{{"error", "invalid view"}};
            
        else
        {
            IntegratedViewer<GT> IV = viewCache.lookup(key);
            retVal = viewCache.getViewSummary(key.key_);
            viewCache.finishLookup(key);
            
        }
        
        return retVal;
    }

    template<class GT>
    json mft(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        json ret;

        std::vector<typename GT::VersionIndex> versions = args["versions"].get<std::vector<typename GT::VersionIndex>>();
        IntegratedViewer<GT> IV(graph);
        IV.viewUnion(versions);




         RandomWalker<GT> RW(IV);
         std::vector<VertexS<GT>> source  = (args["source"]);
        //specifiy arguments
        typename RandomWalker<GT>::Args_Walk args_walk{args["alpha"], args["epsilon"], GraphList<VertexS<GT>>()};


        auto filterRes = RW.walk(GraphList<VertexS<GT>>(source), args_walk);
        filterRes.sort(Sort::valueDec);
        filterRes.resize(std::min(size_t(args["topk"]), filterRes.size()));


        Triangles TR(IV);





        TR.enumerateFiltered(filterRes);
        auto m = TR.countMotifs(); //map<array<labels>, count>

        ret["motifs"] = {};
        for(const auto& e : m)
        {
            std::vector<u_long> pattern;
            for(auto ee : e.first)
                pattern.push_back(ee.getBits().to_ulong());
            ret["motifs"] += {{"pattern", pattern }, {"count",e.second}};
        }
        return ret;
    }
    
    
    struct Phos{
        std::string name;
        int pos;
        float score;

        friend std::istream& operator>>(std::istream& is, Phos& e)
        {
            is>>e.name>>e.pos>>e.score;
            return is;
        }
    };
    
    template<class GT>
    GraphList<VertexS<GT>> parsePathSites(const BiMap<typename GT::Index, std::string>& idLookupMap, const json& siteArgs){
        
//       Check the number of columns, if 3, assume middle is sitebp and last is score
        try
        {
            bool nameOnly = siteArgs[0].size() ==1;
            bool scoreOnly = siteArgs[0].size() ==2;
            
            GraphList<VertexS<GT>> sinkList;
            
            if(nameOnly)
            {
                for(const auto& e : siteArgs)
                {
                    auto graphIndex = idLookupMap.findr(e[0]);
                    
                    if(graphIndex !=  idLookupMap.endr())
                        sinkList.push_back(VertexS<GT>(graphIndex->second, 1));
                }
            }
            else if(scoreOnly)
            {
                for(const auto& e : siteArgs)
                {
                    auto graphIndex = idLookupMap.findr(e[0]);
                    
                    if(graphIndex !=  idLookupMap.endr())
                        sinkList.push_back(VertexS<GT>(graphIndex->second, e[1]));
                }
            }
            else
            {
                for(const auto& e : siteArgs)
                {
                    auto graphIndex = idLookupMap.findr(e[0]);
                    if(graphIndex != idLookupMap.endr())
                        sinkList.push_back(VertexS<GT>(graphIndex->second, e[2]) );
                }
                
            }
            
            return sinkList;
        }
        catch (json::exception& e)
        {
             return GraphList<VertexS<GT>>();
        }
        
    }

    template<class GT>
    json pths(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        json ret;
        ret ["trees"] = json::array();
        
        auto sourceNames = (args["kinase"].get<std::vector<std::string>>());
       
        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
       
        
        if(!key.valid())
        {
            for(const auto& e : sourceNames)
                ret["trees"].push_back(json::array());
            return ret;   
        }
        
        IntegratedViewer<GT> IV = viewCache.lookup(key);
        
        KinasePaths KP(IV);
        KP.arg_mechRatio_ = args["mechRatio"];
        
        
        if(args["sites"].size() == 0)
        {
            for(const auto& e : sourceNames)
                ret["trees"].push_back(json::array());
            return ret;
        }
            
        GraphList<VertexS<GT>> sinkList = parsePathSites<GT>(graph.getVertexData().getBiMap(), args["sites"]);
            
        if(sinkList.size() == 0)
        {
            for(const auto& e : sourceNames)
                ret["trees"].push_back(json::array());
            return ret;
        }
        
        //std::vector<VertexI<GT>> kinaseList;
       GraphList<VertexS<GT>> kinaseList;
        

        for(const auto& e : sourceNames)
            kinaseList.push_back(VertexI<GT>( graph.lookupVertex(e)));


        sinkList.sort(Sort::indexInc);
        
        KP.compute(kinaseList, sinkList);
        viewCache.finishLookup(key);
   // std::cout<<"CMPTED"<<std::endl;    
        
        for(const auto& tree : KP.getPaths())
        {
            int pNum=0;
            auto mainTree = json::array();
            for(const auto& path : tree)
            {
                 //Make sure there was a path
                if(path.visitOrder_.size()>0)
                {
                    mainTree[pNum]["nodeScore"] = path.nodeScore_;
                    mainTree[pNum]["direction"] = path.nodeDirection_;
                    mainTree[pNum]["nodes"] = std::vector<int>(); 
                    mainTree[pNum]["edgeLabels"] = std::vector<long>();
                    
                    mainTree[pNum]["totalWeight"] = path.totalWeight_;
                    
                    for(const auto & e : path.visitOrder_)
                        mainTree[pNum]["nodes"].push_back(e);
                    
                    for(const auto& e : path.edgeLabels_)
                        mainTree[pNum]["edgeLabels"].push_back(e.getBits().to_ulong());
                    
                    ++pNum;
                }
            }
            ret["trees"].push_back( mainTree);
        }
            

        return ret;
    }
    
    template<class GT>
    json validation(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
           json ret = json::array();
           return ret;
    }
    
    
    
    template<class GT>
    json sitee(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        json ret;
        ret ["trees"] = json::array();
         
        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        if(!key.valid())
        {
            return ret;   
        }
        IntegratedViewer<GT> IV = viewCache.lookup(key);
        
        RandomWalker RW(IV);
        auto pathIndexs  = args["pathNodes"].get<std::vector<typename GT::Index>>();
        std::vector<VertexS<GT>> source;
        for(const auto & e : pathIndexs)
            source.push_back(VertexS<GT>(e));
        
        //specifiy arguments
        typename RandomWalker<GT>::Args_Walk args_walk{.15, 1e-6, GraphList<VertexS<GT>>()};
        auto weights = RW.walk(GraphList<VertexS<GT>>(source), args_walk);
         
        //use wieghts to bias the nee path computation 
        
        KinasePaths<GT> KP(IV);
        KP.arg_mechRatio_ = args["mechRatio"];

    
        auto sources = getVertexList<GT>("sources", args);
        auto sinks = getVertexList<GT>("sink", args);

        KP.computeSiteE(sources, sinks, weights);
        viewCache.finishLookup(key);
   // std::cout<<"CMPTED"<<std::endl;    
        
        for(const auto& tree : KP.getPaths())
        {
            int pNum=0;
            auto mainTree = json::array();
            for(const auto& path : tree)
            {
                 //Make sure there was a path
                if(path.visitOrder_.size()>0)
                {
                    mainTree[pNum]["nodeScore"] = path.nodeScore_;
                    mainTree[pNum]["direction"] = path.nodeDirection_;
                    mainTree[pNum]["nodes"] = std::vector<int>(); 
                    mainTree[pNum]["edgeLabels"] = std::vector<long>();
                    
                    mainTree[pNum]["totalWeight"] = path.totalWeight_;
                    
                    for(const auto & e : path.visitOrder_)
                        mainTree[pNum]["nodes"].push_back(e);
                    
                    for(const auto& e : path.edgeLabels_)
                        mainTree[pNum]["edgeLabels"].push_back(e.getBits().to_ulong());
                    
                    ++pNum;
                }
            }
            ret["trees"].push_back( mainTree);
        }
            

        return ret;
    }
    
    template<class GT>
    json crossp(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        json ret;
           
        
        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        
       
        if(!key.valid())
        {
            return json::array();
        }
        IntegratedViewer<GT> IV = viewCache.lookup(key);
        
        RandomWalker RW(IV);
        auto pathIndexs  = args["pathNodes"].get<std::vector<typename GT::Index>>();
        std::vector<VertexS<GT>> source;
        for(const auto & e : pathIndexs)
            source.push_back(VertexS<GT>(e));

        typename RandomWalker<GT>::Args_Walk args_walk{.15, 1e-6, GraphList<VertexS<GT>>()};

        //use wieghts to bias the nee path computation 
        
        
        KinasePaths<GT> KP(IV);
        KP.arg_weightFraction_ = 1;
      

        auto sourceI = args["sources"].get<std::vector<typename GT::Index>>();
        auto sourceIV = std::vector<VertexI<GT>>();
        for(const auto& e : sourceI)
            sourceIV.push_back(VertexI<GT>(e));
        auto sinkI = args["sink"].get<typename GT::Index>();
        auto sinkIV = GraphList<VertexI<GT>>(VertexI<GT>(sinkI));
       // std::cout<<"GRRR "<<sinkIV<<std::endl;
        
        
       // KP.computeSiteE(sourceIV, sinkIV, args["mechRatio"]/*,*/ /*viewCache.lookupProximities(key),*//* args["localProximity"]*/);
        
        
        
        viewCache.finishLookup(key);
        
        
        
        
        return ret;
    }
    
    /*
     * Settings: 
     */
    template<class GT>
    json dpth(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        
       
        if(!key.valid())
        {
            return json::array();
        }
        IntegratedViewer<GT> IV = viewCache.lookup(key);
        KinasePaths KP(IV);
        KP.arg_weightFraction_ = 1;
        //Assume 2 paths 
        auto nodes = args["pathNodes"].get<std::vector<std::vector<typename GT::Index>>>();
        
          json ret = json();
            
         KP.compute( GraphList<VertexI<GT>>( VertexI<GT>(nodes[0][nodes[0].size()-1]) ).getElements(),  GraphList<VertexS<GT>>(VertexS<GT>(nodes[0][0])), args["mechRatio"]/*, false*/);
        std::cout<<"paths computed"<<std::endl;
        for(const auto& tree : KP.getPaths())
        {
            int pNum=0;
            auto mainTree = json::array();
            for(const auto& path : tree)
            {
                 //Make sure there was a path
                if(path.visitOrder_.size()>0)
                {
//                     mainTree[pNum]["nodeScore"] = path.nodeScore_;
//                     mainTree[pNum]["direction"] = path.nodeDirection_;
                    mainTree[pNum]["nodes"] = std::vector<int>(); 
                    mainTree[pNum]["edgeLabels"] = std::vector<int>();
                    
//                     mainTree[pNum]["totalWeight"] = path.totalWeight_;
                    
                    for(const auto & e : path.visitOrder_)
                        mainTree[pNum]["nodes"].push_back(e);
                    
                    for(const auto& e : path.edgeLabels_)
                        mainTree[pNum]["edgeLabels"].push_back(e.getBits().to_ulong());
                    
                    ++pNum;
                }
            }
            ret["branches"].push_back( mainTree);
        }
           
         
            
//         std::cout<<kinSet1.size()<<" ::: "<<kinSet2.size()<<std::endl;
            
      
        /*  
        
        KP.computeCrossPaths3(kinSet1, kinSet2, 1, false);
        for(const auto& tree : KP.getPaths())
        {
            int pNum=0;
            auto mainTree = json::array();
            for(const auto& path : tree)
            {
                 //Make sure there was a path
                if(path.visitOrder_.size()>0)
                {
//                     mainTree[pNum]["nodeScore"] = path.nodeScore_;
//                     mainTree[pNum]["direction"] = path.nodeDirection_;
                    mainTree[pNum]["nodes"] = std::vector<int>(); 
                    mainTree[pNum]["edgeLabels"] = std::vector<long>();
                    
//                     mainTree[pNum]["totalWeight"] = path.totalWeight_;
                    
                    for(const auto & e : path.visitOrder_)
                        mainTree[pNum]["nodes"].push_back(e);
                    
                    for(const auto& e : path.edgeLabels_)
                        mainTree[pNum]["edgeLabels"].push_back(e.getBits().to_ulong());
                    
                    ++pNum;
                }
            }
            ret["branches"].push_back( mainTree);
        }
        
        
        KP.computeCrossPaths3(kinSet2, kinSet1, 1, false);
        for(const auto& tree : KP.getPaths())
        {
            int pNum=0;
            auto mainTree = json::array();
            for(const auto& path : tree)
            {
                 //Make sure there was a path
                if(path.visitOrder_.size()>0)
                {
//                     mainTree[pNum]["nodeScore"] = path.nodeScore_;
//                     mainTree[pNum]["direction"] = path.nodeDirection_;
                    mainTree[pNum]["nodes"] = std::vector<int>(); 
                    mainTree[pNum]["edgeLabels"] = std::vector<long>();
                    
//                     mainTree[pNum]["totalWeight"] = path.totalWeight_;
                    
                    for(const auto & e : path.visitOrder_)
                        mainTree[pNum]["nodes"].push_back(e);
                    
                    for(const auto& e : path.edgeLabels_)
                        mainTree[pNum]["edgeLabels"].push_back(e.getBits().to_ulong());
                    
                    ++pNum;
                }
            }
            ret["branches"].push_back( mainTree);
        }
        

       std::cout<<ret<<std::endl;
        */
        viewCache.finishLookup(key);
//         json ret = json::array();
//         for(const auto& e : edges)
//             ret.push_back(e);
        return ret;
    }
    
};
