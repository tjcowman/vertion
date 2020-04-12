#pragma once

#define BUFFER_SIZE 1024

#include <sstream>
#include <sys/socket.h>


class Http
{
    
    public:
        Http();
        
        int send(int socketFD, const std::string& body);
        void rec(int socketFD);
        
        std::string getURI()const;
        
        void setStatus(const std::string& status);
        void setHeaders(const std::map<std::string, std::string>& headers );
        void addHeader(const std::pair<std::string, std::string>& header);
        
        const std::string& getBody()const;
        const std::map<std::string, std::string>& getHeaders()const;
    
    private:
        
        void parseHeaders(std::string& header);
        
        std::string status_;
        std::map<std::string, std::string> headers_;
        std::string body_;
    
};

Http::Http()
{
    
   
}

std::string Http::getURI()const
{
    //TODO make mor efficient, also robust
    
    //Gets the first line
    std::stringstream ss(status_);
    std::string method;
    std::string uri;
    ss>>method>>uri;
    
    return uri;
}


//TODO: Improve, probably should send more than just headers on first write, maybe less? Actually make it follow the buffer size
//TODO: Isnt sending body atm for testing
int Http::send(int socketFD, const std::string& body)
{

//     
    std::stringstream outstream;
    outstream<<status_<<"\r\n";
    for(const auto& e: headers_)
        outstream<<e.first<<": "<<e.second<<"\r\n";
    
    outstream<<"Content-Length: " <<body.size()
        <<"\r\n\r\n"
        <<body;
    
        
//     auto b1= body.substr(0, body.size()/2);
//     auto b2= body.substr(body.size()/2 +1);
    
    //Send the headers
    auto sb = outstream.str(); 
        
    auto buf = sb.c_str();
//     int n = write(socketFD, buf.c_str(), buf.size()-1);
    int toWrite=sb.size();
    int written=0;
    while(true)
    {
//         std::cout<<"iter"<<std::endl;
        //NOTE: MS_NOSIGNAL prevents entire server from exiting when client resets connection during transfer
        int n = ::send(socketFD, &buf[written], toWrite, MSG_NOSIGNAL);        
//         std::cout<<"write ret "<<n<<std::endl;
// //         std::cout<<written<< " / "<<toWrite<<" : "<<n<<std::endl;
        
        if(n < 0){  
//             perror("Write Error:");
            std::cerr<<"write error"<<std::endl;
            return -1;
        }  
        
        written += n;
//         std::cout<<"written "<<written<<std::endl;
        
        if(written == toWrite)
            break;
    }
    
//     std::cout<<"returing written from http send"<<std::endl;
    return written;
}

void Http::rec(int socketFD)
{
    
    std::string header;
    std::string body;
    
    auto headerDelim = {'\r','\n','\r','\n'};
    
    while(true)
    {
        std::array<char,BUFFER_SIZE> r_buffer;//[BUFFER_SIZE];
        int n = read(socketFD, r_buffer.data(), BUFFER_SIZE-1);
        if(n < 0){  
            perror("Read Error:");
        }  
        r_buffer.data()[n] ='\0';
        
        header += std::string(r_buffer.data());
        
        //look for the  "\r\n\r\n" sequence
        auto it = header.find("\r\n\r\n");
        
         if(it != std::string::npos)//Entire header read
         {
             //if some of body read, move to correct location
             body = header.substr(it+4);
             header.resize(it);
             
             break;
         }   

    }
    
//     std::cout<<header<<std::endl;
    //parse headers
    parseHeaders(header);
    
    auto it = headers_.find("content-length");
    if(it == headers_.end()) //No body
        return;
    
    
    int contentLength = stoi(it->second);//getContentLength(header);
//     std::cout<<"GOT CONTENT LENGTH ="<<contentLength<<std::endl;
    //Get rest of body
    while(true)
    {
        std::array<char,BUFFER_SIZE> r_buffer;
        int receivedLength=body.size();
      
        if (receivedLength == contentLength)
            break;
        
        int n = read(socketFD, r_buffer.data(), BUFFER_SIZE-1);
        if(n < 0){  
            perror("Read Error:");
        }  
        r_buffer.data()[n] ='\0';
        
        body += std::string(r_buffer.data());
    }
    
    body_ = body;
   // std::cout<<body<<std::endl;
    
}


void Http::setStatus(const std::string& status)
{
    status_ = status;
}

void Http::setHeaders(const std::map<std::string, std::string>& headers )
{
    headers_ = headers;
}

void Http::addHeader(const std::pair<std::string, std::string>& header)
{
    headers_.insert(header);
}

const std::string& Http::getBody()const
{
    return body_;
}

const std::map<std::string, std::string>& Http::getHeaders()const
{
    return headers_;
}


void Http::parseHeaders(std::string& header)
{
    std::stringstream ss(header);
    
    
    getline(ss, status_);
    
    while(true)
    {
        std::string line;
        
        getline(ss,line);
//         std::cout<<"parsing "<<line<<std::endl;

        auto delim = line.find(':');
        
        //No delimiter, possibly first line
        if(delim == std::string::npos)
            continue;
        
        
//         std::string key = ;
//         std::string value = ;
        
        for(size_t i=0; i<delim; ++i)
            line[i]=std::tolower(line[i]);
        
        
        auto value = std::string_view(line).substr(delim+1);
        
//          std::string_view value(line);
//          value.substr(value.begin());
        
        //Find the trailing and leading whitespace on the header value
        auto vb = value.find_first_not_of(' ');
        auto ve = value.find_last_not_of(' ');
//         
        headers_.insert(std::make_pair(
            std::string_view(line).substr(0, (delim)),
            value.substr(vb,ve-vb+1)
        ));
        


        
        if(ss.eof())
            return;

    }

}
