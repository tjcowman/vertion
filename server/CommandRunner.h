#pragma once

#include "vertion.h"
#include "ViewCache.h"
#include "query/RandomWalker.h"
#include "query/IntegratedViewer.h"
#include "motifs/Triangles.h"

#include "Commands.h"

#include <nlohmann/json.hpp>

using json = nlohmann::json;


template<class GT>
void from_json(const json& j, VertexS<GT>& v)
{
//     std::cout<<"HI"<<std::endl;
//     std::cout<<j<<std::endl;
//     std::cout<<j["i"]<<" "<<j["v"]<<std::endl;
    
    j["i"].get_to(v.index_);
    j["v"].get_to(v.value_);
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
//     std::cout<<command<<std::endl;
    
    if(command["cmd"] == "ls")
        return Commands::ls<GT>(*graph_, command);
    else if(command["cmd"] == "rwr")
        return Commands::rwr<GT>(*graph_, *viewCache_, command);
    else if(command["cmd"] == "rwr2")
        return Commands::rwr2<GT>(*graph_, *viewCache_,command);
    else if(command["cmd"] == "lsv")
        return Commands::lsv<GT>(*graph_, *viewCache_, command);
    else if(command["cmd"] == "mft")
        return Commands::mft<GT>(*graph_, *viewCache_, command);
    
    
    return json();
}
