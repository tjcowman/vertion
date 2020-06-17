#pragma once

template<class T1, class T2>
class BiMap
{
  public:
    BiMap();
    BiMap(std::string filename);
    BiMap(std::istream& is);
    
    auto begin()const;
    auto end()const;

    void insert(std::pair<T1,T2> e);

    const auto findf(const T1& key)const;
    const auto findr(const T2& key)const;

  private:
    std::map<T1, T2> forward_;
    std::map<T2, T1> reverse_;
};

template<class T1, class T2>
BiMap<T1,T2>::BiMap()
{
    
}

template<class T1, class T2>
BiMap<T1,T2>::BiMap(std::string filename)
{
    std::ifstream is(filename);
    while(true)
    {
        T1 s1;
        T2 s2;

        is>>s1>>s2;

        if(is.eof())
        return;
        else
        insert(std::make_pair(s1,s2));
    }

}

template<class T1, class T2>
BiMap<T1,T2>::BiMap(std::istream& is)
{
    while(true)
    {
        T1 s1;
        T2 s2;

        is>>s1>>s2;

        if(is.eof())
            return;
        else
            insert(std::make_pair(s1,s2));
    }
}

template<class T1, class T2>
void BiMap<T1,T2>::insert(std::pair<T1, T2> e)
{
  forward_.insert(e);
  reverse_.insert(std::make_pair(e.second, e.first));
}

template<class T1, class T2>
auto BiMap<T1,T2>::begin()const
{
  return forward_.begin();
}


template<class T1, class T2>
auto BiMap<T1,T2>::end()const
{
  return forward_.end();
}

template<class T1, class T2>
const auto BiMap<T1,T2>::findf(const T1& key)const
{
  auto it = forward_.find(key);
  if(it ==forward_.end())
    return end();
  else
    return it;
}

template<class T1, class T2>
const auto BiMap<T1,T2>::findr(const T2& key)const
{
  auto it = reverse_.find(key);
  if(it == reverse_.end())
    return end();
  else
    return it;
}
