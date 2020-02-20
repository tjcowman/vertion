#pragma once
#include "vertion.h"

#include <nlohmann/json.hpp>

#include<algorithm>
using json = nlohmann::json;

namespace Commands
{

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
        auto versionTree = graph.getVersionChildLists();
        json jsArr2 = json(versionTree); 
        
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
        for(typename GT::Index i=0; i<graph.size(0).nodes_; ++i)
        {
            json js;
            js["id"] = i;
            js["name"]= graph.getID(i);
            js["labels"] = graph.getVertexData().lookupLabels(i).getBits().to_ulong();
            vertexData.push_back(js);
        }
        
        
        //Consolidating
        ret["nodes"] = graph.size(0).nodes_;
        ret["vertexData"] = vertexData;
        ret["versions"] = jsArr ;
        ret["tree"] = jsArr2;
        ret["labels"] = labels;
        ret["vertexData"];
// //         std::cout<<ret<<std::endl;
        return ret;
    }

    template<class GT>
    json rwr(const VGraph<GT>& graph, const json& args)
    {
        json retVal;
        std::vector<typename GT::VersionIndex> versions = args["versions"].get<std::vector<typename GT::VersionIndex>>();
        
        
        IntegratedViewer<GT> IV(graph);
        
        IV.viewUnion(versions);
        
        RandomWalker<GT> RW(IV);
        //specifiy arguments
        typename RandomWalker<GT>::Args_Walk args_walk{args["alpha"], args["epsilon"], GraphList<VertexS<GT>>()};
        

        std::cout<<args["source"]<<std::endl;
        std::vector<VertexS<GT>> source  = (args["source"]);
        std::cout<<GraphList<VertexS<GT>>(source);
        std::cout<<source.size()<<std::endl;

        auto res = RW.walk(GraphList<VertexS<GT>>(source), args_walk);
        res.sort(Sort::valueDec);
        res.resize(std::min(size_t(args["topk"]), res.size()));
        
        if(args["mode"] == "nl")
        {
            for(size_t i=0; i<std::min(size_t(args["topk"]), res.size()); ++i)
            {
                retVal["weights"] +=  {{"id", res[i].index_}, {"value", res[i].value_}};
            }
        }
        else if(args["mode"] == "el")
        {
            GraphList<EdgeElement<GT>> edges = IV.mapVertexes(res);
            for(size_t i=0; i<res.size(); ++i)
            {
                retVal["nodes"] +=  {{"id", res[i].index_}, {"value", res[i].value_}};
            }
            for(const auto& e : edges)
            {
                retVal["edges"] += {{"id1",e.index1_}, {"id2", e.index2_}, {"value",e.value_}, {"labels",e.labels_.getBits().to_ulong()}};
            }
            

        }
        
        std::cout<<"Query Finished"<<std::endl;
        return retVal;
    }
    
    template<class GT>
    json lsv(const VGraph<GT>& graph, const json& args)
    {
        json retVal;
        
        //Get nodes and edges
        retVal["nodes"] = graph.size().nodes_;
        retVal["edges"] = graph.size().edges_;
        //Get the existing node and edge labels, maybe counts?
        
        return retVal;
    }

};
