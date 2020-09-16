#pragma once

/** @file RandomWalker.h
 */

#include "vertion.h"
#include "query/IntegratedViewer.h"





template<class Value>
using it = typename std::vector<Value>::const_iterator ;

template<class Index, class Value>
Value computeNormL1(it<Value> begin1, it<Value> end1, it<Value> begin2)
{
    Value retVal=0;

    auto it1 = begin1;
    auto it2 = begin2;
    for(; it1 != end1; ++it1, ++it2)  
        retVal += fabs((*it1) - (*it2));

    return retVal;
}
    

template<class GT>
std::pair<long, std::vector<typename GT::Calc> > LinearAlgebraSolver(
    typename GT::Index nodes,
    const std::vector<typename GT::Value>& rowTotalWeight,
    const std::vector<AugIA<GT>>& IA, 
    const std::vector<typename GT::Index>& JA, 
    const std::vector<typename GT::Value>& A,
    const std::vector<typename GT::Calc>& restartWeights,
    std::vector<typename GT::Calc>& initialRanks,
    typename GT::Calc alpha,
    typename GT::Calc epsilon
)
{
    std::vector<typename GT::Calc> ranks =  std::vector<typename GT::Calc>(initialRanks.begin(), initialRanks.end());

    int iterationsToConvergence=0;
    typename GT::Calc totaldiff = 1.0;
    while(totaldiff > epsilon)
    {
       // std::cout<<"before new next ranks update "<<ranks.size()<<std::endl;
        std::vector<typename GT::Calc> ranksNext(nodes, 0.0 );

        for(typename GT::Index n=0; n<nodes; ++n)
        {
            //outbound nodes
            typename GT::Index lb = IA[n].s1();
            typename GT::Index rb = IA[n].s1() + IA[n].s2();
//         if(rb == lb)        
//             std::cout<<n<<" / "<<nodes<<" : rb "<<rb<<" lb "<<lb <<"("<<A.size()<<")"<<std::endl;
//             std::cout<<"n = "<<n<<std::endl;
            if(lb==rb)
                ranksNext[n] += ranks[n];
            else
            {
                for(typename GT::Index ob=lb; ob<rb; ++ob)
                {
//                     std::cout<<"ob "<<ob<<" JA[ob]"<<JA[ob]<<" : "<<rowTotalWeight[n]<<std::endl;
                    typename GT::Calc normalized = (A[ob]/rowTotalWeight[n]);
                    ranksNext[JA[ob]] +=  normalized*ranks[n]; 
                }
            }
        }

//std::cout<<"before ranksNext update "<<ranks.size()<<" : "<<ranksNext.size()<<" : "<<nodes<<std::endl;
        for(typename GT::Index i=0; i<nodes; ++i) 
        {
            ranksNext[i] = ((1.0-alpha)*ranksNext[i]) + (alpha*restartWeights[i]);
        }
//std::cout<<"before new normL1"<<std::endl;
        
        totaldiff = computeNormL1<typename GT::Index,typename GT::Calc>(ranksNext.begin(), ranksNext.end(), ranks.begin());
        //std::cout<<"RWR iter : "<<iterationsToConvergence<<" : "<<totaldiff<<std::endl;
        ranks = ranksNext;
        ++iterationsToConvergence;
//         return std::make_pair(iterationsToConvergence, ranks);
// std::cout<<iterationsToConvergence<<" "<<totaldiff<<std::endl;
    }
    return std::make_pair(iterationsToConvergence, ranks);
}
    
