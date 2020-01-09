#pragma once

//Note, last 3 bits are flags for [Compressed | SplitRow | Normal]

enum RangeFlags : uint8_t
{
    COMPRESSED = 0x4,
    SPLITROW = 0x2,
    NORMAL = 0x1
};



//STORES THE INDEX AND THEN THE LENGTH FOR POTENTIALLY 2 SEGMENTS
template<class GT>
class AugIA
{
    public:
        using Index = typename GT::Index;
        
        //Denotes invalid Range
        AugIA()
        {
            s1_ = 0;
            s2_ = 0;
            s3_ = 0;
            s4_ = NORMAL;
        }
        
        //Construct a standard range
        AugIA(Index s1, Index s2)
        {
            s1_ = s1;
            s2_ = s2;
            s3_ = 0;
            s4_ = NORMAL;
        }
        
        //Pretty Sure this is only used to set a range as being compressed on not //TODO: make sure
        AugIA(Index s1, Index s2, uint8_t flags)
        {
            s1_ = s1;
            s2_ = s2;
            s3_ = 0;
            s4_ = flags;
        }
        
        AugIA(Index s1, Index s2, Index s3, Index s4, uint8_t flags)
        {
            s1_ = s1;
            s2_ = s2;
            s3_ = s3;
            s4_ = (s4<<flagWidth) + flags;
            
        }
        
        AugIA(const AugIA & cpy)
        {
            s1_ = cpy.s1_;
            s2_ = cpy.s2_;
            s3_ = cpy.s3_;
            s4_ = cpy.s4_;
        }
        
        
        Index s1()const 
        {
            return s1_;
        }
        Index s2()const
        {
            return s2_;
        }
        Index s3()const
        {
            return s3_;
        }
        Index s4()const
        {
            return (s4_>>flagWidth);
        }
        Index flag()const
        {
            return flags();
        }
        
        bool isCompressed()const 
        {
            return (flags() & COMPRESSED) > 0;
        }
        bool isSplitRow()const
        {
            //std::cout<<(int)flags()<< " : " <<SPLITROW<< " = "<< (flags() & SPLITROW)<<std::endl;;
            return (flags() & SPLITROW) > 0;
        }

        
        bool operator ==(const AugIA & rhs)const
        {
            return ((s1_ == rhs.s1_) && (s2_ == rhs.s2_) && (s3_ == rhs.s3_) && (s4_ == rhs.s4_) );
        }
        
        bool operator !=(const AugIA & rhs)const
        {
            return !(*this == rhs);
        }
        
        bool operator <(const AugIA & rhs)const
        {
            return std::tie(s1_, s2_) < std::tie(rhs.s1_, rhs.s2_);
        }
    
        
        
        friend std::ostream& operator<<(std::ostream & out, const AugIA & range)
        {
           // out<<"("<<range.s1_<<","<<range.s2_<<","<<range.s3_<<","<<range.s4()<<","<<range.flag()<<")";
            
            if(range.isCompressed())
                out<<"("<<range.s1()<<" "<<range.s2()<<" ["<<"C"/*IA[i].flag()*/<<"] ) ";
            else if(range.isSplitRow())
                out<<"("<<range.s1()<<" "<<range.s2()<<" "<<range.s3()<<" "<<range.s4()<<" ["<<"S"/*IA[i].flag()*/<<"] ) ";
            else
                out<<"("<<range.s1()<<" "<<range.s2()<<" ["<<"N"/*IA[i].flag()*/<<"] ) ";
                
            return out;
        }
        
    private:
        
        //Extracts the flag portion of the s4 segment using bit masking
        uint8_t flags()const
        {
            return (s4_ & (Index)((1<<(flagWidth))-1));
        }
        
        Index s1_;
        Index s2_;
        Index s3_;
        static const Index flagWidth = 3;
        uint64_t s4_;
};
