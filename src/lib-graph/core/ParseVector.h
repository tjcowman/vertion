#pragma once

#include <fstream>

template<class FieldsStruct>
class ParseVector
{
    public:

        typename  std::vector<FieldsStruct>::const_iterator begin()const{return elements_.begin();}
        typename std::vector<FieldsStruct>::const_iterator end()const{return elements_.end();}
        
        ParseVector();
        ParseVector(std::string filename);
        

        
        template<class Func>
        ParseVector<FieldsStruct> select(Func f);
        
        
        friend std::ostream& operator<<(std::ostream& os, const ParseVector& parseVector)
        {
            for(const auto& e : parseVector.elements_)
                os<<e<<"\n";
            return os;
        }
        
    //private:
        std::vector<FieldsStruct> elements_;
    
};

//TODO: replace with more descriptive name (LEGACY)
using PairVector = ParseVector<std::pair<std::string, std::string> >;
std::istream& operator>>(std::istream & in, std::pair<std::string, std::string>& p)
{
    std::string e1;
    std::string e2;
    in >> e1;
    in >> e2;
    p.first = e1;
    p.second = e2;
    return in;
}

template<class FieldsStruct>
ParseVector<FieldsStruct>::ParseVector()
{
    elements_ = std::vector<FieldsStruct>();
}

template<class FieldsStruct>
ParseVector<FieldsStruct>::ParseVector(std::string filename)
{
    std::ifstream file(filename);
    if(!file.is_open())
    {
        std::cerr<<"file <"<<filename<<"> not found"<<std::endl;
        elements_ = std::vector<FieldsStruct>();
    }
    else
    {
        //Check the format of the first line to make sure it parses correctly
        //TODO: Make this more informative
        FieldsStruct e; file >> e;
        
        if(file.peek() != '\n')
        {
            std::cerr<<"element not formatted correctly"<<std::endl;
        }
        else
        {
            elements_.push_back(e);
            while(true)
            {
                FieldsStruct e; file >> e;
                
                
                if(file.eof())
                    break;
                
                elements_.push_back(e);
            }
        }
    }
}

template<class FieldsStruct>
template<class Func>
ParseVector<FieldsStruct> ParseVector<FieldsStruct>::select(Func f)
{
    ParseVector<FieldsStruct> selected;
    
    for(const auto& e : elements_)
        if(f(e))
            selected.elements_.push_back(e);
    
    return selected;
}
