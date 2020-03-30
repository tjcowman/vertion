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


#define BUFFER_SIZE 64
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

        auto delim = line.find(':');
        
        //No delimiter, possibly first line
        if(delim == std::string::npos)
            continue;
        
        for(size_t i=0; i<delim; ++i)
            line[i]=std::tolower(line[i]);
        

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
        r_buffer.data()[n] ='\0';
        
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

    }
    
    int contentLength = getContentLength(header);
//     std::cout<<contentLength<<std::endl;
//     std::cout<<header<<std::endl;
    
    //Get rest of body
    while(true)
    {
        std::array<char,BUFFER_SIZE> r_buffer;
        int receivedLength=body.size();
      
        if (receivedLength == contentLength)
            break;
        
        int n = read(sockfd, r_buffer.data(), BUFFER_SIZE-1);
        if(n < 0){  
            perror("Read Error:");
        }  
        r_buffer.data()[n] ='\0';
        
//         std::cout<<"READ "<<std::string(r_buffer.data())<<std::endl;
        body += std::string(r_buffer.data());
    }
    
    
    
    return std::make_pair(header, body);
}

//TODO rename to query or somethign like that
void *serverInstance(void *args)
{
    InstanceArgs argsE = *((InstanceArgs*)args);
    int sockfd= ((struct InstanceArgs*)args)->sockfd;// *(int*)sockfd;
    const Graph* G = ((struct InstanceArgs*)args)->G;
    ViewCache<GraphType::GD>* VC =  ((struct InstanceArgs*)args)->VC;
    CommandRunner<GraphType::GD> CR(*G, *VC);

    auto req = readHttp(sockfd);

    json queryString = json::parse(req.second);
    std::vector< GraphType::GD::VersionIndex> versions = queryString["versions"].template get<std::vector<GraphType::GD::VersionIndex>>();
    std::vector<GraphType::GD::Index> vertexLabels = queryString["vertexLabels"].template get<std::vector<GraphType::GD::Index>>();
    std::vector<GraphType::GD::Index> edgeLabels = queryString["edgeLabels"].template get<std::vector<GraphType::GD::Index>>();    
            
    
             
    json queryResponse = CR.run(queryString);
                

    auto RF =  Response().formatResponse(queryResponse.dump());
    


    
 
    int n = write(sockfd, RF.c_str(), RF.size()-1);
    if(n < 0){  
        perror("Write Error:");
    }  
    
    close(sockfd);
    return (0);

}

void* basicHandler(int sockfd, const Graph& G,  ViewCache<GraphType::GD>& VC, std::string queryString)
{
    json query = json::parse(queryString);
    
    CommandRunner<GraphType::GD> CR(G, VC);

//     std::vector< GraphType::GD::VersionIndex> versions = query["versions"].template get<std::vector<GraphType::GD::VersionIndex>>();
//     std::vector<GraphType::GD::Index> vertexLabels = query["vertexLabels"].template get<std::vector<GraphType::GD::Index>>();
//     std::vector<GraphType::GD::Index> edgeLabels = query["edgeLabels"].template get<std::vector<GraphType::GD::Index>>();    
            
    
             
    json queryResponse = CR.run(query);
                

    auto RF =  Response().formatResponse(queryResponse.dump());
 
    int n = write(sockfd, RF.c_str(), RF.size()-1);
    if(n < 0){  
        perror("Write Error:");
    }  
    
    close(sockfd);
    return (0);
}


// void *handleInit_ls(void *args)
// {
//     
// }


void* handlerDispatch(void* args)
{
    int sockfd = ((struct InstanceArgs*)args)->sockfd;
    auto req = readHttp(sockfd);
     
    
    //Special case
    
    //Default
    const Graph* G = ((struct InstanceArgs*)args)->G;
    ViewCache<GraphType::GD>* VC =  ((struct InstanceArgs*)args)->VC;
    return basicHandler(sockfd, *G, *VC, req.second);
//     return serverInstance(args);
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
        
//         if( pthread_create(&thread_id[i], NULL, serverInstance,  (void*)args) != 0 )
    
        if( pthread_create(&thread_id[i], NULL, handlerDispatch,  (void*)args) != 0 )
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
 