template<class GT>
std::pair<long, std::vector<typename GT::Calc> > ChebySolver(
    typename GT::Index nodes,
    const std::vector<typename GT::Value>& rowTotalWeight,
    const std::vector<AugIA<GT>>& IA, 
    const std::vector<typename GT::Index>& JA, 
    const std::vector<typename GT::Value>& A,
    const std::vector<typename GT::Calc>& restartWeights,
    std::vector<typename GT::Calc>& initialRanks,
    typename GT::Calc alpha,
    typename GT::Calc epsilon
)
{

    
    int iterationsToConvergence=0;
    typename GT::Calc totaldiff = 1.0;
    std::vector<typename GT::Calc> ranks = std::vector<typename GT::Calc>(initialRanks.begin(), initialRanks.end());
        
    std::vector<typename GT::Calc> mu = std::vector<typename GT::Calc>{ 1.0, 1/(1-alpha), 0.0};
    typename GT::Calc fp1, fp2, fp3;
    std::vector<typename GT::Calc> ranksPrev(nodes, 0 );

    while(totaldiff > epsilon)
    {    
        mu[0] = mu[1];
        mu[1] = mu[2];
        mu[2] = (2.0 / (1.0 - alpha) * mu[1] - mu[0]); 
        
        //I think this is equivalent to weightmatrix.dot()
        std::vector<typename GT::Calc> dotProd(nodes, 0 );
        for(typename GT::Index n=0; n<ranks.size(); ++n)
        {
            //outbound nodes
            typename GT::Index lb = IA[n].s1();
            typename GT::Index rb = IA[n].s1() + IA[n].s2();
            
            if(lb==rb)
                dotProd[n] += ranks[n];
            else
            {
                for(typename GT::Index ob=lb; ob<rb; ++ob)
                {
                    typename GT::Calc normalized = (A[ob]/rowTotalWeight[n]);
                    dotProd[JA[ob]] +=  normalized*ranks[n];
                }
            }

        }

        std::vector<typename GT::Calc> ranksNext(nodes, 0 );

        for(typename GT::Index i=0; i<nodes; ++i)
        {
            fp1 = 2.0 * (mu[1] / mu[2]) * dotProd[i];
            fp2 = (mu[0] / mu[2]) * ranksPrev[i];
            fp3 = (2.0 * mu[1]) / ((1.0 - alpha) * mu[2]) * alpha * restartWeights[i];
            
            ranksNext[i] = fp1 - fp2 + fp3;
        }

        totaldiff = computeNormL1<typename GT::Index,typename GT::Calc>(ranksNext.begin(), ranksNext.end(), ranks.begin());
        ranksPrev = ranks;
        ranks = ranksNext;
        iterationsToConvergence++;    
    }
    return std::make_pair(iterationsToConvergence, ranks);
}
    
    
template<class GT>
using Walk = GraphList<VertexHP<GT>>;

template<class GT>
auto logStandardDeviation(Walk<GT>& walk)
{
    for(auto& e : walk)
    {
        e.value_ = -log(e.value_);
    }
    //compute mean
    double total = 0.0;
    for(const auto& e : walk)
        total += e.value_;
    double mean = total / walk.size();
    
    double o;
    for(const auto& e : walk)
        o += pow((e.value_ - mean),2);
    
    double sigma = sqrt(o/walk.size());
        
    
}

template<class GT> //Note: Intended for global RWR
auto normalizedLog(Walk<GT>& walk, double min, double max)
{
    double maxV = std::numeric_limits<double>::min();
    double minV = std::numeric_limits<double>::max();
    for(auto& e : walk)
    {
        e.value_ = log(e.value_);
        minV = std::min(minV, e.value_);
        maxV = std::max(maxV, e.value_);
    } //between non inclusive 0 and 10ish
    
//     std::cout<<walk<<std::endl;
    
    for(auto& e : walk)
    {
        e.value_ = (max-min) * ((e.value_ - minV ) / (maxV-minV)) + min;
    }
//     std::cout<<walk<<std::endl;
//     for(const auto& e : walk)
//     {
//         min = std::min(min, e.value_);
//         max = std::max(max, e.value_);
// //         sum += e.value_;
//     }
}


/** @class RandomWalker
 * Creates an object associated with a versioned graph for performing random walk with restarts calculations.
 */
template<class GT>
class RandomWalker
{    
    public:
        
