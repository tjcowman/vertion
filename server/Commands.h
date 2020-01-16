#pragma once
#include "vertion.h"

#include <nlohmann/json.hpp>
using json = nlohmann::json;

namespace Commands
{

    template<class GT>
    json ls(const VGraph<GT>& graph, const json& args)
    {
        json retVal;
        for(typename GT::VersionIndex i=0; i< graph.size().versions_; ++i)
        {
            retVal["Version "+std::to_string(i) ] += (graph.getTags().lookup(i));
//             std::cout<<retVal<<std::endl;
        }
        return retVal;
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
