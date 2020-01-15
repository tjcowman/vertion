#pragma once

#include "vertion.h"
#include "CommandParser.h"

#include <nlohmann/json.hpp>

using json = nlohmann::json;

template<class GT>
class CommandRunner
{
    public:
        CommandRunner(const VGraph<GT>& graph);
        
        json run(json& command)const;
        
    private:
        const VGraph<GT>* graph_;
        
};

template<class GT>
CommandRunner<GT>::CommandRunner(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

template<class GT>
json CommandRunner<GT>::run(json& command)const
{
    
}
