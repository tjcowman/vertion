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
    std::vector<typename GT::VersionIndex> versions = args["versions"].get<std::vector<typename GT::VersionIndex>>();
    std::vector<typename GT::Index> vertexLabels = args["vertexLabels"].get<std::vector<typename GT::Index>>();
    std::vector<typename GT::Index> edgeLabels = args["edgeLabels"].get<std::vector<typename GT::Index>>();

    return(ViewKey<GT>(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)));
}


namespace Commands
{
//TODO: send labels
    //Takes an array of string identifiers and returns the correpsonding index or not found
    template<class GT>
    json lkpn(const VGraph<GT>& graph, const json& args)
    {
        std::cout<<args["names"]<<std::endl;

        std::vector<std::string> names = args["names"].get<std::vector<std::string>>();

        //js["labels"] = graph.getVertexData().lookupLabels(i).getBits().to_ulong();

        json ret;
//         std::vector<typename GT::Index> ids;
//         std::vector< VertexLab> labs;
        for(const auto& e : names)
        {
            auto id = graph.lookupVertex(e);
            if(id != GT::invalidIndex)
//                 ids.push_back(id);
                ret.push_back({{"id",id},{"l", graph.getVertexData().lookupLabels(id).getBits().to_ulong()}});
            else
                  ret.push_back({{"id",-1}});
//                 ids.push_back(-1);

        }


//         ret["ids"] = ids;
        return ret;
    }

    template<class GT>
    json lkpi(const VGraph<GT>& graph, const json& args)
    {
        std::vector<typename GT::Index> ids = args["ids"].get<std::vector<typename GT::Index>>();

        json ret;
        for(const auto& id : ids)
        {
            ret.push_back({{"name", graph.lookupVertex(id)}, {"pname", graph.alternateMapping_.findf(id)->second}, {"l", graph.getVertexData().lookupLabels(id).getBits().to_ulong()} });
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

        //Version tree
//         auto versionTree = graph.getVersionChildLists();
//         json jsArr2 = json(versionTree);

        //labels
        json labels;
        labels["vertex"]["names"] = graph.getVertexLabels();
        for(int i=0; i<labels["vertex"]["names"].size(); ++i)
            labels["vertex"]["url"].push_back( graph.getVertexData().lookupURL(i));//"test";


        labels["edge"] = graph.getEdgeLabels();

//         for(const auto& e :  graph.getVertexLabels())
//             std::cout<<e<<std::endl;

//         std::cout<<labels["vertex"]<<std::endl;
        //NodeData
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


       auto source  = GraphList<VertexS<GT>>(  std::vector<VertexS<GT>>(args["source"]) );
        //Convert the globalIndex to the viewIndexes
        for(auto& e : source.getElements())
            e.index_ = IV.getViewIndex(e.index_);

        source = source.select([](const auto& e){return e.index_ != GT::invalidIndex;});




        auto duration = std::chrono::high_resolution_clock::now() - start;
        long long tIntegrateUs = std::chrono::duration_cast<std::chrono::microseconds>(duration).count();

//         std::cout<<"finished lookup"<<std::endl;
//         retVal["viewHash"] = viewCache.generate_uid(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels));

        RandomWalker<GT> RW(IV);

        typename RandomWalker<GT>::Args_Walk args_walk{args["alpha"], args["epsilon"], GraphList<VertexS<GT>>()};

        start = std::chrono::high_resolution_clock::now();
//         auto res = Walk<GT>().setHeader("{}");//RW.walk(GraphList<VertexS<GT>>(source), args_walk); //TODO reen
        auto res = RW.walk(source, args_walk);
        duration = std::chrono::high_resolution_clock::now() - start;
        long long tcomputeUs = std::chrono::duration_cast<std::chrono::microseconds>(duration).count();

        viewCache.finishLookup(key);

        res.sort(Sort::valueDec);
        res.resize(std::min(size_t(args["topk"]), res.size()));

        if(args["mode"] == "nl")
        {
             retVal["weights"] = json::array();

            for(size_t i=0; i<std::min(size_t(args["topk"]), res.size()); ++i)
            {
                retVal["weights"] +=  {{"id",  IV.getOriginalIndex(res[i].index_)}, {"value", res[i].value_}};
            }
        }
        else if(args["mode"] == "el")
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
        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        if(key.valid())
        {
          //Need to make sure the integration has been generated
          IntegratedViewer<GT> IV = viewCache.lookup(key);
          json ret = viewCache.getViewSummary(key.key_);
          viewCache.finishLookup(key);
          return ret;
        }
        else
        {
          return  json{{"error", "invalid view"}};
        }
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
    
    
    struct PhosphorylationFold{
        std::string name_;
        int pos_;
        float score_;
    };

    void from_json(const json& j, PhosphorylationFold& p)
    {
        j[0].get_to(p.name_);
        j[1].get_to(p.pos_);
        j[2].get_to(p.score_);
    }

    
    template<class GT>
    json pths(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        auto ret = json::array();
        
        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        IntegratedViewer<GT> IV = viewCache.lookup(key);
        // IV.viewUnion(versions);
    // 
    //         
        KinasePaths KP(IV);
        KP.arg_minWeight_ = args["minWeight"];
        
        auto sourceIndex = graph.lookupVertex(args["kinase"].get<std::string>());
        
        GraphList<VertexS<GT>> sinkList;
        for(const auto& e : args["sites"])
        {
            auto graphIndex = graph.lookupVertex((std::string)e[0]);
            if(graphIndex != GT::invalidIndex)
            {
                sinkList.push_back(VertexS<GT>(graphIndex, e[2]));
                //usedIndexes.insert(graphIndex);
            }
        }
        
//         std::cout<<sinkList<<std::endl;
        
        sinkList.sort(Sort::indexInc);
        KP.compute(VertexI<GT>(sourceIndex), sinkList);
   // std::cout<<"CMPTED"<<std::endl;    
        int pNum=0;
        for(const auto& path : KP.getPaths())
        {
            ret[pNum]["name"] =  "path-"+std::to_string(pNum);
            ret[pNum]["nodeScore"] = path.nodeScore_;
            ret[pNum]["nodes"] = std::vector<int>(); 
            ret[pNum]["edgeLabels"] = std::vector<long>();
            //ret[pNum]["score"] = path.score_;
            
            
            for(const auto & e : path.visitOrder_)
                ret[pNum]["nodes"].push_back(e);
            
            for(const auto& e : path.edgeLabels_)
                ret[pNum]["edgeLabels"].push_back(e.getBits().to_ulong());
                
            ++pNum;
        }
            
        return ret;
    }

    template<class GT>
    json dpth(const VGraph<GT>& graph, ViewCache<GT>& viewCache, const json& args)
    {
        json ret = json::array();;
        ViewKey<GT> key = viewKeyFromArgs<GT>(args);
        IntegratedViewer<GT> IV = viewCache.lookup(key);
        
        KinasePaths KP(IV);
        auto edges = KP.computeDense(args["nodes"].get<std::vector<typename GT::Index>>());
        
        for(const auto& e : edges)
            ret.push_back(e);
        
        return ret;
    }
};
