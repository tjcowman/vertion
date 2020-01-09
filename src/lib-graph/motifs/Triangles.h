#pragma once

#include <array>
#include "vertion.h"

template<class GT>
struct Triangle
{
    using Index  =  typename GT::Index;
    
    //NOTE: the labels do not correspond to specific nodes, just that that edge exists
    Triangle( std::array<EdgeLabel<GT>,3> labels=std::array<EdgeLabel<GT>,3>(),  std::array<Index,3> nodes=std::array<Index,3>() ) : labels_(labels), nodes_(nodes)
    {
        std::sort(labels_.begin(), labels_.end());
        std::sort(nodes_.begin(), nodes_.end());
    }
    
    
    const std::array< EdgeLabel<GT>, 3>& getLabels()const 
    {
        return labels_;
    }
    

    EdgeLabel<GT> And()const //All 3 pattern
    {
        return std::accumulate(labels_.begin(), labels_.end(), EdgeLabel<GT>(), [](const auto&a, const auto&b){return a.getBits() & b.labels_.getBits();});
    }
    
    EdgeLabel<GT> Xor()const //Only 1 pattern
    {
        return std::accumulate(labels_.begin(), labels_.end(), EdgeLabel<GT>(), [](const auto&a, const auto&b){return a.getBits() ^ b.labels_.getBits();});
    }
    
    EdgeLabel<GT> AndXor()const //Two and only two pattern
    {
        auto bits = (labels_[0].labels_.getBits() ^ labels_[1].labels_.getBits()) & (labels_[1].labels_.getBits() ^ labels_[2].labels_.getBits());
    }
    
    static Index labelsSize(){
        return EdgeLabel<GT>::size();
    }
    
    std::array< EdgeLabel<GT>, 3> labels_;
    std::array< Index, 3> nodes_;

    friend std::ostream& operator<<(std::ostream& os, const Triangle<GT>& e)
    {
        os<<e.labels_.at(0)<<" : "<<e.labels_.at(1)<<" : "<<e.labels_.at(2)<<"("<<e.nodes_.at(0)<<","<<e.nodes_.at(1)<<","<<e.nodes_.at(2)<<")";
        return os;
    }
};

template<class GT>
class Triangles
{
    public:
        Triangles(const VGraph<GT>& graph, typename GT::VersionIndex version);
        
        //NOTE: This considers directional reachability during search but returns undirected edges
        void enumerate();
        auto countMotifs()const;
    
    private:
        const VGraph<GT>* graph_;
        typename GT::VersionIndex version_;
        std::vector<Triangle<GT> > motifs_;
};

template<class GT>
Triangles<GT>::Triangles(const VGraph<GT>& graph, typename GT::VersionIndex version)
{
    graph_ = &graph;
    version_ = version;
}

template<class GT>
void Triangles<GT>::enumerate()
{
    GraphList<VertexI<GT>> nodeDegrees = graph_->getDegrees(version_).select([](const auto& e ){return e.value_ > 1;});

    for(const auto& u : nodeDegrees )
    {
        auto row1 = graph_->template getRowVersion<Row::JAL>(u.index_, version_);
        
        for(const auto& v : row1 )
        {
            if(v.first > u.index_)
            {
                auto row2 = graph_->template getRowVersion<Row::JAL>(v.first, version_);
            
                //seperately get the intersections to obtain the directional labels
                std::vector<std::pair<typename GT::Index, EdgeLabel<GT>> > res1;
                std::set_intersection(row1.begin(), row1.end(), row2.begin(), row2.end(), std::back_inserter(res1), [](const auto& e1, const auto& e2){return e1.first < e2.first;});
            
                std::vector<std::pair<typename GT::Index, EdgeLabel<GT>> > res2;
                std::set_intersection(row2.begin(), row2.end(), row1.begin(), row1.end(), std::back_inserter(res2), [](const auto& e1, const auto& e2){return e1.first < e2.first;});
                
                // for(const auto& e : res)
                auto ite1 = res1.begin();
                auto ite2 = res2.begin();
                
                while(ite1 != res1.end())
                {
                    if(ite1->first > v.first)
                    {
                        motifs_.push_back(Triangle<GT>( {v.second, ite1->second, ite2->second}, {u.index_, v.first, ite1->first} ));
//                                 std::array<Edge<T>,3>{
//                                 Edge<T>{u.index_, v.first, 1, v.second},
//                                 Edge<T>{v.first, ite1->first, 1,  ite1->second},
//                                 Edge<T>{u.index_, ite2->first, 1, ite2->second}
                        //});
                    }
                    ++ite1;
                    ++ite2;
                }
            }
            
        }
    }

}

template<class GT>
auto Triangles<GT>::countMotifs()const
{
    std::map< std::array<EdgeLabel<GT>, 3>, typename GT::Index> counts;
    
    for(const auto e : motifs_)
    {
        ++counts[e.getLabels()] ;    
    }
    return counts;
}
