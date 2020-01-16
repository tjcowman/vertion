#pragma once

#include "vertion.h"
#include "query/RandomWalker.h"
//#include "CommandParser.h"
#include "Commands.h"

#include <nlohmann/json.hpp>

using json = nlohmann::json;

template<class GT>
class CommandRunner
{
    public:
        CommandRunner(const VGraph<GT>& graph);
        
        json run(const json& command)const;
        
    private:
        const VGraph<GT>* graph_;
        
};

template<class GT>
CommandRunner<GT>::CommandRunner(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

template<class GT>
json CommandRunner<GT>::run(const json& command)const
{
    std::cout<<command<<std::endl;
    
    if(command["cmd"] == "ls")
        return Commands::ls<GT>(*graph_, command);
    else if(command["cmd"] == "rwr")
        return Commands::rwr<GT>(*graph_, command);
    
    return json();
}
