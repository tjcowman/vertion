#include "vertion.h"
#include "CommandRunner.h"

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
        
        void onRequest(const Http::Request& request, Http::ResponseWriter response) override
        {
            std::cout<<"Request: " + request.body()<<std::endl;
            std::cout<<eTag<<std::endl;
            CommandRunner<GraphType::GD> CR(*graph_);
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
                json queryResponse = CR.run(queryString);
                
                response.headers().add<Http::Header::AccessControlAllowOrigin>("*");
                response.headers().add<Http::Header::ContentType>("application/json");
                response.send(Http::Code::Ok, queryResponse.dump());
            }
        }
};

std::string HelloHandler::eTag;
const Graph* HelloHandler::graph_;


struct Args
{
    int port=-1;
    std::string graph="";
    std::string mode="";

};

int main(int argc, char* argv[] )
{
    srand (time(NULL));
    
     ARGLOOP(,
        ARG(port,stoi)
        ARG(graph,)

        ARG(mode,)

    );
     
    Http::Header::Registry::instance().registerHeader<Http::Header::ETag>();
    Http::Header::Registry::instance().registerHeader<Http::Header::IfNoneMatch>();
    
    HelloHandler::eTag = std::to_string(rand() % 1000000);

    Graph G(Context::undirected);
    GraphIO IO(G);
    
    IO.read_serial(args.graph);
    
     HelloHandler::graph_ = &G;
//     Http::listenAndServe<HelloHandler>(Address("*:"+std::to_string(args.port)));
    
    
    auto server = std::make_shared<Http::Endpoint>(Address("*:"+std::to_string(args.port)));
    auto opts = Http::Endpoint::options()
//       .maxPayload(m_max_payload)
      .threads(2)
      .flags(Tcp::Options::ReuseAddr);
    
    server->init(opts);
    server->setHandler(Http::make_handler<HelloHandler>());
    server->serveThreaded();
    
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
    
//     Address addr(Ipv4::any(), Port(std::to_string(args.port)));
// 
//     auto opts = Http::Endpoint::options().threads(1);
//     Http::Endpoint server(addr);
//     server.init(opts);
//     
// //     HelloHandler
//     server.setHandler(std::make_shared<HelloHandler>());
//     server.serve();



    return 0;
}
 
 
