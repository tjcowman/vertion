#pragma once
//#include "Graph.h"

#include <sys/stat.h> //mkdir
#include <algorithm>
#include <iostream>
#include <fstream>
#include <cstdio>
#include <vector>
#include <sstream>

#include <unistd.h>




template<class T>
class VGraphIO
{
    
    public:
        using Index = typename T::Index;
        using Value = typename T::Value;
        
        VGraphIO(VGraph<T>& graph);
        
        
        void write_serial(std::string hgraphFileName)const;
        
        void write_serial_IA(const VGraph<T> & G, std::ostream & stream)const;
        void write_serial_JA(const VGraph<T> & G, std::ostream & stream)const;
        void write_serial_A(const VGraph<T> & G, std::ostream & stream)const;
        void write_serial_contextVersion(const VGraph<T> & G, std::ostream & stream)const;
        void write_serial_L(const VGraph<T> & G, std::ostream & stream)const;
        
        
        void read_serial(std::string hgraphFileName)const;
        
        void read_serial_IA(VGraph<T> & G, std::istream & stream)const;
        void read_serial_JA(VGraph<T> & G, std::istream & stream)const;
        void read_serial_A(VGraph<T> & G, std::istream & stream)const;
        void read_serial_contextVersion(VGraph<T> & G, std::istream & stream)const;
        void read_serial_L(VGraph<T> & G, std::istream & stream)const;
        
        
        int write_csr(std::string csrFileName)const;

        
        void write_serial_IA_CSR(const VGraph<T> & G, std::ostream & stream)const;
        
        void write_csr(const VGraph<T> & G, std::ostream & stream)const;
        void write_serial(const VGraph<T> & G, std::ostream & stream)const;
        void read_serial(VGraph<T> & G, std::istream & stream)const;
    
        
        
    private:
        
         VGraph<T>* graph_;

};

template<class T>
VGraphIO<T>::VGraphIO(VGraph<T>& graph)
{
    graph_= &graph;
}

template<class T>
void VGraphIO<T>::write_serial(std::string hgraphFileName)const
{
    mkdir(hgraphFileName.c_str(), S_IRWXU);
    
//     #pragma omp parallel sections
    {
//         #pragma omp section
        {
            std::ofstream OF;
            //Write the node label data
            OF.open(hgraphFileName + "/nodes");
            graph_->vertexData_.write_serial(OF);

            OF.close();
        }
        
//         #pragma omp section
        {
            std::ofstream OF;
            //Write the version tag data
            OF.open(hgraphFileName + "/tags");
                OF<<graph_->versionTags_<<std::endl;
            OF.close();
            
            //Write the IA vectors
            OF.open(hgraphFileName + "/iavec");
                write_serial_IA(*graph_, OF);
            OF.close();
            
            //Write the A vectors
            OF.open(hgraphFileName + "/avec");
                write_serial_A(*graph_, OF);
            OF.close();
            
            //Write the JA vectors
            OF.open(hgraphFileName + "/javec");
                write_serial_JA(*graph_, OF);
            OF.close();
            
            //Write the version Data 
            OF.open(hgraphFileName + "/versions");
                write_serial_contextVersion(*graph_, OF);
            OF.close();
            
            //Write labels data
            OF.open(hgraphFileName + "/lvec");
                write_serial_L(*graph_, OF);
            OF.close();
        }
    }
//     return 0;
}

template<class T>
void VGraphIO<T>::read_serial(std::string hgraphFileName)const
{
    struct stat st;
    if(stat(hgraphFileName.c_str(), &st) != 0)
    {
        std::cerr<<"[ERROR] "<<hgraphFileName<<" does not exist"<<std::endl;
        return;
    }

        
//     #pragma omp parallel sections
    {
//         #pragma omp section
        {
            std::ifstream IF(hgraphFileName + "/nodes");
            
            graph_->vertexData_.read_serial(IF);

            IF.close();
        
        }
        
//         #pragma omp section
        {
            std::ifstream IF;
            //Read the version tag data
            IF.open(hgraphFileName + "/tags");
                IF>>graph_->versionTags_;
            IF.close();
            
            //Read the IA vectors
            IF.open(hgraphFileName + "/iavec");
                read_serial_IA(*graph_, IF);
            IF.close();
            
            //Read the A vectors
            IF.open(hgraphFileName + "/avec");
                read_serial_A(*graph_, IF);
            IF.close();
            
            //Read the JA vectors
            IF.open(hgraphFileName + "/javec");
                read_serial_JA(*graph_, IF);
            IF.close();
            
            //Read the version Data
            IF.open(hgraphFileName + "/versions");
                read_serial_contextVersion(*graph_, IF);
            IF.close();
            
            //Read labels data
            IF.open(hgraphFileName + "/lvec");
                read_serial_L(*graph_, IF);
            IF.close();
        }
    }
}

