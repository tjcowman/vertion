#pragma once

/** @struct DisjointIterator
*  Used to iterate over rows in the versioned graph where the row may be a split row
*/
template<class T>
class DisjointIterator
{
    public:
        DisjointIterator(const typename std::vector<T>::const_iterator& it1, const typename std::vector<T>::const_iterator& e1, const typename std::vector<T>::const_iterator& jmp)
        {
            it1_ = it1;
            e1_ = e1;
            jmp_ = jmp;
        }
    
        void operator++()
        {
            if(std::next(it1_) != e1_)
                ++it1_;
            else
            {
                //cout<<"JMP"<<endl;
                it1_ = jmp_;
            }
        }
        
        const T& operator*()const
        {
            return *it1_;
        }
        const T& operator->()const
        {
            return *it1_;
        }
        
        bool operator==(const DisjointIterator& rhs)const
        {
            return it1_ == rhs.it1_;
        }
        
        bool operator==(typename std::vector<T>::const_iterator& rhs)const
        {
            return it1_ == rhs;
        }
        
        bool operator!=(const DisjointIterator& rhs)const
        {
            return !operator==(rhs);
        }
        
        bool operator!=(typename std::vector<T>::const_iterator& rhs)const
        {
             return !operator==(rhs);
        }
        
    private:
        
        typename std::vector<T>::const_iterator it1_;
        typename std::vector<T>::const_iterator e1_;
        typename std::vector<T>::const_iterator jmp_;
};
