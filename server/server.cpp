#include "vertion.h"
#include "CommandRunner.h"
#include "ViewCache.h"

#include <pistache/endpoint.h>

#include <nlohmann/json.hpp>

#include <iostream>
#include <string>

using namespace Pistache;
using json = nlohmann::json;

namespace Pistache::Http::Header
{
    class ETag : public Header 
    {
        public:
            NAME("ETag")

            ETag(std::string value="") : value_(value) {}



            void parse(const std::string& value)override{
                value_=value;
            }

            void write(std::ostream& os)const override {
                os<<value_;
            }


        private:
            std::string value_;
    };
    
    class IfNoneMatch : public Header 
    {
        public:
            NAME("If-None-Match")

            IfNoneMatch(std::string value="") : value_(value) {}

            const std::string& value()const{return value_;}

            void parse(const std::string& value)override{
                value_=value;
            }

            void write(std::ostream& os)const override {
                os<<value_;
            }


        private:
            std::string value_;
    };
    


}
  



class HelloHandler : public Http::Handler
{
    public:
        
        static  std::string eTag;
        
        HTTP_PROTOTYPE(HelloHandler)
        static const Graph* graph_;
        static ViewCache<GraphType::GD>* viewCache_;
        static int activeComputes_;
        static int maxActiveComputes_;
        
        void onRequest(const Http::Request& request, Http::ResponseWriter response) override
        {

            
            
            std::cout<<"Request: " + request.body()<<std::endl;
// //               std::cout<<*viewCache_<<std::endl;
            std::cout<<eTag<<std::endl;
            CommandRunner<GraphType::GD> CR(*graph_, *viewCache_);
            if (request.resource() == "/ls") 
            {

                
                response.headers().add<Http::Header::AccessControlAllowOrigin>("*");
                response.headers().add<Http::Header::ContentType>("application/json");
                response.headers().add<Http::Header::ETag>(eTag);
                response.headers().add<Http::Header::CacheControl>(
                    Http::CacheDirective(Http::CacheDirective::Directive::MaxAge, std::chrono::seconds(10) )
                        
                );
                    
                if( !request.headers().has<Http::Header::IfNoneMatch>() ||
                    !(request.headers().get<Http::Header::IfNoneMatch>()->value() == eTag)
                )
                {
                    std::cout<<"has "<<request.headers().has<Http::Header::IfNoneMatch>()<<std::endl;
                    if(request.headers().has<Http::Header::IfNoneMatch>())
                        std::cout<<request.headers().get<Http::Header::IfNoneMatch>()->value()<<std::endl;
                    
                    json queryString = {{"cmd" ,"ls"}};
                    json queryResponse = CR.run(queryString);
                    response.send(Http::Code::Ok, queryResponse.dump());
                }
                else
                {
                    response.send(Http::Code::Not_Modified, ""/*queryResponse.dump()*/);
                }
                
//                 if( request.headers().get<Http::Header::IfNoneMatch>()->value() == eTag)
           
           
                
                 
            }  
            else    
            {
                json queryString = json::parse(request.body());
                std::vector< GraphType::GD::VersionIndex> versions = queryString["versions"].template get<std::vector<GraphType::GD::VersionIndex>>();
                std::vector<GraphType::GD::Index> vertexLabels = queryString["vertexLabels"].template get<std::vector<GraphType::GD::Index>>();
                std::vector<GraphType::GD::Index> edgeLabels = queryString["edgeLabels"].template get<std::vector<GraphType::GD::Index>>();    
                
                #pragma omp critical
                {
                        
                    viewCache_->lockView(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)) ;
                    ++activeComputes_;

//                     if(viewCache_->full())
//                     {
//                         std::cout<<"FULL"<<std::endl;
// //                         sleep(5);
//                         viewCache_->clean();
//                     }
//                      while(activeComputes_>maxActiveComputes_){/*usleep(5000);*/

//                     }
//                     if(viewCache_->full())
//                         viewCache_->clean();
                }
                
//                 while(viewCache_->full()){usleep(5000);}
               
                
             
                json queryResponse = CR.run(queryString);
                
            
                
                
                response.headers().add<Http::Header::AccessControlAllowOrigin>("*");
                response.headers().add<Http::Header::ContentType>("application/json");
                response.send(Http::Code::Ok, queryResponse.dump());
                
                #pragma omp critical
                {
                    viewCache_->unlockView(versions, VertexLab(vertexLabels), EdgeLab(edgeLabels)) ;
                    --activeComputes_;
                }
                std::cout<<"unlocked"<<std::endl;

            }
            
          
        }
};

std::string HelloHandler::eTag;
const Graph* HelloHandler::graph_;
ViewCache<GraphType::GD>* HelloHandler::viewCache_;
int HelloHandler::activeComputes_;
int HelloHandler::maxActiveComputes_;

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
    srand (time(NULL));
    
     ARGLOOP(,
        ARG(port,stoi)
        ARG(graph,)

        ARG(cacheSize, stoi) //Needs to be > threads for the server so in use views dont get deleted
        ARG(mode,)
        
        ARG(threads, stoi)

    );
     
     
     
    Http::Header::Registry::instance().registerHeader<Http::Header::ETag>();
    Http::Header::Registry::instance().registerHeader<Http::Header::IfNoneMatch>();
    
    HelloHandler::eTag = std::to_string(rand() % 1000000);

    Graph G(Context::undirected);
    GraphIO IO(G);
    
    IO.read_serial(args.graph);
    
    HelloHandler::graph_ = &G;
    ViewCache<GraphType::GD> VC(G, args.cacheSize);
    HelloHandler::viewCache_ = &VC;
    HelloHandler::activeComputes_ = 0;
    HelloHandler::maxActiveComputes_ = args.threads;
//     Http::listenAndServe<HelloHandler>(Address("*:"+std::to_string(args.port)));
    
    
    auto server = std::make_shared<Http::Endpoint>(Address("*:"+std::to_string(args.port)));
    auto opts = Http::Endpoint::options()
//       .maxPayload(m_max_payload)
      .threads(args.threads)
      .flags(Tcp::Options::ReuseAddr);
//       .backlog(5);
    
    server->init(opts);
    server->setHandler(Http::make_handler<HelloHandler>());
    
// #pragma omp sections
    {
//         #pragma omp section
        {
        
            server->serveThreaded();
        }
        
//           #pragma omp section
        {
            while(true)
            {
                sleep(1);
//                 std::cout<<"CLEAN CHECK B" << HelloHandler::viewCache_->views_.size()<<" : "<<HelloHandler::viewCache_->viewUsers_.size()<<std::endl;
                if (HelloHandler::viewCache_->full())
                {
        //             #pragma omp critical
                    {
                    HelloHandler::viewCache_->clean();
                    }
                }
//                 std::cout<<"CLEAN CHECK A" << HelloHandler::viewCache_->views_.size()<<" : "<<HelloHandler::viewCache_->viewUsers_.size()<<std::endl;
            }
        }
    
    }
    while(true)
    {
        std::string input;
        std::cin>>input;
        if(input =="q")
        {
            server->shutdown();
            exit(0);
        }
    }
    

    return 0;
}
 
 
