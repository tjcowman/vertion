#pragma once
#include <bitset>
#include <sstream>
#include <array>
#include <map>
//Used to give edges and vertexes their own label sets
enum class LabelGroup{edge, vertex};

template<class T> class VGraphIO;

template <LabelGroup L, class GT>
class Labels
{
    
    friend class VGraphIO<GT>; //
    
    public:
        Labels();
        Labels(std::bitset<GT::LabelSize> bits);
        Labels(int bit);
        
        Labels<L,GT> recode(const std::map<typename GT::Index, typename GT::Index>& mapping)const;
        
        static Labels<L,GT> maskAll();
        
//         static size_t size();
        static constexpr size_t maxSize();
        
        int operator[](int i)const;
        bool operator==(const Labels& rhs)const;
        bool operator<(const Labels& rhs)const;
        
        const std::bitset<GT::LabelSize>& getBits()const;
        
        
        bool hasLabel(int i)const;
        bool testAll(const std::vector<int>& labelIndexes)const;
        bool testAny(const std::vector<int>& labelIndexes)const;
        
        int getSetLS()const;
        
        static int addLabel(std::string s);
        
        void add(int i);
        void add(std::string s);
        
        Labels<L,GT> makeUnion(const Labels<L,GT>& rhs)const;
        
        
//         std::string toString(std::string delim = ",")const;
        
        
        std::ostream& write_serial(std::ostream& os)const
        {
            os<<bits_.to_ulong();
            return os;
        }
        
        std::istream& read_serial(std::istream& is)
        {
            ulong bits;
            is>>bits;
            bits_ = bits;
            return is;
        }
        
        friend std::ostream& operator<<(std::ostream& os, const Labels& e)
        {
            //os<<e.toString();
            os<<e.bits_;
            return os;

        }
        
    private:
        std::bitset<GT::LabelSize> bits_;
        
        //static int slotsUsed_;
        //static std::array<std::string, GT::LabelSize> names_; 

        //T::Labels bits_;
};

template <class T>
using EdgeLabel = Labels<LabelGroup::edge, T>;
template <class T>
using VertexLabel = Labels<LabelGroup::vertex, T>;


template <LabelGroup L, class T>
Labels<L,T>::Labels()
{
    bits_ = std::bitset<T::LabelSize>();
}

template <LabelGroup L, class T>
Labels<L,T>::Labels(std::bitset<T::LabelSize> bits)
{
    bits_= bits;
}

template <LabelGroup L, class T>
Labels<L,T>::Labels(int bit)
{
    add(bit);
}

template <LabelGroup L, class GT> 
Labels<L,GT> Labels<L,GT>::recode(const std::map<typename GT::Index, typename GT::Index>& mapping)const 
{
    Labels<L,GT> retVal;
    
    for(const auto& e : mapping) //old -> new mapping
    {
        if(bits_.test(e.first))
        {
            retVal.bits_.reset(e.first);
            retVal.bits_.set(e.second);
        }
    }
    return retVal;
}

template <LabelGroup L, class T>
Labels<L,T> Labels<L,T>::maskAll()
{
   std::bitset<T::LabelSize> mask;
   //for(size_t i=0; i< slotsUsed_; ++i)
       mask.set();
    
    return Labels<L,T>(mask);
}

template <LabelGroup L, class T>
const std::bitset<T::LabelSize>& Labels<L,T>::getBits()const
{
    return bits_;
}

template <LabelGroup L, class T>
constexpr size_t Labels<L,T>::maxSize()
{
    return T::LabelSize;//bits_.Labels.size();
}

template <LabelGroup L, class T>
int Labels<L,T>::operator[](int i)const
{
    return bits_[i];
}

template <LabelGroup L, class T>
bool Labels<L,T>::operator==(const Labels& rhs)const
{
    return bits_ == rhs.bits_;
}

template <LabelGroup L, class T>
bool Labels<L,T>::operator<(const Labels& rhs)const
{
    return bits_.to_ulong() < rhs.bits_.to_ulong();
}

template <LabelGroup L, class T>
bool Labels<L,T>::hasLabel(int i)const
{
    return bits_.test(i);
}

template <LabelGroup L, class T>
bool  Labels<L,T>::testAll(const std::vector<int>& labelIndexes)const
{
    for(const auto& e : labelIndexes)
        if(!hasLabel(e))
            return false;
        
    return true;
}

template <LabelGroup L, class T>
bool  Labels<L,T>::testAny(const std::vector<int>& labelIndexes)const
{
    for(const auto& e : labelIndexes)
         if(hasLabel(e))
             return true;
    return false;
}

template <LabelGroup L, class T>
int Labels<L,T>::getSetLS()const
{
    int count=0;
   // auto bits = bits_;
    while(count < bits_.size())
    {
        auto shift = bits_ >> count;
        if((shift[0]) == 1)
        {
            //std::cout<<"LS "<<count<<std::endl;
            return count;
        }
        else
            ++count;
        

    }
    return -1;
}



template <LabelGroup L, class T>
void Labels<L,T>::add(int i)
{
    bits_.set(i);
}

template <LabelGroup L, class T>
void add(std::string s)
{
 //  bits_.set();
}

template <LabelGroup L, class T>
Labels<L,T> Labels<L,T>::makeUnion(const Labels<L,T>& rhs)const
{
    return Labels<L,T>(bits_ | rhs.bits_ );
}

// template <LabelGroup L, class T>
// std::string Labels<L,T>::toString(std::string delim)const 
// {
//     std::stringstream SS;
//     //get highest bit set (actually count number )
//     size_t bitsSet = bits_.count();
//     size_t printed = 0;
//     
//     int i=0;
//     for(; i<size(); ++i)
//     {
//         if(printed==bitsSet-1)
//             break;
//         
//         if(bits_[i]==1)
//         {
//             //SS<<names_.at(i)<<delim;
//             SS<<"D"<<delim;
//             ++printed;
//         }
//     }
//     
//     //print the final without delimiter
//     for(; i<size(); ++i)
//     {
//         if(bits_[i]==1)
// //             SS<<names_.at(i);
//             SS<<"D";
//     }
//         
//     return (SS.str());
// }
