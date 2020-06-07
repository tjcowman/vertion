#pragma once

class BiMap
{
  public:

    BiMap(std::string filename);
    auto end()const;

    void insert(std::pair<std::string,std::string> e);

    const auto findf(const std::string& key)const;
    const auto findr(const std::string& key)const;

  private:
    std::map<std::string, std::string> forward_;
    std::map<std::string, std::string> reverse_;
};

BiMap::BiMap(std::string filename)
{
  std::ifstream is(filename);
  while(true)
  {
    std::string s1;
    std::string s2;

    is>>s1>>s2;

    if(is.eof())
      return;
    else
      insert(std::make_pair(s1,s2));
  }
}

void BiMap::insert(std::pair<std::string,std::string> e)
{
  forward_.insert(e);
  reverse_.insert(std::make_pair(e.second, e.first));
}

auto BiMap::end()const
{
  return forward_.end();
}

const auto BiMap::findf(const std::string& key)const
{
  auto it = forward_.find(key);
  if(it ==forward_.end())
    return end();
  else
    return it;
}

const auto BiMap::findr(const std::string& key)const
{
  auto it = reverse_.find(key);
  if(it == reverse_.end())
    return end();
  else
    return it;
}
