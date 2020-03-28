#ifndef REQUESTRESPONSE_H
#define REQUESTRESPONSE_H

#include <string>
#include <vector>
#include <sstream>

using std::string;
using std::vector;
using std::stringstream;

#define SEGMENTTOKEN "\n#\n"


//Will consist of triggered updates followed by primary response
//Reponse sections will be seperated by \n SEGMENTTOKEN \n first line of segment will contain segment info

struct ResponseSegment
{
    string header;
    string data;
};

class Response
{

    public:
        Response();
        
        //void setHttpHeader(size_t payload);
        
        void addSegment(ResponseSegment s);
        void setBody(std::string s);
        
        
        string formatResponse(std::string body);
        
    private:
        
        size_t calculatePayloadSize();
        
        string httpHeader_;
        vector<ResponseSegment> responseSegments_;
        
};


Response::Response()
{
    
}

void Response::addSegment(ResponseSegment s)
{
    responseSegments_.push_back(s);
}

string Response::formatResponse(std::string body)
{
    stringstream outstream;
    outstream << "HTTP/1.1 200 OK\r\n"
        <<"Access-Control-Allow-Origin: *\r\n"
        << "Content-Length: " <<calculatePayloadSize()
        << "\r\n\r\n"<<
        body;
    
    //outstream << SEGMENTTOKEN;
    //for(ResponseSegment seg : responseSegments_)
//     for(int i=0; i< responseSegments_.size()-1; ++i)
//     {
//         outstream << responseSegments_[i].header << "\n" << responseSegments_[i].data << SEGMENTTOKEN;
//     }
//     outstream << responseSegments_[responseSegments_.size()-1].header << "\n" << responseSegments_[responseSegments_.size()-1].data;
    
    
    return outstream.str();
}


void setBody(std::string s)
{
        
}

//TODO: only +3 for the current token used, +1 for header newline
size_t Response::calculatePayloadSize()
{
    size_t s = (responseSegments_.size()-1)*3;
    for(ResponseSegment seg : responseSegments_)
    {
        s += (seg.header.size() + seg.data.size())+1 ;
    }
    return s;
}



#endif //REQUESTRESPONSE_H
 
