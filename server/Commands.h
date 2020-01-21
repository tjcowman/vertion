#pragma once
#include "vertion.h"

#include <nlohmann/json.hpp>
using json = nlohmann::json;

namespace Commands
{

    template<class GT>
    json ls(const VGraph<GT>& graph, const json& args)
    {
        json ret;
        
        auto jsArr = json::array();

//         for(typename GT::VersionIndex i=0; i< graph.size().versions_; ++i)
//         {
//             ret["tags"]["V"+std::to_string(i) ] = (graph.getTags().lookup(i));
//             ret["names"]["V"+std::to_string(i)] = graph.getTags().getName(i);
// //             std::cout<<retVal<<std::endl;
//         }
        
        for(typename GT::VersionIndex i=0; i< graph.size().versions_; ++i)
        {
            json js;
            js["index"] = i;
            js["tags"] = (graph.getTags().lookup(i));
            js["name"] = graph.getTags().getName(i);
            
            jsArr.push_back(js);
        }
        
        
        auto versionTree = graph.getVersionChildLists();
        json jsArr2 = json(versionTree); 
        
        ret["versions"] = jsArr ;
        ret["tree"] = jsArr2;
        std::cout<<ret<<std::endl;
        return ret;
    }

    template<class GT>
    json rwr(const VGraph<GT>& graph, const json& args)
    {
        json retVal;
        
        RandomWalker<GT> RW(graph);

        typename RandomWalker<GT>::Args_Walk args_walk{args["alpha"], args["epsilon"], GraphList<VertexS<GT>>()};
        
        auto res = RW.walk(GraphList<VertexS<GT>>(), args["version"], args_walk);
        
//         return res.getElements()
        
        for(const auto& e : res.getElements())
        {
            retVal["weights"] +=  {{"id", e.index_}, {"value", e.value_}};
        }
        
        
        std::cout<<"Query Finished"<<std::endl;
        return retVal;
    }

};
