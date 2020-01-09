#pragma once

/** @file RandomWalker.h
 */

#include "vertion.h"


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
        std::vector<typename GT::Calc> ranksNext(nodes, 0 );

        //#pragma omp parallel for num_threads(4)
        for(typename GT::Index n=0; n<nodes; ++n)
        {
            //outbound nodes
            typename GT::Index lb = IA[n].s1();
            typename GT::Index rb = IA[n].s1() + IA[n].s2();
            
            
            if(lb==rb)
                ranksNext[n] += ranks[n];
            else
            {
                for(typename GT::Index ob=lb; ob<rb; ++ob)
                {
                    typename GT::Calc normalized = (A[ob]/rowTotalWeight[n]);
                    ranksNext[JA[ob]] +=  normalized*ranks[n]; 
                }
            }
        }

        for(typename GT::Index i=0; i<nodes; ++i) 
        {
            ranksNext[i] = ((1.0-alpha)*ranksNext[i]) + (alpha*restartWeights[i]);
        }

        
        totaldiff = computeNormL1<typename GT::Index,typename GT::Calc>(ranksNext.begin(), ranksNext.end(), ranks.begin());
        ranks = ranksNext;
        iterationsToConvergence++;
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
            
        RandomWalker(const VGraph<GT>& graph);
        
        
        Walk<GT> walk(const GraphList<VertexS<GT>>&  restartWeights, int version, Args_Walk args=Args_Walk());
        template<typename Solver>
        Walk<GT> walk(typename GT::Calc alpha, typename GT::Calc epsilon,  GraphList<VertexHP<GT>> restartWeights, int version, GraphList<VertexHP<GT>> initialRanks, Solver solver);
        
    private:
        const VGraph<GT>* graph_;
    
};

template<class GT>
RandomWalker<GT>::RandomWalker(const VGraph<GT>& graph)
{
    graph_ = &graph;
}

template<class GT>
Walk<GT> RandomWalker<GT>::walk(const GraphList<VertexS<GT>>&  restartWeights, int version, Args_Walk args)
{
    switch(graph_->getContext())
    {      
        case Context::undirected :
            return walk(args.alpha, args.epsilon, restartWeights, version, args.initialRanks, ChebySolver<GT>);
        default :
            return walk(args.alpha, args.epsilon, restartWeights, version, args.initialRanks, LinearAlgebraSolver<GT>);
    }
}


template<class GT>
template<typename Solver>
Walk<GT> RandomWalker<GT>::walk(typename  GT::Calc alpha, typename  GT::Calc epsilon, GraphList<VertexHP<GT>> restartWeights, int version, GraphList<VertexHP<GT>> initialRanks, Solver solver)
{
    const VGraph<GT> * G = graph_;

    typename GT::Index nodes = G->size(version).nodes_;
    const std::vector<AugIA<GT>>& IAU = G->getIA(version);
    const std::vector<typename GT::Value>& A = G->getA();
    const std::vector<typename GT::Index>& JA = G->getJA();

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

    restartWeights = restartWeights.expand(G->size(version).nodes_);

    restartWeights = restartWeights.normalize();

    std::vector<typename GT::Calc> ranks;
    std::vector<typename GT::Calc> restartVector = restartWeights.getValues();
    restartWeights.clear();
    
    if(initialRanks.size() != nodes)
        ranks = restartVector; //if initialRanks not provided
    else
        ranks = initialRanks.getValues();
    

    std::pair<long,  std::vector<typename GT::Calc> > result =  solver(nodes, rowTotalWeight, IAU, JA, A, restartVector, ranks, alpha, epsilon);
    
    Walk<GT> retVal;
    for(typename GT::Index i=0; i<result.second.size(); ++i)
        retVal.push_back(VertexHP<GT>(i, result.second[i]));

//     
    std::string header = std::string("PageRank Result; ") 
    + "alpha " + std::to_string(alpha) + "; "
    + "epsilon " + std::to_string(epsilon) + "; "
    + "version " + std::to_string(version) + "; "
    + "convergence " + std::to_string(result.first) + "; ";
// 
     return retVal.setHeader(header);
}
