#pragma once

#include "vertion.h"
#include "ViewCache.h"
#include "query/RandomWalker.h"
#include "query/IntegratedViewer.h"
#include "motifs/Triangles.h"
#include "KinasePaths.h"

#include "Commands.h"

#include <nlohmann/json.hpp>

using json = nlohmann::json;


template<class GT>
void from_json(const json& j, VertexS<GT>& v)
{
    j["i"].get_to(v.index_);
    j["v"].get_to(v.value_);
}

template<class GT>
void to_json(json& j, const EdgeElement<GT>& e)
{
    j = json{{"i1", e.index1_}, {"i2", e.index2_}, {"w", e.value_}, {"l", e.labels_.getBits().to_ulong()}};
}

template<class GT>
void to_json(json& j, const Path<GT>& path)
{
    j["nodeScore"] = path.nodeScore_;
    j["direction"] = path.nodeDirection_;
    j["nodes"] = std::vector<int>(); 
    j["edgeLabels"] = std::vector<long>();
    
    j["totalWeight"] = path.totalWeight_;
    
    for(const auto & ee : path.visitOrder_)
        j["nodes"].push_back(ee);
    
    for(const auto& ee : path.edgeLabels_)
       j["edgeLabels"].push_back(ee.getBits().to_ulong());

}

template<class GT>
void to_json(json& j, const std::vector<Path<GT>> e)
{
    j = json::array();
    for(const auto& path : e)
        j.push_back(path);
}

template<class GT>
void to_json(json& j, const std::vector<std::vector<Path<GT>>> e)
{
    for(const auto& tree : e)
    {
        //int pNum=0;
        auto treePaths = json::array();
        for(const auto& path : tree)
        {
          treePaths.push_back(json(path))  ;
//                 //Make sure there was a path
//             if(path.visitOrder_.size()>0)
//             {
//                 treePaths[pNum]["nodeScore"] = path.nodeScore_;
//                 treePaths[pNum]["direction"] = path.nodeDirection_;
//                 treePaths[pNum]["nodes"] = std::vector<int>(); 
//                 treePaths[pNum]["edgeLabels"] = std::vector<long>();
//                 
//                 treePaths[pNum]["totalWeight"] = path.totalWeight_;
//                 
//                 for(const auto & ee : path.visitOrder_)
//                    treePaths[pNum]["nodes"].push_back(ee);
//                 
//                 for(const auto& ee : path.edgeLabels_)
//                     treePaths[pNum]["edgeLabels"].push_back(ee.getBits().to_ulong());
//                 
//                 ++pNum;
//             }
        }
        j["trees"].push_back( treePaths);
    }
}


template<class GT>
class CommandRunner
{
    public:
        CommandRunner(const VGraph<GT>& graph, ViewCache<GT>& viewCache);
        
        json run(const json& command)const;
        
//     private:
        const VGraph<GT>* graph_;
        ViewCache<GT>* viewCache_;
        
};

template<class GT>
CommandRunner<GT>::CommandRunner(const VGraph<GT>& graph, ViewCache<GT>& viewCache)
{
    graph_ = &graph;
    viewCache_ = &viewCache;
}

template<class GT>
json CommandRunner<GT>::run(const json& command)const
{
//     std::cout<<"COMMAND\n"<<command<<std::endl;
    
    
    if(command.find("cmd") != command.end())
    {
        if(command["cmd"] == "ls")
            return Commands::ls<GT>(*graph_, command);
//         else if(command["cmd"] == "rwr")
//             return Commands::rwr<GT>(*graph_, *viewCache_, command);
        else if (command["cmd"] == "lkpn")
            return Commands::lkpn<GT>(*graph_, command);
        else if (command["cmd"] == "lkpi")
            return Commands::lkpi<GT>(*graph_, command);
        else if(command["cmd"] == "rwr2")
            return Commands::rwr2<GT>(*graph_, *viewCache_,command);
//         else if(command["cmd"] == "lsv")
//             return Commands::lsv<GT>(*graph_, *viewCache_, command);
//         else if(command["cmd"] == "mft")
//             return Commands::mft<GT>(*graph_, *viewCache_, command);
        else if(command["cmd"] == "pths")
            return Commands::pths<GT>(*graph_, *viewCache_, command);
//         else if(command["cmd"] == "validation")
//             return Commands::validation<GT>(*graph_, *viewCache_, command);
       // else if(command["cmd"] == "dpth")
        //    return Commands::dpth<GT>(*graph_, *viewCache_, command);
        else if(command["cmd"] == "sitee")
            return Commands::sitee<GT>(*graph_, *viewCache_, command);
        else if(command["cmd"] == "crossp")
            return Commands::crossp<GT>(*graph_, *viewCache_, command);
        else
        {
            std::cerr<<"cmd provided does not exist"<<std::endl;
            return json();
        }
    }
    else
    {
        std::cerr<<"no cmd provided to run"<<std::endl;
        return json();
    }
}
