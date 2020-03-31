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
#include "Http.h"

#include <nlohmann/json.hpp>

#include <iostream>
#include <string>


namespace fs = std::experimental::filesystem;
using json = nlohmann::json;


#define MAX_CON 2048


#define BUFFER_SIZE 1024
#define WBUFFER_SIZE 4096



//TODO: Make simple http classes for request and response

//Used to allow caching until server brough back
//TODO: Make this more robust
std::string eTag = std::to_string(rand() % 1000000);


struct InstanceArgs{
    int sockfd;
    const Graph* G;
    ViewCache<GraphType::GD>* VC;
};


void basicHandler(int sockfd, const CommandRunner<GraphType::GD>& CR, const Http& req)
{
    json query = json::parse(req.getBody());
    
//     CommandRunner<GraphType::GD> CR(G, VC);

//     std::vector< GraphType::GD::VersionIndex> versions = query["versions"].template get<std::vector<GraphType::GD::VersionIndex>>();
//     std::vector<GraphType::GD::Index> vertexLabels = query["vertexLabels"].template get<std::vector<GraphType::GD::Index>>();
//     std::vector<GraphType::GD::Index> edgeLabels = query["edgeLabels"].template get<std::vector<GraphType::GD::Index>>();    
            
    
             
    json queryResponse = CR.run(query);
                
    Http res;
    res.setStatus("HTTP/1.1 200 OK");
    res.setHeaders({
        {"Access-Control-Allow-Origin","*"},
        {"Content-Type", "application/json"}
    });
    
    res.send(sockfd, queryResponse.dump());
    
    

//     close(sockfd);
//     return NULL;
}


void handleInit_ls(int sockfd, const CommandRunner<GraphType::GD>& CR)
{
    Http res;
    res.setStatus("HTTP/1.1 200 OK");
    res.setHeaders({
        {"Access-Control-Allow-Origin","*"},
        {"Content-Type", "application/json"},
        {"ETag", "\""+eTag+"\""},
        {"Cache-Control", "max-age=0"}
    });
    
    json queryString = {{"cmd" ,"ls"}};
    json queryResponse = CR.run(queryString);
    
//     std::cout<<queryResponse.dump()<<std::endl;
    
    res.send(sockfd, queryResponse.dump());

//     response.headers().add<Http::Header::ETag>(eTag);
// 
//         
//     if( !request.headers().has<Http::Header::IfNoneMatch>() ||
//         !(request.headers().get<Http::Header::IfNoneMatch>()->value() == eTag)
//     )
//     {
//         std::cout<<"has "<<request.headers().has<Http::Header::IfNoneMatch>()<<std::endl;
//         if(request.headers().has<Http::Header::IfNoneMatch>())
//             std::cout<<request.headers().get<Http::Header::IfNoneMatch>()->value()<<std::endl;
    
//     Response R;
    
    
    //Check the etag
//     if()
//     {
//         R.addHeader("ETag: " + eTag);
//         
//         json queryString = {{"cmd" ,"ls"}};
//         json queryResponse = CR.run(queryString);
//         response.send(Http::Code::Ok, queryResponse.dump());
//     }
//     else
//     {
//         response.send(Http::Code::Not_Modified, "");
//     }
}


void* handlerDispatch(void* args)
{
    int sockfd = ((struct InstanceArgs*)args)->sockfd;
    const Graph* G = ((struct InstanceArgs*)args)->G;
    ViewCache<GraphType::GD>* VC =  ((struct InstanceArgs*)args)->VC;
    
//     auto req = readHttp(sockfd);
    
    
    Http req;
    req.rec(sockfd);
    
    
    for(const auto& e : req.getHeaders())
        std::cout<<e.first<<" | "<<e.second<<std::endl;
        
    std::cout<<req.getBody()<<std::endl;
    
    
    std::string uri=  req.getURI();//getResource(req.first);
    
    CommandRunner<GraphType::GD> CR(*G, *VC);
    
    //Get resouce requested
    
    //Special cases ex:cacheable ls
    if(uri=="ls")
    {
//         Response R;
//         R.addHeader("ETag: " + eTag);
        
        
        //Check the Etag and match
        auto it = req.getHeaders().find("if-none-match"); //keys stored as lowercase
        if(it != req.getHeaders().end() && it->second == eTag  )
        {
            Http res;
            res.setStatus("HTTP/1.1 304 Not Modified");
            res.setHeaders({
                {"Access-Control-Allow-Origin","*"},
                {"Content-Type", "application/json"}
            });
            res.send(sockfd, "");
        }
        else
        {
            handleInit_ls(sockfd, CR);
        }
        


            
        
    }
    else //Default
    {
    
    
       

        basicHandler(sockfd, CR, req);
    }
    
    close(sockfd);
    return (0);

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
 
