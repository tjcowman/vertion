#include <vector>

#include <sys/socket.h>
#include <netinet/in.h>
#include <sys/signal.h>
//#include <pthread.h>
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

#include <thread>
#include <mutex>
#include <condition_variable>

namespace fs = std::experimental::filesystem;
using json = nlohmann::json;


// std::ofstream LOG("log.txt");

// void TOLOG(std::string message)
// {
//     LOG<<message<<" "<<std::to_string(rand()*10000) <<std::endl;
// }

//#define MAX_CON 2048

std::mutex threadLock;


std::mutex acceptLock;
std::condition_variable cv;


//TODO: Make simple http classes for request and response

//Used to allow caching until server brough back
//TODO: Make this more robust
std::string eTag = "\""+std::to_string(rand() % 1000000)+"\"";
// pthread_mutex_t lock;

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
            
//     pthread_mutex_lock(&lock);
//     CR.viewCache_->lockView(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)) ;
//     pthread_mutex_unlock(&lock);
             
    json queryResponse = CR.run(query);
                
//     pthread_mutex_lock(&lock);
//     CR.viewCache_->unlockView(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)) ;
//     pthread_mutex_unlock(&lock);
    
    
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




void handlerDispatchSL(int sockfd, std::set<int>* threadSlots, int threadId, const Graph* G, ViewCache<GraphType::GD>* VC)
{
    Http req;
    req.rec(sockfd);

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

    threadLock.lock();
    threadSlots->insert(threadId);
    std::cout<<"re-enabled "<<threadId<<std::endl;
    threadLock.unlock();
    
    cv.notify_one();
//     acceptLock.unlock();
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
    

    std::vector<std::thread> thread_id(threads);
    
    
    std::set<int> threadSlots;
        for(int i=0; i<threads; ++i)
            threadSlots.insert(threadSlots.end(), i);

        
//     int i = 0;
    while(true)
    {
        

        
        //check if versionCache full
        if(VC->full())
        {
            //join running
//              std::cout<<"joining"<<std::endl;
                //clean
//             for(int t=0; t<thread_id.size(); ++t)
//             {
//              if(thread_id[t].joinable())
//                 thread_id[t].join();
//             }   
//             
            auto clean_thread = std::thread(&ViewCache<GraphType::GD>::clean, VC);
            clean_thread.detach();
//             std::cout<<"Thread created"<<std::endl;
//             VC->clean();
        }
        
        if(threadSlots.size() <= 1)
        {
            std::unique_lock<std::mutex> lk(acceptLock);
            cv.wait(lk);
        }
        
        int newsockfd = accept(sockfd,(struct sockaddr *) &cli_addr, &clilen);
        if (newsockfd < 0) 
            std::cout<<"ERROR on accept"<<std::endl;
        
        std::cout<<"conn acc on "<<newsockfd<<std::endl;
//         TOLOG("connection accepted: fd "+std::to_string(newsockfd));
        


    

        
        //get empty threadSlot
        threadLock.lock();
        auto lastE = (--threadSlots.end());
        int threadId = (*lastE);
        
        threadSlots.erase(lastE);
        std::cout<<threadId<<" "<<threadSlots.size()<<std::endl;
        threadLock.unlock();
        
        

        
        if(thread_id[threadId].joinable())
            thread_id[threadId].join();
        thread_id[threadId] = std::thread(handlerDispatchSL, newsockfd, &threadSlots, threadId,  G, VC);

        
        

    }
  
    
}





struct Args
{
    int port = -1;
    std::string graph = "";
    std::string mode = "";
//     int cacheSize = 10; 
    int cacheFactor = 2;
    
    int threads = 1;

};

int main(int argc, char* argv[] )
{

    
     ARGLOOP(,
        ARG(port,stoi)
        ARG(graph,)

//         ARG(cacheSize, stoi) //Needs to be > threads for the server so in use views dont get deleted
        ARG(cacheFactor,stoi)
        ARG(mode,)
        
        ARG(threads, stoi)
    );
     
//      if(args.cacheSize<args.threads)
//      {
//          args.cacheSize = args.threads+1; //TODO: BUG?: Cache size needs to be > 2xnum of possible threads
//         std::cout<<"[warn] cacheSize increased to "<<args.cacheSize<<std::endl;
//      }
    
     
    Graph G(Context::undirected);
    GraphIO IO(G);
    IO.read_serial(args.graph);
    G.temp_populate_IACache();
    
    ViewCache<GraphType::GD> VC(G, args.threads, args.cacheFactor);
    
     std::cout<<G.size()<<std::endl;
    startServer_hgraph(args.port, args.threads, &G, &VC);


    return 0;
}
 
