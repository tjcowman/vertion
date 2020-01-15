#pragma once
#include <string>

class CommandParser
{
    public:
        int parse(std::string input);
    
    private:
        std::string command;
        std::map<std::string, std::string> args;
        
};
