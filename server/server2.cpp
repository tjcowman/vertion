#include <vector>

#include <sys/socket.h>
#include <netinet/in.h>
#include <sys/signal.h>
#include <pthread.h>
#include <cstring>
#include <string_view>

#include<locale> //tolower
#include <experimental/filesystem>



#include "vertion.h"
#include "CommandRunner.h"
#include "ViewCache.h"

#include "Response.h"

#include <nlohmann/json.hpp>

#include <iostream>
#include <string>


namespace fs = std::experimental::filesystem;
using json = nlohmann::json;


#define MAX_CON 2048


#define BUFFER_SIZE 4096
#define WBUFFER_SIZE 4096






struct InstanceArgs{
    int sockfd;
    const Graph* G;
//     std::string payload;
    ViewCache<GraphType::GD>* VC;
    
};

int getContentLength(std::string header)
{
// //     std::cout<<"HEADER " <<header<<std::endl;
    std::stringstream ss(header);
//     ss>>header;
    
    while(true)
    {
        std::string line;
        getline(ss,line);
//         ss>>line;
        
        
//         std::cout<<"LINE: "<<line<<std::endl;
        //Didn't find header element
 
        
        
        
        auto delim = line.find(':');
        
        //No delimiter, possibly first line
        if(delim == std::string::npos)
            continue;
        
//         for(auto it=line.begin(); it != delim; ++it)
        for(size_t i=0; i<delim; ++i)
            line[i]=std::tolower(line[i]);
        
        std::cout<<line<<std::endl;
        
//         std::string_view(line).substr(0, delim);
//         std::cout<<"comparing> "<<std::string_view(line).substr(0, (delim-1))<<std::endl;
        if( std::string_view(line).substr(0, (delim)) == "content-length")
            return stoi(line.substr(delim+1));
        
        
        if(ss.eof())
            return -1;

    }
    
//     auto it = header.find("");
}

std::pair<std::string,std::string> readHttp(int sockfd)
{
    std::string header;
    std::string body;
    
    auto headerDelim = {'\r','\n','\r','\n'};
    
    while(true)
    {
        std::array<char,BUFFER_SIZE> r_buffer;//[BUFFER_SIZE];
        int n = read(sockfd, r_buffer.data(), BUFFER_SIZE-1);
        if(n < 0){  
            perror("Read Error:");
        }  
        
        header += std::string(r_buffer.data());
        
        //look for the  "\r\n\r\n" sequence
//         auto it = std::search(header.begin(), header.end(),  headerDelim.begin(), headerDelim.end());
        auto it = header.find("\r\n\r\n");
        
         if(it != std::string::npos)//Entire header read
         {
             //if some of body read, move to correct location
             
             body = header.substr(it+4);
             header.resize(it);
             
             break;
         }   
         
         
         
         //Now read rest of body
             
//             header += std::string(r_buffer.data());
//         else
//         {
//             header += std::string(r_buffer.begin(), it); //get up to beginning of body delim
//             break;
//         }
    }
    
    
    return std::make_pair(header, body);
}