template<class T>
void VGraphIO<T>::write_serial_L(const VGraph<T> & G, std::ostream & stream)const
{
    //write labelsUsed
//     stream<<G.edgeLabelNames_.size()<<"\n";
//     
//     //write labelNames 
//     for(const auto& e : G.edgeLabelNames_)
//         stream<<e<<"\n";
    
    G.LMap_.write_serial(stream);
    
    //write the number of elements
    stream<<G.L_.size()<<"\n";
    
    //write the elements
    stream.write(reinterpret_cast<const char*>(&G.L_[0]), G.L_.size()*sizeof(EdgeLabel<T>));
    
}

template<class T>
void VGraphIO<T>::read_serial_L(VGraph<T> & G, std::istream & stream)const
{
    //read the number of bits for labels
   // stream>>EdgeLabel<T>::max<<"\n";
    
    //read labelsUsed
//     int labelsUsed;
    //stream>>EdgeLabel<T>::slotsUsed_;
//     stream>>labelsUsed;
    
    G.LMap_.read_serial(stream);
    
    //read labelNames 
//     for(size_t i=0; i < labelsUsed; ++i)
//     {
//         std::string name;
//         stream>>name;
//         G.edgeLabelNames_.push_back(name); //EdgeLabel<T>::names_[i];
//         G.labelMappings_.insert({name,G.labelMappings_.size()});
//     }
    //read the number of elements
    size_t elements;
    stream>>elements;
    //stream>>G.L_.size()<<"\n";
    stream.ignore(1); //NOTE: Need to discard the end of line after the stream read
    //read the elements
   // std::cout<<"soze "<<elements<<std::endl;
    G.L_.resize(elements);
    //std::cout<<sizeof(EdgeLabel<T>)<<std::endl;
    
    //stream.write(reinterpret_cast<const char*>(&G.L_[0]), G.L_.size()*sizeof(EdgeLabel<T>));
    stream.read(reinterpret_cast<char*>(&G.L_[0]), elements*sizeof(EdgeLabel<T>));
}

template<class T>
void VGraphIO<T>::write_serial_IA(const VGraph<T> & G, std::ostream & stream)const
{
    G.getIA().write_serial(stream);
}

template<class T>
void VGraphIO<T>::write_serial_JA(const VGraph<T> & G, std::ostream & stream)const
{
    std::vector<Index> JA = G.getJA();
    Index JAlength = JA.size();
    stream.write(reinterpret_cast<const char*>(&JAlength), sizeof(Index));
    stream.write(reinterpret_cast<const char*>(&JA[0]), JAlength*sizeof(Index));
}

template<class T>
void VGraphIO<T>::write_serial_A(const VGraph<T> & G, std::ostream & stream)const
{
    std::vector<Value> A = G.getA();
    Index Alength = A.size();
    stream.write(reinterpret_cast<const char*>(&Alength), sizeof(Index));
    stream.write(reinterpret_cast<const char*>(&A[0]), Alength*sizeof(Value));
}

template<class T>
void VGraphIO<T>::write_serial_contextVersion(const VGraph<T> & G, std::ostream & stream)const
{
      stream.write(reinterpret_cast<const char*>(&G.context_), sizeof(Context));
      stream<<G.versionsData_;
}

template<class T>
void VGraphIO<T>::read_serial_IA(VGraph<T> & G, std::istream & stream)const
{
    G.IA_.read_serial(stream);
}

