/*
Macro used to provide a simple interfrace for adding an parsing command line arguments.
A usage example is shown below:

struct Args{
    bool random;
    int numPairs;
    float epsilon;
};

int main(int argc, char* argv[] )
{
   
    
    ARGLOOP(
        FLAG(random, r),
        ARG(numPairs, stol)
        ARG(epsilon, stod)
    );
    
    std::cout<<args.epsilon<<std::endl;
    std::cout<<args.random<<std::endl;
    std::cout<<args.numPairs<<std::endl;
    
    return 0;
}
*/

#pragma once

#include <iostream>
#include <sstream>
#include <vector>


template<class T>
std::vector<T> stringToIntegerVector(std::string numberString)
{
    std::vector<T> numbers;
    
    std::istringstream ss(numberString);
    std::string token;

    while(std::getline(ss, token, ',')) 
       numbers.push_back(stoll(token));
    return numbers;
}
    
std::vector<std::string> stringToStringVector(std::string s)
{
    std::stringstream ss(s);
    
    std::vector<std::string> strings;
    while(true)
    {
        
        std::string se;
        std::getline( ss, se,  ',');
        strings.push_back(se.substr(0, se.size()));
        if(ss.eof())
            break;
        
    }
    return strings;
}

bool isArg(std::string token)
{
    return (token.size() >2 && token[0] == '-' && token[1] == '-');
}

bool isFlag(std::string token)
{
    return(token.size()==2 && token[0] == '-');
}

//Stringification
#define xstr(s) strf(s)
#define strf(s) #s

#define ARGS if(false)

#define ARGAPP(name){args.name}


#define ARG(name, convert) else if(token==strf(--name)){args.name=convert(value);}
#define FLAG(name, ch) else if(token==strf(-ch)){args.name=true;}


#define ARGLOOP(f, x) \
Args args;\
int op=1; \
while(op < argc) \
{ \
    std::string token = argv[op]; \
    if(isFlag(token))\
    {\
        if(false);   \
            f\
        else\
            std::cerr<<token<<" not used"<<std::endl;\
    }\
   else if(isArg(token) && op<argc-1 && !isArg(argv[op+1]))\
   {\
        std::string value = argv[op+1];\
        if(false); \
            x\
        else\
            std::cerr<<token<<" not used"<<std::endl;\
    }\
    ++op;\
}