void *serverInstance(void *args)
{
    InstanceArgs argsE = *((InstanceArgs*)args);

    int sockfd= ((struct InstanceArgs*)args)->sockfd;// *(int*)sockfd;
    std::cout<<"FD "<<sockfd<<std::endl;
    const Graph* G = ((struct InstanceArgs*)args)->G;
     ViewCache<GraphType::GD>* VC =  ((struct InstanceArgs*)args)->VC;
    
    CommandRunner<GraphType::GD> CR(*G, *VC);
//     bool extract = ((struct InstanceArgs*)args)->extract;
    
    
    char w_buffer[WBUFFER_SIZE];
//     char r_buffer[BUFFER_SIZE];

    
    auto req = readHttp(sockfd);
    std::cout<<req.first<<std::endl;
    
    int contentLength = getContentLength(req.first);
    
    
    while(true)
    {
         std::array<char,BUFFER_SIZE> r_buffer;
        int receivedLength=req.second.size();
        std::cout<<"RL "<<receivedLength<<std::endl;
        if (receivedLength == contentLength)
            break;
        
        int n = read(sockfd, r_buffer.data(), BUFFER_SIZE-1);
        if(n < 0){  
            perror("Read Error:");
        }  
        
        req.second += std::string(r_buffer.data());
    }
    
    
//     while(true)
//     {
//         std::vector<std::string> query;
        
//         bzero(r_buffer,BUFFER_SIZE);
//         bzero(w_buffer,BUFFER_SIZE);

//         std::string requestRB;
//         while(true)
//         {
// //             int n = read(sockfd, r_buffer, BUFFER_SIZE-1);
// //             std::cout<<"READ "<<n<<" bytes"<<std::endl;
//             if(n < 0){  
//                 perror("Read Error:");
//             }  

            
//         std::string request(r_buffer);
//         std::cout<<"RPT : "<<request<<std::endl;
//         std::cout<<"R : "<<request.substr(request.find("\r\n\r\n"))<<std::endl;
        
//         json queryString = json::parse(request.substr(request.find("\r\n\r\n")+4));
//         std::vector< GraphType::GD::VersionIndex> versions = queryString["versions"].template get<std::vector<GraphType::GD::VersionIndex>>();
//         std::vector<GraphType::GD::Index> vertexLabels = queryString["vertexLabels"].template get<std::vector<GraphType::GD::Index>>();
//         std::vector<GraphType::GD::Index> edgeLabels = queryString["edgeLabels"].template get<std::vector<GraphType::GD::Index>>();    
                
      
             
//         json queryResponse ;//= CR.run(queryString);
                
            
                

            
            
        
        
        
        Response R;

//         std::cout<<"HERE"<<std::endl;
        auto RF =  R.formatResponse("D"); //queryResponse.dump());
        
        
//         std::cout<<"HERE2"<<std::endl;
//         RF.addSegment()
//         std::cout<<RF.c_str()<<std::endl;
        strcpy( w_buffer, RF.c_str()); // RF.c_str()
        
        
        int n = write(sockfd, w_buffer, BUFFER_SIZE-1);
        if(n < 0){  
            perror("Write Error:");
        }  
    
    close(sockfd);
    return (0);
//     }

}

int startServer_hgraph(int portNumber, int threads, const Graph* G,  ViewCache<GraphType::GD>* VC)
{
    struct sockaddr_in serv_addr, cli_addr;
    socklen_t clilen;
    
    
    int sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sockfd < 0) 
        std::cout<<"ERROR opening socket";
    
    
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    serv_addr.sin_port = htons(portNumber);
    if (bind(sockfd, (struct sockaddr *) &serv_addr,
        sizeof(serv_addr)) < 0) 
        std::cout<<"ERROR on binding";
    listen(sockfd,50);
    clilen = sizeof(cli_addr);
    

  
    pthread_t thread_id[MAX_CON];
    int i = 0;
    while(true)
    {
        int newsockfd = accept(sockfd,(struct sockaddr *) &cli_addr, &clilen);
        if (newsockfd < 0) 
            std::cout<<"ERROR on accept";
    
        InstanceArgs* args = new InstanceArgs;
        args->sockfd = newsockfd;
        args->G = G;
        args->VC = VC;
        //{newsockfd,G};
        
        if( pthread_create(&thread_id[i], NULL, serverInstance,  (void*)args) != 0 )
           printf("Failed to create thread\n");
        
            //Once n threads have been created wait until they all finish
            if( i >= (threads))
            {
                i = 0;

                while(i < threads)
                {
                    pthread_join(thread_id[i++],NULL);

                }
                i = 0;
            }

    }
  
    
}





struct Args
{
    int port = -1;
    std::string graph = "";
    std::string mode = "";
    int cacheSize = 10; 
    
    int threads = 1;

};

int main(int argc, char* argv[] )
{
//     int port = -1;
//     std::string graph = "";
//     std::string mode = "";
//     int cacheSize = 10; 
//     
//     int threads = 1;
    
     ARGLOOP(,
        ARG(port,stoi)
        ARG(graph,)

        ARG(cacheSize, stoi) //Needs to be > threads for the server so in use views dont get deleted
        ARG(mode,)
        
        ARG(threads, stoi)
    );
    
     
    Graph G(Context::undirected);
    GraphIO IO(G);
    IO.read_serial(args.graph);
    ViewCache<GraphType::GD> VC(G, args.cacheSize);
    
    std::cout<<G.size()<<std::endl;
    startServer_hgraph(args.port, args.threads, &G, &VC);


    return 0;
}
 
