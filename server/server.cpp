#include "vertion.h"
#include "CommandRunner.h"

#include <pistache/endpoint.h>

#include <nlohmann/json.hpp>

#include <iostream>
#include <string>

using namespace Pistache;
using json = nlohmann::json;


class HelloHandler : public Http::Handler
{
    public:

        HTTP_PROTOTYPE(HelloHandler)
        static const Graph* graph_;
        

        void onRequest(const Http::Request& request, Http::ResponseWriter response) override
        {
            CommandRunner<GraphType::GD> CR(*graph_);
            
            std::cout<<"Request: " + request.body()<<std::endl;
            
            json queryString = json::parse(request.body());
            json queryResponse = CR.run(queryString);
            
            //std::cout<<graph_->size()<<std::endl;
            
            response.headers().add<Http::Header::AccessControlAllowOrigin>("*");
            response.headers().add<Http::Header::ContentType>("application/json");
            response.send(Http::Code::Ok, queryResponse.dump());
        }
};
const Graph* HelloHandler::graph_;


struct Args
{
    int port=-1;
    std::string graph="";
    std::string mode="";

};

int main(int argc, char* argv[] )
{
    
    
     ARGLOOP(,
        ARG(port,stoi)
        ARG(graph,)

        ARG(mode,)

    );


    Graph G(Context::undirected);
    GraphIO IO(G);
    
    IO.read_serial(args.graph);
    
    HelloHandler::graph_ = &G;
    Http::listenAndServe<HelloHandler>(Address("*:"+std::to_string(args.port)));
    
    
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
 
 