template<class T>
void VGraphIO<T>::read_serial_JA(VGraph<T> & G, std::istream & stream)const
{
    Index tempLength;
    stream.read(reinterpret_cast<char*>(&tempLength), sizeof(Index));
    G.JA_.resize(tempLength);
    stream.read(reinterpret_cast<char*>(&G.JA_[0]), tempLength*sizeof(Index));
}

template<class T>
void VGraphIO<T>::read_serial_A(VGraph<T> & G, std::istream & stream)const
{
    Index tempLength;
    stream.read(reinterpret_cast<char*>(&tempLength), sizeof(Index));
    G.A_.resize(tempLength);
    stream.read(reinterpret_cast<char*>(&G.A_[0]), tempLength*sizeof(Value));
}

template<class T>
void VGraphIO<T>::read_serial_contextVersion(VGraph<T> & G, std::istream & stream)const
{
    stream.read(reinterpret_cast<char*>(&G.context_), sizeof(Context));
    stream>>G.versionsData_;
}

template<class T>
void VGraphIO<T>::write_serial_IA_CSR(const VGraph<T> & G, std::ostream & stream)const
{
    //NOTE: this function assumes a single version extracted graph (no split rows) (empty v0)
    std::vector<AugIA<T>> IA = G.getIA(1); 
    std::vector<Index> IAcsr;
    IAcsr.push_back(0);
    
    for(const auto& e : IA)
        IAcsr.push_back(e.s2());
    
    Index IAlength = IAcsr.size();
    stream.write(reinterpret_cast<const char*>(&IAlength), sizeof(Index));
    stream.write(reinterpret_cast<const char*>(&IA[0]), IAlength*sizeof(Index));
}

template<class T>
void VGraphIO<T>::write_csr(const VGraph<T> & G, std::ostream & stream)const
{
    std::vector<Index> JA = G.getJA();
    std::vector<Value> A = G.getA();
    std::vector<AugIA<T>> IA = G.getIA().getIA();

    std::cout<<"A: ";
    for(int i=0; i<A.size(); ++i)
    {
        std::cout<<A[i]<<" ";
    }
    std::cout<<std::endl;
    std::cout<<"JA: ";
    for(int i=0; i<JA.size(); ++i)
        std::cout<<i<<"("<<JA[i]<<") ";
    std::cout<<std::endl;
    std::cout<<"IA: ";
    for(int i=0; i<IA.size(); ++i)
    {
        if(IA[i].isCompressed())
            std::cout<<i<<"("<<IA[i].s1()<<" "<<IA[i].s2()<<" ["<<"C"/*IA[i].flag()*/<<"] ) ";
        else if(IA[i].isSplitRow())
            std::cout<<i<<"("<<IA[i].s1()<<" "<<IA[i].s2()<<" "<<IA[i].s3()<<" "<<IA[i].s4()<<" ["<<"S"/*IA[i].flag()*/<<"] ) ";
        else
            std::cout<<i<<"("<<IA[i].s1()<<" "<<IA[i].s2()<<" ["<<"N"/*IA[i].flag()*/<<"] ) ";
        
    }
        //cout<<i<<"("<<IA_[i].begin<<" "<<IA_[i].end<<") ";
    std::cout<<std::endl;
    std::cout<<std::endl;
}



template<class T>
int VGraphIO<T>::write_csr(std::string csrFileName)const
{
     mkdir(csrFileName.c_str(), S_IRWXU);
    //NOTE: this function assumes a single version extracted graph (no split rows) (empty v0)
    
   // std::cout<<"mkdir"<<std::endl;
     
    std::ofstream OF;
        //Write the node label data
        OF.open(csrFileName + "/nodes");
        graph_->vertexData_.write_serial(OF);

    OF.close();
    
    
 //Write the IA vectors
    OF.open(csrFileName + "/iavec");
        write_serial_IA_CSR(*graph_, OF);
    OF.close();
    
    //Write the A vectors
    OF.open(csrFileName + "/avec");
        write_serial_A(*graph_, OF);
    OF.close();
    
    //Write the JA vectors
    OF.open(csrFileName + "/javec");
        write_serial_JA(*graph_, OF);
    OF.close();
            
    return 0;
}
