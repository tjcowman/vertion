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

// #include "Response.h"
#include "Http.h"

#include <nlohmann/json.hpp>

#include <iostream>
#include <string>


namespace fs = std::experimental::filesystem;
using json = nlohmann::json;


// std::ofstream LOG("log.txt");

void TOLOG(std::string message)
{
    LOG<<message<<" "<<std::to_string(rand()*10000) <<std::endl;
}

//#define MAX_CON 2048




//TODO: Make simple http classes for request and response

//Used to allow caching until server brough back
//TODO: Make this more robust
std::string eTag = "\""+std::to_string(rand() % 1000000)+"\"";
pthread_mutex_t lock;

struct InstanceArgs{
    int sockfd;
    const Graph* G;
    ViewCache<GraphType::GD>* VC;
};


void basicHandler(int sockfd, const CommandRunner<GraphType::GD>& CR, const Http& req)
{
    json query = json::parse(req.getBody());
// //     TOLOG("parsed json fd(" +std::to_string(sockfd)+ "): " + query.dump());


    std::vector< GraphType::GD::VersionIndex> versions = query["versions"].template get<std::vector<GraphType::GD::VersionIndex>>();
    std::vector<GraphType::GD::Index> vertexLabels = query["vertexLabels"].template get<std::vector<GraphType::GD::Index>>();
    std::vector<GraphType::GD::Index> edgeLabels = query["edgeLabels"].template get<std::vector<GraphType::GD::Index>>();    
            
    pthread_mutex_lock(&lock);
    CR.viewCache_->lockView(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)) ;
    pthread_mutex_unlock(&lock);
             
    json queryResponse = CR.run(query);
                
    pthread_mutex_lock(&lock);
    CR.viewCache_->unlockView(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)) ;
    pthread_mutex_unlock(&lock);
    
    
    Http res;
    res.setStatus("HTTP/1.1 200 OK");
    res.setHeaders({
        {"Access-Control-Allow-Origin","*"},
        {"Content-Type", "application/json"}
    });
    
    res.send(sockfd, queryResponse.dump());
//     TOLOG("sent reply fd(" +std::to_string(sockfd)+ ")");
    

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
        {"ETag", eTag},
        {"Cache-Control", "max-age=20"}
    });
    
    json queryString = {{"cmd" ,"ls"}};
    json queryResponse = CR.run(queryString);
    
//     std::cout<<queryResponse.dump()<<std::endl;
    
    res.send(sockfd, queryResponse.dump());

}


void* handlerDispatch(void* args)
{
    int sockfd = ((struct InstanceArgs*)args)->sockfd;
    const Graph* G = ((struct InstanceArgs*)args)->G;
    ViewCache<GraphType::GD>* VC =  ((struct InstanceArgs*)args)->VC;
    
//     auto req = readHttp(sockfd);
    
    
    Http req;
    req.rec(sockfd);
    
    
//     for(const auto& e : req.getHeaders())
//         std::cout<<e.first<<" | "<<e.second<<std::endl;
//         
//     std::cout<<req.getBody()<<std::endl;
//     
//     
    std::string uri=  req.getURI();//getResource(req.first);
//     std::cout<<"URI = :"<<uri<<std::endl;
    
    CommandRunner<GraphType::GD> CR(*G, *VC);
    
    //Get resouce requested
    //std
    //Special cases ex:cacheable ls
    if(uri=="/ls")
    {
//         Response R;
//         R.addHeader("ETag: " + eTag);
        
//         for(const auto& ee : req.getHeaders())
//             std::cout<<"<"<<ee.first<<">"<<" "<<"<"<<ee.second<<">"<<std::endl; 
        
        
        //Check the Etag and match
        auto it = req.getHeaders().find("if-none-match"); //keys stored as lowercase
        
//         if(it != req.getHeaders().end())
//         {
//             std::cout<<"<"<<it->first<<">"<<" : "<<"<"<<it->second<<">"<<" ::: "<<"<"<<eTag<<">"<<std::endl;
//         }
        
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
    
//     TOLOG("closed fd(" +std::to_string(sockfd)+ ")");
    close(sockfd);
   
    pthread_exit(NULL);

}

int startServer_hgraph(int portNumber, int threads, const Graph* G,  ViewCache<GraphType::GD>* VC)
{
    struct sockaddr_in serv_addr, cli_addr;
    socklen_t clilen;
    
    
    int sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sockfd < 0) 
        std::cerr<<"ERROR opening socket";
    
    int reuse=1;
    if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(int)) < 0)
        std::cerr<<"setsockopt(SO_REUSEADDR) failed"<<std::endl;
    
    
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    serv_addr.sin_port = htons(portNumber);

    if (bind(sockfd, (struct sockaddr *) &serv_addr,
        sizeof(serv_addr)) < 0) 
        std::cout<<"ERROR on binding";
    listen(sockfd,50);
    clilen = sizeof(cli_addr);
    
// std::cout<<"threads "<<threads<<std::endl;
  
    pthread_t thread_id[threads];
    int i = 0;

    while(true)
    {
        int newsockfd = accept(sockfd,(struct sockaddr *) &cli_addr, &clilen);
        if (newsockfd < 0) 
            std::cout<<"ERROR on accept"<<std::endl;
//         TOLOG("connection accepted: fd "+std::to_string(newsockfd));
        
        
        InstanceArgs* args = new InstanceArgs;
        args->sockfd = newsockfd;
        args->G = G;
        args->VC = VC;

    
        if( pthread_create(&thread_id[i], NULL, handlerDispatch,  (void*)args) != 0 )
        {
            std::cout<<"Failed to create thread"<<std::endl;
           //printf("Failed to create thread\n");
            exit(1);
        }
        ++i;
        
//          std::cout<<"i "<<i<<std::endl;
        //Once n threads have been created wait until they all finish
        if( i >= (threads))
        {
            std::cout<<"i at join "<<i<<std::endl;
//             TOLOG("waiting " + std::to_string(i) +" threads created");
            i = 0;

            while(i < threads)
            {
                pthread_join(thread_id[i++],NULL);

            }
            //Run a viewCache Cleanup
            pthread_mutex_lock(&lock);
// std::cout<<"cleanb"<<std::endl;
//sleep(1);
            VC->clean();
            
//             std::cout<<"cleana"<<std::endl;
            pthread_mutex_unlock(&lock);
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
     
     if(args.cacheSize<args.threads)
     {
         args.cacheSize = args.threads+1; //TODO: BUG?: Cache size needs to be > 2xnum of possible threads
        std::cout<<"[warn] cacheSize increased to "<<args.cacheSize<<std::endl;
     }
    
     
    Graph G(Context::undirected);
    GraphIO IO(G);
    IO.read_serial(args.graph);
    ViewCache<GraphType::GD> VC(G,  lock, args.cacheSize);
    
     std::cout<<G.size()<<std::endl;
    startServer_hgraph(args.port, args.threads, &G, &VC);


    return 0;
}
 
