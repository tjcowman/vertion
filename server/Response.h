#ifndef REQUESTRESPONSE_H
#define REQUESTRESPONSE_H

#include <string>
#include <vector>
#include <sstream>

using std::string;
using std::vector;
using std::stringstream;


class Response
{

    public:
        Response();
        
        Response& cacheable();
        Response& addHeader(std::string header);

        
        
        std::string formatResponse(std::string body);
        
    private:
        
        size_t calculatePayloadSize();
        
        std::vector<std::string> headers_;
        
        string httpHeader_;
        
        
};



//Default headers
Response::Response()
{
    headers_ = {
        "HTTP/1.1 200 OK",
        "Access-Control-Allow-Origin: *",
        "Content-Type: application/json"
    };
}

Response& Response::addHeader(std::string header)
{
    headers_.push_back(header);
    return *this;
}

Response& Response::cacheable()
{
//     headers_.push_back();
//     return *this;
}


string Response::formatResponse(std::string body)
{
    stringstream outstream;
    
    for(const auto& e: headers_)
        outstream<<e<<"\r\n";
    outstream<<"Content-Length: " <<body.size()
        <<"\r\n\r\n"
        <<body;
/*    
    outstream << "HTTP/1.1 200 OK\r\n"
        << "Access-Control-Allow-Origin: *\r\n"
        << "Content-Type: application/json\r\n"
        << "Content-Length: " <<body.size()
        << "\r\n\r\n"<<
        body;*/
    

    return outstream.str();
}





#endif //REQUESTRESPONSE_H
 
