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
        labels["vertex"] = graph.getVertexLabels();
        labels["edge"] = graph.getEdgeLabels();
        
        //Consolidating
        ret["nodes"] = graph.size(0).nodes_;
        ret["versions"] = jsArr ;
        ret["tree"] = jsArr2;
        ret["labels"] = labels;
// //         std::cout<<ret<<std::endl;
        return ret;
    }

    template<class GT>
    json rwr(const VGraph<GT>& graph, const json& args)
    {
        json retVal;
        
        IntegratedViewer<GT> IV(graph);
        IV.viewUnion({args["version"]});
        
        RandomWalker<GT> RW(IV);

        
        
        //specifiy arguments
        typename RandomWalker<GT>::Args_Walk args_walk{args["alpha"], args["epsilon"], GraphList<VertexS<GT>>()};
        
        //GraphList<VertexS<GT>> source( (args["source"])); //[[0,.2] ]
        std::cout<<args["source"]<<std::endl;
        std::vector<VertexS<GT>> source  = (args["source"]);
        
        
        std::cout<<GraphList<VertexS<GT>>(source);
        std::cout<<source.size()<<std::endl;
//         for(const auto& e : args["source"])
//         {
//             source.push_back(std::make_pair(e[0], e[1]));
//         }
        
        //auto res = RW.walk(GraphList<VertexS<GT>>(source), args["version"], args_walk);
        auto res = RW.walk(GraphList<VertexS<GT>>(source), 0, args_walk);
        
        res.sort(Sort::valueDec);
        
        for(size_t i=0; i<std::min(size_t(args["topk"]), res.size()); ++i)
        {
            retVal["weights"] +=  {{"id", res[i].index_}, {"value", res[i].value_}};
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