        struct Args_Walk
        {
            typename GT::Calc alpha = .15;
            typename GT::Calc epsilon = 1e-5;
            GraphList<VertexS<GT>> initialRanks = GraphList<VertexS<GT>>();
        };
            
        RandomWalker(const IntegratedViewer<GT>& viewer);
        
        
        Walk<GT> walk(const GraphList<VertexS<GT>>&  restartWeights, Args_Walk args=Args_Walk());
        
        template<typename Solver>
        Walk<GT> walk(typename GT::Calc alpha, typename GT::Calc epsilon,  GraphList<VertexHP<GT>> restartWeights, GraphList<VertexHP<GT>> initialRanks, Solver solver);
        
    private:
        //const VGraph<GT>* graph_;
        const IntegratedViewer<GT>* viewer_;
};

template<class GT>
RandomWalker<GT>::RandomWalker(const IntegratedViewer<GT>& viewer)
{
//     graph_ = &graph;
    viewer_ = &viewer;
}

template<class GT>
Walk<GT> RandomWalker<GT>::walk(const GraphList<VertexS<GT>>&  restartWeights, Args_Walk args)
{
    switch(viewer_->getContext())
    {      
        case Context::undirected :
            return walk(args.alpha, args.epsilon, restartWeights, args.initialRanks, ChebySolver<GT>);
        default :
//             std::cout<<"defult rwr solver"<<std::endl;
            return walk(args.alpha, args.epsilon, restartWeights, args.initialRanks, LinearAlgebraSolver<GT>);
    }
}


template<class GT>
template<typename Solver>
Walk<GT> RandomWalker<GT>::walk(typename  GT::Calc alpha, typename  GT::Calc epsilon, GraphList<VertexHP<GT>> restartWeights, GraphList<VertexHP<GT>> initialRanks, Solver solver)
{
    typename GT::Index nodes = viewer_->size().first; 
    const std::vector<AugIA<GT>>& IAU = viewer_->getIA();
    const std::vector<typename GT::Value>& A = viewer_->getA();
    const std::vector<typename GT::Index>& JA = viewer_->getJA();
    
//     for(const auto& e : JA)
//         std::cout<< e<<",";

    //Calculate the row totals for use in row normalization during the dot product loop
    std::vector<typename GT::Value> rowTotalWeight(nodes,0);
    for(typename GT::Index i=0; i<nodes; ++i)
    {
        typename GT::Index lb = IAU[i].s1();
        typename GT::Index rb = IAU[i].s1() + IAU[i].s2();

        for(typename GT::Index ob=lb; ob<rb; ++ob)
            rowTotalWeight[i] += A[ob];
    }

    //Takes the input restart vector, expands it to the correct number of GraphIndexes, and normalizes to sum to 1.0

    restartWeights = restartWeights.expand(nodes);//(G->size(version).nodes_);

    restartWeights = restartWeights.normalize();

    std::vector<typename GT::Calc> ranks;
    std::vector<typename GT::Calc> restartVector = restartWeights.getValues();
    restartWeights.clear();
    
    if(initialRanks.size() != nodes)
        ranks = restartVector; //if initialRanks not provided
    else
        ranks = initialRanks.getValues();
    
//std::cout<<"starting solver"<<std::endl;
    std::pair<long,  std::vector<typename GT::Calc> > result =  solver(nodes, rowTotalWeight, IAU, JA, A, restartVector, ranks, alpha, epsilon);
    
    Walk<GT> retVal;
    for(typename GT::Index i=0; i<result.second.size(); ++i)
        retVal.push_back(VertexHP<GT>(i, result.second[i]));


    std::stringstream ss;
    ss<<"{" 
    <<"\"alpha\": "<<alpha<<", "
    <<"\"epsilon\": " <<epsilon<<", "
    <<"\"iter\": " <<result.first<<""
    <<"}";
// std::cout<<ss.str()<<std::endl;
     return retVal.setHeader(ss.str());
}
